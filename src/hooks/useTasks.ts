import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { useAuth } from './useAuth'
import { db } from '../services/firebase'
import { taskStorage } from '../services/localStorage'
import type { TaskAcompanhamento, TaskInput, Task, TaskSubtask } from '../types/task'
import { DEFAULT_WORKSPACE_ID } from './useWorkspaces'
import { deriveTaskStatusFromSubtasks } from '../utils/taskProgress'

const nowIso = () => new Date().toISOString()

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

const asCurrencyNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.'))
    if (Number.isFinite(normalized)) {
      return normalized
    }
  }

  return 0
}

const normalizeSubtaskStatus = (value: unknown): TaskSubtask['status'] => {
  if (value === 'todo' || value === 'doing' || value === 'done') {
    return value
  }

  return 'pending'
}

const sanitizeSubtasks = (rawValue: unknown, timestamp = nowIso()): TaskSubtask[] => {
  const rawSubtasks = Array.isArray(rawValue) ? rawValue : []

  return rawSubtasks
    .map((item) => asRecord(item))
    .filter((item) => typeof item.descricao === 'string' && item.descricao.trim().length > 0)
    .map((item) => {
      const status = normalizeSubtaskStatus(item.status)
      const createdAt = typeof item.createdAt === 'string' ? item.createdAt : timestamp
      const updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : timestamp

      return {
        id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
        descricao: (item.descricao as string).trim(),
        porQue: typeof item.porQue === 'string' ? item.porQue : '',
        detalhamento: typeof item.detalhamento === 'string' ? item.detalhamento : '',
        onde: typeof item.onde === 'string' ? item.onde : '',
        dataInicio: typeof item.dataInicio === 'string' ? item.dataInicio : '',
        quando: typeof item.quando === 'string' ? item.quando : '',
        quem: typeof item.quem === 'string' ? item.quem : '',
        como: typeof item.como === 'string' ? item.como : '',
        quantoCusta: asCurrencyNumber(item.quantoCusta),
        status,
        priority: item.priority === 'low' || item.priority === 'high' ? item.priority : 'medium',
        createdAt,
        updatedAt,
        completedAt:
          status === 'done'
            ? typeof item.completedAt === 'string'
              ? item.completedAt
              : updatedAt
            : null,
      }
    })
}

const buildSubtask = (input: TaskSubtask | string, timestamp = nowIso()): TaskSubtask | null => {
  if (typeof input === 'string') {
    const descricao = input.trim()
    if (!descricao) {
      return null
    }

    return sanitizeSubtasks([{ descricao }], timestamp)[0] ?? null
  }

  return sanitizeSubtasks([input], timestamp)[0] ?? null
}

const syncTaskDerivedState = (task: Task): Task => {
  const status = deriveTaskStatusFromSubtasks(task.subtarefas, task.status)

  return {
    ...task,
    status,
    completedAt: status === 'done' ? task.completedAt ?? task.updatedAt : null,
  }
}

const buildTask = (input: TaskInput): Task => {
  const currentTime = nowIso()

  return syncTaskDerivedState({
    id: crypto.randomUUID(),
    ...input,
    workspaceId: input.workspaceId || DEFAULT_WORKSPACE_ID,
    subtarefas: sanitizeSubtasks(input.subtarefas, currentTime),
    acompanhamentos: [],
    createdAt: currentTime,
    updatedAt: currentTime,
    completedAt: input.status === 'done' ? currentTime : null,
  })
}

