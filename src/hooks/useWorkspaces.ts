import { useCallback, useEffect, useMemo, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, writeBatch } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from './useAuth'
import type { Workspace, WorkspaceKind } from '../types/workspace'

const nowIso = () => new Date().toISOString()
const WORKSPACE_STORAGE_PREFIX = 'focus-grid-active-workspace'
export const LEGACY_DEFAULT_WORKSPACE_ID = 'workspace-work'
export const LEGACY_PERSONAL_WORKSPACE_ID = 'workspace-personal'
export const DEFAULT_WORKSPACE_ID = ''
const DEFAULT_WORKSPACE_NAME = 'Amazonas Energia'

const normalizeWorkspace = (id: string, rawValue: unknown): Workspace => {
  const raw = typeof rawValue === 'object' && rawValue !== null ? (rawValue as Record<string, unknown>) : {}

  return {
    id,
    name: typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim() : 'Workspace sem nome',
    kind: raw.kind === 'work' ? 'work' : 'personal',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : nowIso(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : nowIso(),
  }
}

const getRecoveredWorkspaceData = (workspaceId: string): Pick<Workspace, 'name' | 'kind'> => {
  if (workspaceId === LEGACY_DEFAULT_WORKSPACE_ID) {
    return {
      name: DEFAULT_WORKSPACE_NAME,
      kind: 'work',
    }
  }

  if (workspaceId === LEGACY_PERSONAL_WORKSPACE_ID) {
    return {
      name: 'Pessoal',
      kind: 'personal',
    }
  }

  return {
    name: 'Workspace recuperado',
    kind: 'work',
  }
}

const getWorkspaceErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError && error.code === 'permission-denied') {
    return 'Sem permissao no Firestore para workspaces. Libere a colecao users/{uid}/workspaces nas regras do Firestore.'
  }

  return 'Nao foi possivel acessar os workspaces no Firestore. Tente novamente.'
}

type UseWorkspacesResult = {
  workspaces: Workspace[]
  activeWorkspaceId: string
  activeWorkspace: Workspace | null
  loading: boolean
  errorMessage: string | null
  setActiveWorkspaceId: (workspaceId: string) => void
  addWorkspace: (name: string, kind: WorkspaceKind) => Promise<void>
}

export function useWorkspaces(): UseWorkspacesResult {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(DEFAULT_WORKSPACE_ID)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const workspacesCollection = useMemo(() => {
    if (!user) {
      return null
    }

    return collection(db, 'users', user.uid, 'workspaces')
  }, [user])

  const storageKey = user ? `${WORKSPACE_STORAGE_PREFIX}-${user.uid}` : WORKSPACE_STORAGE_PREFIX

  useEffect(() => {
    if (!user) {
      setWorkspaces([])
      setActiveWorkspaceIdState(DEFAULT_WORKSPACE_ID)
      setLoading(false)
      setErrorMessage(null)
      return
    }

    setWorkspaces([])
    setActiveWorkspaceIdState(DEFAULT_WORKSPACE_ID)
    setLoading(true)
    setErrorMessage(null)
  }, [user?.uid])

  useEffect(() => {
    if (!workspacesCollection || !user) {
      return
    }

    const workspacesQuery = query(workspacesCollection, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(
      workspacesQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          const tasksSnapshot = await getDocs(collection(db, 'users', user.uid, 'tasks'))
          const recoveredWorkspaceIds = new Set<string>()

          for (const entry of tasksSnapshot.docs) {
            const data = entry.data() as Record<string, unknown>
            const workspaceId =
              typeof data.workspaceId === 'string' && data.workspaceId.trim().length > 0
                ? data.workspaceId.trim()
                : LEGACY_DEFAULT_WORKSPACE_ID

            recoveredWorkspaceIds.add(workspaceId)
          }

          if (recoveredWorkspaceIds.size > 0) {
            const timestamp = nowIso()
            const batch = writeBatch(db)

            for (const workspaceId of recoveredWorkspaceIds) {
              const recoveredWorkspace = getRecoveredWorkspaceData(workspaceId)
              batch.set(
                doc(workspacesCollection, workspaceId),
                {
                  name: recoveredWorkspace.name,
                  kind: recoveredWorkspace.kind,
                  createdAt: timestamp,
                  updatedAt: timestamp,
                },
                { merge: true },
              )
            }

            await batch.commit()
            return
          }
        }

        const nextWorkspaces = snapshot.docs.map((entry) => normalizeWorkspace(entry.id, entry.data()))

        setWorkspaces(nextWorkspaces)
        setLoading(false)
        setErrorMessage(null)

        const savedWorkspaceId = window.localStorage.getItem(storageKey)

        setActiveWorkspaceIdState((current) => {
          if (nextWorkspaces.length === 0) {
            window.localStorage.removeItem(storageKey)
            return DEFAULT_WORKSPACE_ID
          }

          if (nextWorkspaces.some((workspace) => workspace.id === current)) {
            window.localStorage.setItem(storageKey, current)
            return current
          }

          if (savedWorkspaceId && nextWorkspaces.some((workspace) => workspace.id === savedWorkspaceId)) {
            window.localStorage.setItem(storageKey, savedWorkspaceId)
            return savedWorkspaceId
          }

          const fallbackId = nextWorkspaces[0]?.id ?? DEFAULT_WORKSPACE_ID
          if (fallbackId) {
            window.localStorage.setItem(storageKey, fallbackId)
          }
          return fallbackId
        })
      },
      (error) => {
        setWorkspaces([])
        setLoading(false)
        setErrorMessage(getWorkspaceErrorMessage(error))
      },
    )

    return unsubscribe
  }, [storageKey, user, workspacesCollection])

  const setActiveWorkspaceId = useCallback(
    (workspaceId: string) => {
      setActiveWorkspaceIdState(workspaceId)
      window.localStorage.setItem(storageKey, workspaceId)
    },
    [storageKey],
  )

  const addWorkspace = useCallback(
    async (name: string, kind: WorkspaceKind) => {
      if (!workspacesCollection) {
        return
      }

      const normalizedName = name.trim().replace(/\s+/g, ' ')
      if (!normalizedName) {
        return
      }

      const timestamp = nowIso()

      try {
        await addDoc(workspacesCollection, {
          name: normalizedName,
          kind,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      } catch (error) {
        throw new Error(getWorkspaceErrorMessage(error))
      }
    },
    [workspacesCollection],
  )

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [activeWorkspaceId, workspaces],
  )

  return {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    loading,
    errorMessage,
    setActiveWorkspaceId,
    addWorkspace,
  }
}
