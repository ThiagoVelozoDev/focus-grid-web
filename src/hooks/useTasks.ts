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
import type { TaskAcompanhamento, TaskInput, Task } from '../types/task'

const nowIso = () => new Date().toISOString()

const buildTask = (input: TaskInput): Task => {
  const currentTime = nowIso()

  return {
    id: crypto.randomUUID(),
    ...input,
    acompanhamentos: [],
    createdAt: currentTime,
    updatedAt: currentTime,
    completedAt: input.status === 'done' ? currentTime : null,
  }
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

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

  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    oQue: typeof raw.oQue === 'string' ? raw.oQue : typeof raw.specific === 'string' ? raw.specific : '',
    porQue: typeof raw.porQue === 'string' ? raw.porQue : typeof raw.relevant === 'string' ? raw.relevant : '',
    detalhamento: typeof raw.detalhamento === 'string' ? raw.detalhamento : '',
    onde: typeof raw.onde === 'string' ? raw.onde : '',
    dataInicio: typeof raw.dataInicio === 'string' ? raw.dataInicio : '',
    quando: typeof raw.quando === 'string' ? raw.quando : typeof raw.timeBound === 'string' ? raw.timeBound : '',
    quem: typeof raw.quem === 'string' ? raw.quem : '',
    como: typeof raw.como === 'string' ? raw.como : typeof raw.measurable === 'string' ? raw.measurable : '',
    quantoCusta: typeof raw.quantoCusta === 'string' ? raw.quantoCusta : '',
    status: raw.status === 'pending' || raw.status === 'doing' || raw.status === 'done' || raw.status === 'todo' ? raw.status : 'pending',
    priority: raw.priority === 'low' || raw.priority === 'high' ? raw.priority : 'medium',
    acompanhamentos,
    createdAt,
    updatedAt,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
  }
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
  addAcompanhamento: (id: string, texto: string) => Promise<void>
  updateAcompanhamento: (taskId: string, acompanhamentoId: string, texto: string) => Promise<void>
}

export function useTasks(): TaskActions {
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
      setTasks([])
      setLoading(false)
      return
    }

    setLoading(true)

    const tasksQuery = query(tasksCollection, orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const nextTasks = snapshot.docs.map((entry) => normalizeTask(entry.data()))
      setTasks(nextTasks)
      setLoading(false)
    })

    return unsubscribe
  }, [tasksCollection])

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
        batch.set(ref, task)
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

      const task = buildTask(input)
      await setDoc(doc(tasksCollection, task.id), task)
    },
    [tasksCollection],
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

      const nextTask = updater(currentTask)
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
        const completedAt = input.status === 'done' ? task.completedAt ?? updatedAt : null

        return {
          ...task,
          ...input,
          completedAt,
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

        return {
          ...task,
          status: isDone ? 'pending' : 'done',
          completedAt: isDone ? null : updatedAt,
          updatedAt,
        }
      })
    },
    [updateTaskData],
  )

  const addAcompanhamento = useCallback(
    async (id: string, texto: string) => {
      const cleanText = texto.trim()
      if (!cleanText) {
        return
      }

      await updateTaskData(id, (task) => ({
        ...task,
        updatedAt: nowIso(),
        acompanhamentos: [
          ...task.acompanhamentos,
          {
            id: crypto.randomUUID(),
            texto: cleanText,
            createdAt: nowIso(),
          },
        ],
      }))
    },
    [updateTaskData],
  )

  const updateAcompanhamento = useCallback(
    async (taskId: string, acompanhamentoId: string, texto: string) => {
      const cleanText = texto.trim()
      if (!cleanText) {
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
            texto: cleanText,
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
    addAcompanhamento,
    updateAcompanhamento,
  }
}
