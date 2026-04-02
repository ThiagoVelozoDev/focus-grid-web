import { useCallback, useEffect, useMemo, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from './useAuth'

export type CatalogType = 'responsaveis' | 'locais'

export type CatalogItem = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

type UseCatalogResult = {
  items: string[]
  entries: CatalogItem[]
  loading: boolean
  errorMessage: string | null
  addItem: (name: string) => Promise<void>
  updateItem: (id: string, name: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ')

const getFirestoreErrorMessage = (error: unknown, type: CatalogType) => {
  if (error instanceof FirebaseError && error.code === 'permission-denied') {
    return `Sem permissao no Firestore para ${type}. Verifique as regras da colecao users/{uid}/${type}.`
  }

  return 'Nao foi possivel acessar o catalogo no Firestore. Tente novamente.'
}

export function useCatalog(type: CatalogType): UseCatalogResult {
  const { user } = useAuth()
  const [entries, setEntries] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const catalogCollection = useMemo(() => {
    if (!user) {
      return null
    }

    return collection(db, 'users', user.uid, type)
  }, [type, user])

  useEffect(() => {
    if (!catalogCollection) {
      setEntries([])
      setLoading(false)
      setErrorMessage(null)
      return
    }

    const catalogQuery = query(catalogCollection, orderBy('name', 'asc'))

    const unsubscribe = onSnapshot(
      catalogQuery,
      (snapshot) => {
        const nextEntries = snapshot.docs
          .map((entry) => {
            const data = entry.data() as Partial<CatalogItem>
            return {
              id: entry.id,
              name: normalizeName(typeof data.name === 'string' ? data.name : ''),
              createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
              updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
            }
          })
          .filter((item) => item.name.length > 0)

        setEntries(nextEntries)
        setErrorMessage(null)
        setLoading(false)
      },
      (error) => {
        setEntries([])
        setLoading(false)
        setErrorMessage(getFirestoreErrorMessage(error, type))
      },
    )

    return unsubscribe
  }, [catalogCollection])

  const addItem = useCallback(
    async (name: string) => {
      if (!catalogCollection) {
        return
      }

      const normalized = normalizeName(name)
      if (!normalized) {
        return
      }

      const now = new Date().toISOString()

      try {
        await addDoc(catalogCollection, {
          name: normalized,
          createdAt: now,
          updatedAt: now,
        })
      } catch (error) {
        throw new Error(getFirestoreErrorMessage(error, type))
      }
    },
    [catalogCollection, type],
  )

  const updateItem = useCallback(
    async (id: string, name: string) => {
      if (!catalogCollection) {
        return
      }

      const normalized = normalizeName(name)
      if (!normalized) {
        return
      }

      try {
        await updateDoc(doc(catalogCollection, id), {
          name: normalized,
          updatedAt: new Date().toISOString(),
        })
      } catch (error) {
        throw new Error(getFirestoreErrorMessage(error, type))
      }
    },
    [catalogCollection, type],
  )

  const deleteItem = useCallback(
    async (id: string) => {
      if (!catalogCollection) {
        return
      }

      try {
        await deleteDoc(doc(catalogCollection, id))
      } catch (error) {
        throw new Error(getFirestoreErrorMessage(error, type))
      }
    },
    [catalogCollection, type],
  )

  return {
    items: entries.map((item) => item.name),
    entries,
    loading,
    errorMessage,
    addItem,
    updateItem,
    deleteItem,
  }
}