const normalizeTask = (rawValue: unknown): Task => {
  const raw = asRecord(rawValue)
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : nowIso()
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : nowIso()
  const rawAcompanhamentos = Array.isArray(raw.acompanhamentos) ? raw.acompanhamentos : []

  const acompanhamentos: TaskAcompanhamento[] = rawAcompanhamentos
    .map((item) => asRecord(item))
    .filter((item) => typeof item.texto === 'string' && item.texto.trim().length > 0)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      texto: item.texto as string,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : nowIso(),
    }))

  return syncTaskDerivedState({
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    workspaceId: typeof raw.workspaceId === 'string' && raw.workspaceId.trim().length > 0 ? raw.workspaceId : DEFAULT_WORKSPACE_ID,
    oQue: typeof raw.oQue === 'string' ? raw.oQue : typeof raw.specific === 'string' ? raw.specific : '',
    porQue: typeof raw.porQue === 'string' ? raw.porQue : typeof raw.relevant === 'string' ? raw.relevant : '',
    detalhamento: typeof raw.detalhamento === 'string' ? raw.detalhamento : '',
    onde: typeof raw.onde === 'string' ? raw.onde : '',
    dataInicio: typeof raw.dataInicio === 'string' ? raw.dataInicio : '',
    quando: typeof raw.quando === 'string' ? raw.quando : typeof raw.timeBound === 'string' ? raw.timeBound : '',
    quem: typeof raw.quem === 'string' ? raw.quem : '',
    como: typeof raw.como === 'string' ? raw.como : typeof raw.measurable === 'string' ? raw.measurable : '',
    quantoCusta: asCurrencyNumber(raw.quantoCusta),
    status: raw.status === 'pending' || raw.status === 'doing' || raw.status === 'done' || raw.status === 'todo' ? raw.status : 'pending',
    priority: raw.priority === 'low' || raw.priority === 'high' ? raw.priority : 'medium',
    subtarefas: sanitizeSubtasks(raw.subtarefas, updatedAt),
    acompanhamentos,
    createdAt,
    updatedAt,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
  })
}

const getLegacyTasks = (): Task[] => {
  const raw = window.localStorage.getItem(taskStorage.key)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as { state?: { tasks?: unknown[] }; tasks?: unknown[] }
    const currentTasks = Array.isArray(parsed.state?.tasks)
      ? parsed.state.tasks
      : Array.isArray(parsed.tasks)
        ? parsed.tasks
        : []

    return currentTasks.map(normalizeTask)
  } catch {
    return []
  }
}

type TaskActions = {
  tasks: Task[]
  loading: boolean
  addTask: (input: TaskInput) => Promise<void>
  updateTask: (id: string, input: TaskInput) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleComplete: (id: string) => Promise<void>
  addSubtask: (taskId: string, input: TaskSubtask | string) => Promise<void>
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>
  addAcompanhamento: (id: string, texto: string) => Promise<void>
  updateAcompanhamento: (taskId: string, acompanhamentoId: string, texto: string) => Promise<void>
}

