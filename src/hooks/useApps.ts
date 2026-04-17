import { useCallback, useEffect, useMemo, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from './useAuth'

export type App = {
  id: string
  name: string
  url: string
  photo: string
  description: string
  categoryId: string
  workspaceId: string
  createdAt: string
  updatedAt: string
}

export type AppFormData = Omit<App, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>

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

export function useApps(workspaceId: string): UseAppsResult {
  const { user } = useAuth()
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const appsCollection = useMemo(() => {
    if (!user) return null
    return collection(db, 'users', user.uid, 'apps')
  }, [user])

  useEffect(() => {
    if (!user || !workspaceId) {
      setApps([])
      setLoading(false)
      setErrorMessage(null)
      return
    }
    setApps([])
    setLoading(true)
    setErrorMessage(null)
  }, [user?.uid, workspaceId])

  useEffect(() => {
    if (!appsCollection || !workspaceId) return

    const unsubscribe = onSnapshot(
      query(appsCollection, orderBy('name', 'asc')),
      (snapshot) => {
        const legacyDocs = snapshot.docs.filter((d) => {
          const data = d.data() as Partial<App>
          return typeof data.workspaceId !== 'string' || data.workspaceId.trim().length === 0
        })

        if (legacyDocs.length > 0) {
          const batch = writeBatch(db)
          for (const d of legacyDocs) {
            batch.update(doc(appsCollection, d.id), { workspaceId, updatedAt: new Date().toISOString() })
          }
          void batch.commit()
        }

        const nextApps = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as Partial<App>
            return {
              id: docSnap.id,
              name: typeof data.name === 'string' ? data.name.trim() : '',
              url: typeof data.url === 'string' ? data.url.trim() : '',
              photo: typeof data.photo === 'string' ? data.photo.trim() : '',
              description: typeof data.description === 'string' ? data.description.trim() : '',
              categoryId: typeof data.categoryId === 'string' ? data.categoryId : '',
              workspaceId:
                typeof data.workspaceId === 'string' && data.workspaceId.trim().length > 0
                  ? data.workspaceId
                  : workspaceId,
              createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
              updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
            }
          })
          .filter((app) => app.workspaceId === workspaceId)

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
  }, [appsCollection, workspaceId])

  const addApp = useCallback(
    async (data: AppFormData) => {
      if (!appsCollection || !workspaceId) return
      const now = new Date().toISOString()
      try {
        await addDoc(appsCollection, { ...data, workspaceId, createdAt: now, updatedAt: now })
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [appsCollection, workspaceId],
  )

  const updateApp = useCallback(
    async (id: string, data: AppFormData) => {
      if (!appsCollection) return
      try {
        await updateDoc(doc(appsCollection, id), { ...data, workspaceId, updatedAt: new Date().toISOString() })
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [appsCollection, workspaceId],
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
