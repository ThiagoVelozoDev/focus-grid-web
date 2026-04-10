/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

type SignUpWithEmailInput = {
  name: string
  email: string
  password: string
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (input: SignUpWithEmailInput) => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

async function syncUserProfile(user: User, name?: string) {
  const resolvedName = name?.trim() || user.displayName || user.email?.split('@')[0] || 'Usuário'

  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        name: resolvedName,
        email: user.email ?? '',
        photoURL: user.photoURL ?? null,
        provider: user.providerData[0]?.providerId ?? 'password',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.warn('Falha ao sincronizar perfil do usuário no Firestore.', error)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signInWithGoogle: async () => {
        const credential = await signInWithPopup(auth, googleProvider)
        await syncUserProfile(credential.user)
      },
      signInWithEmail: async (email: string, password: string) => {
        const credential = await signInWithEmailAndPassword(auth, email, password)
        await syncUserProfile(credential.user)
      },
      signUpWithEmail: async ({ name, email, password }: SignUpWithEmailInput) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password)

        await updateProfile(credential.user, {
          displayName: name.trim(),
        })

        await credential.user.reload()
        const nextUser = auth.currentUser ?? credential.user
        setUser(nextUser)
        await syncUserProfile(nextUser, name)
      },
      signOutUser: async () => {
        await signOut(auth)
      },
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }

  return context
}