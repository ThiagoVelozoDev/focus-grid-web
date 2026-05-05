import { useCallback, useEffect, useMemo, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from './useAuth'

export type Label = {
  id: string
  name: string
  sourceAppId: string | null
  workspaceId: string
  createdAt: string
  updatedAt: string
}

type UseLabelsResult = {
  labels: Label[]
  loading: boolean
  errorMessage: string | null
  addLabel: (name: string) => Promise<void>
  addAppLabel: (appId: string, name: string) => Promise<void>
  updateLabel: (id: string, name: string) => Promise<void>
  deleteLabel: (id: string) => Promise<void>
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError && error.code === 'permission-denied') {
    return 'Sem permissão para acessar as etiquetas. Verifique as regras do Firestore.'
  }
  return 'Não foi possível acessar as etiquetas. Tente novamente.'
}

export function useLabels(workspaceId: string): UseLabelsResult {
  const { user } = useAuth()
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const labelsCollection = useMemo(() => {
    if (!user) return null
    return collection(db, 'users', user.uid, 'labels')
  }, [user])

  useEffect(() => {
    if (!user || !workspaceId) {
      setLabels([])
      setLoading(false)
      setErrorMessage(null)
      return
    }
    setLabels([])
    setLoading(true)
    setErrorMessage(null)
  }, [user?.uid, workspaceId])

  useEffect(() => {
    if (!labelsCollection || !workspaceId) return

    const unsubscribe = onSnapshot(
      query(labelsCollection, orderBy('name', 'asc')),
      (snapshot) => {
        const normalized = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Partial<Label>
          return {
            id: docSnap.id,
            name: typeof data.name === 'string' ? data.name.trim() : '',
            sourceAppId: typeof data.sourceAppId === 'string' ? data.sourceAppId : null,
            workspaceId: typeof data.workspaceId === 'string' ? data.workspaceId : workspaceId,
            createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
            updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
          }
        })
        setLabels(normalized.filter((l) => l.workspaceId === workspaceId))
        setErrorMessage(null)
        setLoading(false)
      },
      (error) => {
        setLabels([])
        setLoading(false)
        setErrorMessage(getErrorMessage(error))
      },
    )

    return unsubscribe
  }, [labelsCollection, workspaceId])

  const addLabel = useCallback(
    async (name: string) => {
      if (!labelsCollection || !workspaceId) return
      const now = new Date().toISOString()
      try {
        await addDoc(labelsCollection, {
          name: name.trim(),
          sourceAppId: null,
          workspaceId,
          createdAt: now,
          updatedAt: now,
        })
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [labelsCollection, workspaceId],
  )

  const addAppLabel = useCallback(
    async (appId: string, name: string) => {
      if (!labelsCollection || !workspaceId) return
      const now = new Date().toISOString()
      try {
        await addDoc(labelsCollection, {
          name: name.trim(),
          sourceAppId: appId,
          workspaceId,
          createdAt: now,
          updatedAt: now,
        })
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [labelsCollection, workspaceId],
  )

  const updateLabel = useCallback(
    async (id: string, name: string) => {
      if (!labelsCollection) return
      try {
        await updateDoc(doc(labelsCollection, id), {
          name: name.trim(),
          updatedAt: new Date().toISOString(),
        })
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [labelsCollection],
  )

  const deleteLabel = useCallback(
    async (id: string) => {
      if (!labelsCollection) return
      try {
        await deleteDoc(doc(labelsCollection, id))
      } catch (error) {
        throw new Error(getErrorMessage(error))
      }
    },
    [labelsCollection],
  )

  return { labels, loading, errorMessage, addLabel, addAppLabel, updateLabel, deleteLabel }
}
