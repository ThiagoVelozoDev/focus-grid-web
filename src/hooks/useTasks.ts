import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { taskStorage } from '../services/localStorage'
import type { TaskAcompanhamento, TaskInput, Task } from '../types/task'

type TaskStore = {
  tasks: Task[]
  addTask: (input: TaskInput) => Task
  updateTask: (id: string, input: TaskInput) => void
  deleteTask: (id: string) => void
  toggleComplete: (id: string) => void
  addAcompanhamento: (id: string, texto: string) => void
  updateAcompanhamento: (taskId: string, acompanhamentoId: string, texto: string) => void
}

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

export const useTasks = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (input) => {
        const newTask = buildTask(input)
        set((state) => ({ tasks: [newTask, ...state.tasks] }))
        return newTask
      },
      updateTask: (id, input) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== id) {
              return task
            }

            const updatedAt = nowIso()
            const completedAt =
              input.status === 'done'
                ? task.completedAt ?? updatedAt
                : null

            return {
              ...task,
              ...input,
              completedAt,
              updatedAt,
            }
          }),
        }))
      },
      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }))
      },
      toggleComplete: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== id) {
              return task
            }

            const updatedAt = nowIso()
            const isDone = task.status === 'done'

            return {
              ...task,
              status: isDone ? 'pending' : 'done',
              completedAt: isDone ? null : updatedAt,
              updatedAt,
            }
          }),
        }))
      },
      addAcompanhamento: (id, texto) => {
        const cleanText = texto.trim()
        if (!cleanText) {
          return
        }

        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== id) {
              return task
            }

            return {
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
            }
          }),
        }))
      },
      updateAcompanhamento: (taskId, acompanhamentoId, texto) => {
        const cleanText = texto.trim()
        if (!cleanText) {
          return
        }

        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) {
              return task
            }

            return {
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
            }
          }),
        }))
      },
    }),
    {
      name: taskStorage.key,
      version: 4,
      migrate: (persistedState: unknown) => {
        const state = asRecord(persistedState)
        const currentTasks = Array.isArray(state.tasks) ? state.tasks : []
        return {
          ...state,
          tasks: currentTasks.map(normalizeTask),
        }
      },
      partialize: (state) => ({ tasks: state.tasks }),
    },
  ),
)
