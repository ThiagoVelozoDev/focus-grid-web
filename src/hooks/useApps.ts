import { useCallback, useEffect, useMemo, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from './useAuth'

export type App = {
  id: string
  name: string
  url: string
  photo: string
  description: string
  createdAt: string
  updatedAt: string
}

export type AppFormData = Omit<App, 'id' | 'createdAt' | 'updatedAt'>

type UseAppsResult = {
  apps: App[]
  loading: boolean
  errorMessage: string | null
  addApp: (data: AppFormData) => Promise<void>
  updateApp: (id: string, data: AppFormData) => Promise<void>
  deleteApp: (id: string) => Promise<void>
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError && error.code === 'permission-denied') {
    return 'Sem permissão para acessar os aplicativos. Verifique as regras do Firestore.'
  }
  return 'Não foi possível acessar os aplicativos. Tente novamente.'
}

export function useApps(): UseAppsResult {
  const { user } = useAuth()
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const appsCollection = useMemo(() => {
    if (!user) return null
    return collection(db, 'users', user.uid, 'apps')
  }, [user])

  useEffect(() => {
    if (!appsCollection) {
      setApps([])
      setLoading(false)
      return
    }

    const appsQuery = query(appsCollection, orderBy('name', 'asc'))

    const unsubscribe = onSnapshot(
      appsQuery,
      (snapshot) => {
        const nextApps = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Partial<App>
          return {
            id: docSnap.id,
            name: typeof data.name === 'string' ? data.name.trim() : '',
            url: typeof data.url === 'string' ? data.url.trim() : '',
            photo: typeof data.photo === 'string' ? data.photo.trim() : '',
            description: typeof data.description === 'string' ? data.description.trim() : '',
            createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
            updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
          }
        })
        setApps(nextApps)
        setErrorMessage(null)
        setLoading(false)
      },
      (error) => {
        setApps([])
        setLoading(false)
        setErrorMessage(getErrorMessage(error))
      },
    )

    return unsubscribe
  }, [appsCollection])

  const addApp = useCallback(
    async (data: AppFormData) => {
      if (!appsCollection) return
      const now = new Date().toISOString()
      try {
        await addDoc(appsCollection, { ...data, createdAt: now, updatedAt: now })
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [appsCollection],
  )

  const updateApp = useCallback(
    async (id: string, data: AppFormData) => {
      if (!appsCollection) return
      try {
        await updateDoc(doc(appsCollection, id), { ...data, updatedAt: new Date().toISOString() })
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [appsCollection],
  )

  const deleteApp = useCallback(
    async (id: string) => {
      if (!appsCollection) return
      try {
        await deleteDoc(doc(appsCollection, id))
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [appsCollection],
  )

  return { apps, loading, errorMessage, addApp, updateApp, deleteApp }
}