export function useTasks(workspaceId = DEFAULT_WORKSPACE_ID): TaskActions {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const tasksCollection = useMemo(() => {
    if (!user) {
      return null
    }

    return collection(db, 'users', user.uid, 'tasks')
  }, [user])

  useEffect(() => {
    if (!tasksCollection) {
      return
    }

    const tasksQuery = query(tasksCollection, orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const nextTasks = snapshot.docs
        .map((entry) => normalizeTask(entry.data()))
        .filter((task) => task.workspaceId === workspaceId)

      setTasks(nextTasks)
      setLoading(false)
    })

    return unsubscribe
  }, [tasksCollection, workspaceId])

  useEffect(() => {
    if (!tasksCollection || !user) {
      return
    }

    const migrationKey = `${taskStorage.migrationPrefix}-${user.uid}`

    if (window.localStorage.getItem(migrationKey) === 'done') {
      return
    }

    const migrateLegacyTasks = async () => {
      const localTasks = getLegacyTasks()
      if (localTasks.length === 0) {
        window.localStorage.setItem(migrationKey, 'done')
        return
      }

      const currentCloud = await getDocs(tasksCollection)

      if (!currentCloud.empty) {
        window.localStorage.setItem(migrationKey, 'done')
        return
      }

      const batch = writeBatch(db)

      for (const task of localTasks) {
        const ref = doc(tasksCollection, task.id)
        batch.set(ref, {
          ...task,
          workspaceId: task.workspaceId || DEFAULT_WORKSPACE_ID,
        })
      }

      await batch.commit()
      window.localStorage.setItem(migrationKey, 'done')
    }

    void migrateLegacyTasks()
  }, [tasksCollection, user])

  const addTask = useCallback(
    async (input: TaskInput) => {
      if (!tasksCollection) {
        return
      }

      const task = buildTask({
        ...input,
        workspaceId: input.workspaceId || workspaceId,
      })

      await setDoc(doc(tasksCollection, task.id), task)
    },
    [tasksCollection, workspaceId],
  )

  const updateTaskData = useCallback(
    async (id: string, updater: (task: Task) => Task) => {
      if (!tasksCollection) {
        return
      }

      const currentTask = tasks.find((task) => task.id === id)
      if (!currentTask) {
        return
      }

      const nextTask = syncTaskDerivedState(updater(currentTask))
      await updateDoc(doc(tasksCollection, id), {
        ...nextTask,
      })
    },
    [tasks, tasksCollection],
  )

  const updateTask = useCallback(
    async (id: string, input: TaskInput) => {
      await updateTaskData(id, (task) => {
        const updatedAt = nowIso()

        return {
          ...task,
          ...input,
          workspaceId: input.workspaceId || task.workspaceId,
          subtarefas: sanitizeSubtasks(input.subtarefas, updatedAt),
          completedAt: input.status === 'done' ? task.completedAt ?? updatedAt : null,
          updatedAt,
        }
      })
    },
    [updateTaskData],
  )

  const deleteTaskById = useCallback(
    async (id: string) => {
      if (!tasksCollection) {
        return
      }

      await deleteDoc(doc(tasksCollection, id))
    },
    [tasksCollection],
  )

  const toggleComplete = useCallback(
    async (id: string) => {
      await updateTaskData(id, (task) => {
        const updatedAt = nowIso()
        const isDone = task.status === 'done'
        const nextSubtaskStatus: TaskSubtask['status'] = isDone ? 'pending' : 'done'

        return {
          ...task,
          subtarefas: task.subtarefas.map((item) => ({
            ...item,
            status: nextSubtaskStatus,
            updatedAt,
            completedAt: nextSubtaskStatus === 'done' ? updatedAt : null,
          })),
          status: isDone ? 'pending' : 'done',
          completedAt: isDone ? null : updatedAt,
          updatedAt,
        }
      })
    },
    [updateTaskData],
  )

  const addSubtask = useCallback(
    async (taskId: string, input: TaskSubtask | string) => {
      const timestamp = nowIso()
      const subtask = buildSubtask(input, timestamp)
      if (!subtask) {
        return
      }

      await updateTaskData(taskId, (task) => ({
        ...task,
        updatedAt: timestamp,
        subtarefas: [...task.subtarefas, subtask],
      }))
    },
    [updateTaskData],
  )

  const toggleSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      await updateTaskData(taskId, (task) => {
        const updatedAt = nowIso()

        return {
          ...task,
          updatedAt,
          subtarefas: task.subtarefas.map((item) => {
            if (item.id !== subtaskId) {
              return item
            }

            const nextStatus: TaskSubtask['status'] = item.status === 'done' ? 'pending' : 'done'

            return {
              ...item,
              status: nextStatus,
              updatedAt,
              completedAt: nextStatus === 'done' ? updatedAt : null,
            }
          }),
        }
      })
    },
    [updateTaskData],
  )

  const addAcompanhamento = useCallback(
    async (id: string, texto: string) => {
      if (!texto.trim()) {
        return
      }

      await updateTaskData(id, (task) => ({
        ...task,
        updatedAt: nowIso(),
        acompanhamentos: [
          ...task.acompanhamentos,
          {
            id: crypto.randomUUID(),
            texto: texto.trim(),
            createdAt: nowIso(),
          },
        ],
      }))
    },
    [updateTaskData],
  )

  const updateAcompanhamento = useCallback(
    async (taskId: string, acompanhamentoId: string, texto: string) => {
      if (!texto.trim()) {
        return
      }

      await updateTaskData(taskId, (task) => ({
        ...task,
        updatedAt: nowIso(),
        acompanhamentos: task.acompanhamentos.map((item) => {
          if (item.id !== acompanhamentoId) {
            return item
          }

          return {
            ...item,
            texto: texto.trim(),
          }
        }),
      }))
    },
    [updateTaskData],
  )

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask: deleteTaskById,
    toggleComplete,
    addSubtask,
    toggleSubtask,
    addAcompanhamento,
    updateAcompanhamento,
  }
}
