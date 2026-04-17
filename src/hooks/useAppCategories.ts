import { useCallback, useEffect, useMemo, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from './useAuth'

export type AppCategory = {
  id: string
  name: string
  workspaceId: string
  createdAt: string
  updatedAt: string
}

type UseAppCategoriesResult = {
  categories: AppCategory[]
  loading: boolean
  addCategory: (name: string) => Promise<void>
  updateCategory: (id: string, name: string) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError && error.code === 'permission-denied') {
    return 'Sem permissão para acessar as categorias.'
  }
  return 'Não foi possível acessar as categorias. Tente novamente.'
}

export function useAppCategories(workspaceId: string): UseAppCategoriesResult {
  const { user } = useAuth()
  const [categories, setCategories] = useState<AppCategory[]>([])
  const [loading, setLoading] = useState(true)

  const col = useMemo(() => {
    if (!user) return null
    return collection(db, 'users', user.uid, 'appCategories')
  }, [user])

  useEffect(() => {
    if (!user || !workspaceId) {
      setCategories([])
      setLoading(false)
      return
    }
    setCategories([])
    setLoading(true)
  }, [user?.uid, workspaceId])

  useEffect(() => {
    if (!col || !workspaceId) return

    const unsubscribe = onSnapshot(
      query(col, orderBy('name', 'asc')),
      (snapshot) => {
        const legacyDocs = snapshot.docs.filter((d) => {
          const data = d.data() as Partial<AppCategory>
          return typeof data.workspaceId !== 'string' || data.workspaceId.trim().length === 0
        })

        if (legacyDocs.length > 0) {
          const batch = writeBatch(db)
          for (const d of legacyDocs) {
            batch.update(doc(col, d.id), { workspaceId, updatedAt: new Date().toISOString() })
          }
          void batch.commit()
        }

        setCategories(
          snapshot.docs
            .map((d) => {
              const data = d.data() as Partial<AppCategory>
              return {
                id: d.id,
                name: typeof data.name === 'string' ? data.name.trim() : '',
                workspaceId:
                  typeof data.workspaceId === 'string' && data.workspaceId.trim().length > 0
                    ? data.workspaceId
                    : workspaceId,
                createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
                updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
              }
            })
            .filter((cat) => cat.workspaceId === workspaceId),
        )
        setLoading(false)
      },
      () => setLoading(false),
    )

    return unsubscribe
  }, [col, workspaceId])

  const addCategory = useCallback(
    async (name: string) => {
      if (!col || !workspaceId) return
      const now = new Date().toISOString()
      try {
        await addDoc(col, { name: name.trim(), workspaceId, createdAt: now, updatedAt: now })
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [col, workspaceId],
  )

  const updateCategory = useCallback(
    async (id: string, name: string) => {
      if (!col) return
      try {
        await updateDoc(doc(col, id), { name: name.trim(), updatedAt: new Date().toISOString() })
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [col],
  )

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!col) return
      try {
        await deleteDoc(doc(col, id))
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [col],
  )

  return { categories, loading, addCategory, updateCategory, deleteCategory }
}
