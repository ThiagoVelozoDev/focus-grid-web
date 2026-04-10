import { useCallback, useEffect, useMemo, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from './useAuth'
import type { Workspace, WorkspaceKind } from '../types/workspace'

const nowIso = () => new Date().toISOString()
const WORKSPACE_STORAGE_PREFIX = 'focus-grid-active-workspace'
export const DEFAULT_WORKSPACE_ID = 'workspace-work'
const DEFAULT_WORKSPACE_NAME = 'Amazonas Energia'
const DEFAULT_PERSONAL_WORKSPACE_ID = 'workspace-personal'

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

const buildFallbackWorkspaces = (): Workspace[] => {
  const timestamp = nowIso()

  return [
    {
      id: DEFAULT_WORKSPACE_ID,
      name: DEFAULT_WORKSPACE_NAME,
      kind: 'work',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: DEFAULT_PERSONAL_WORKSPACE_ID,
      name: 'Pessoal',
      kind: 'personal',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
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
  const [workspaces, setWorkspaces] = useState<Workspace[]>(buildFallbackWorkspaces)
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
    if (!workspacesCollection) {
      return
    }

    const ensureDefaultWorkspaces = async () => {
      try {
        const snapshot = await getDocs(workspacesCollection)
        const timestamp = nowIso()
        const workspaceWorkDoc = snapshot.docs.find((entry) => entry.id === DEFAULT_WORKSPACE_ID)
        const workspacePersonalDoc = snapshot.docs.find((entry) => entry.id === DEFAULT_PERSONAL_WORKSPACE_ID)

        await Promise.all([
          setDoc(
            doc(workspacesCollection, DEFAULT_WORKSPACE_ID),
            {
              name: DEFAULT_WORKSPACE_NAME,
              kind: 'work',
              createdAt:
                typeof workspaceWorkDoc?.data().createdAt === 'string'
                  ? workspaceWorkDoc.data().createdAt
                  : timestamp,
              updatedAt: timestamp,
            },
            { merge: true },
          ),
          setDoc(
            doc(workspacesCollection, DEFAULT_PERSONAL_WORKSPACE_ID),
            {
              name: typeof workspacePersonalDoc?.data().name === 'string' ? workspacePersonalDoc.data().name : 'Pessoal',
              kind: 'personal',
              createdAt:
                typeof workspacePersonalDoc?.data().createdAt === 'string'
                  ? workspacePersonalDoc.data().createdAt
                  : timestamp,
              updatedAt: timestamp,
            },
            { merge: true },
          ),
        ])
      } catch (error) {
        setWorkspaces(buildFallbackWorkspaces())
        setLoading(false)
        setErrorMessage(getWorkspaceErrorMessage(error))
      }
    }

    void ensureDefaultWorkspaces()
  }, [workspacesCollection])

  useEffect(() => {
    if (!workspacesCollection) {
      return
    }

    const workspacesQuery = query(workspacesCollection, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(
      workspacesQuery,
      (snapshot) => {
        const nextWorkspaces = snapshot.docs.map((entry) => normalizeWorkspace(entry.id, entry.data()))
        setWorkspaces(nextWorkspaces.length > 0 ? nextWorkspaces : buildFallbackWorkspaces())
        setLoading(false)
        setErrorMessage(null)

        const savedWorkspaceId = window.localStorage.getItem(storageKey)

        setActiveWorkspaceIdState((current) => {
          if (nextWorkspaces.length === 0) {
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
          window.localStorage.setItem(storageKey, fallbackId)
          return fallbackId
        })
      },
      (error) => {
        setWorkspaces(buildFallbackWorkspaces())
        setLoading(false)
        setErrorMessage(getWorkspaceErrorMessage(error))
      },
    )

    return unsubscribe
  }, [storageKey, workspacesCollection])

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
