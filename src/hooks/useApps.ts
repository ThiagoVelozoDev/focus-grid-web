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
  order: number
  createdAt: string
  updatedAt: string
}

export type AppFormData = Omit<App, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId' | 'order'>

type UseAppsResult = {
  apps: App[]
  loading: boolean
  errorMessage: string | null
  addApp: (data: AppFormData) => Promise<void>
  updateApp: (id: string, data: AppFormData) => Promise<void>
  deleteApp: (id: string) => Promise<void>
  reorderApps: (appIds: string[]) => Promise<void>
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
        const legacyWorkspaceDocs = snapshot.docs.filter((d) => {
          const data = d.data() as Partial<App>
          return typeof data.workspaceId !== 'string' || data.workspaceId.trim().length === 0
        })
        const legacyOrderDocs = snapshot.docs.filter((d) => typeof d.data().order !== 'number')

        if (legacyWorkspaceDocs.length > 0 || legacyOrderDocs.length > 0) {
          const batch = writeBatch(db)
          const toUpdate = new Set([...legacyWorkspaceDocs.map((d) => d.id), ...legacyOrderDocs.map((d) => d.id)])
          let idx = 0
          for (const d of snapshot.docs) {
            if (toUpdate.has(d.id)) {
              const data = d.data() as Partial<App>
              batch.update(doc(appsCollection, d.id), {
                workspaceId: typeof data.workspaceId === 'string' && data.workspaceId.trim().length > 0 ? data.workspaceId : workspaceId,
                order: typeof data.order === 'number' ? data.order : idx * 1000,
                updatedAt: new Date().toISOString(),
              })
            }
            idx++
          }
          void batch.commit()
        }

        const normalized = snapshot.docs.map((docSnap, index) => {
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
            order: typeof data.order === 'number' ? data.order : index * 1000,
            createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
            updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
          }
        })

        const filtered = normalized
          .filter((app) => app.workspaceId === workspaceId)
          .sort((a, b) => a.order - b.order)

        setApps(filtered)
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
        await addDoc(appsCollection, { ...data, workspaceId, order: Date.now(), createdAt: now, updatedAt: now })
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

  const reorderApps = useCallback(
    async (appIds: string[]) => {
      if (!appsCollection) return
      const batch = writeBatch(db)
      appIds.forEach((id, index) => {
        batch.update(doc(appsCollection, id), { order: index * 1000, updatedAt: new Date().toISOString() })
      })
      await batch.commit()
    },
    [appsCollection],
  )

  return { apps, loading, errorMessage, addApp, updateApp, deleteApp, reorderApps }
}
