import type { TaskStatus, TaskSubtask } from '../types/task'

export type TaskProgressSummary = {
  total: number
  completed: number
  pending: number
  percent: number
}

export const getSubtaskSummary = (subtarefas: TaskSubtask[] = []): TaskProgressSummary => {
  const total = subtarefas.length
  const completed = subtarefas.filter((item) => item.status === 'done').length
  const pending = total - completed
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return {
    total,
    completed,
    pending,
    percent,
  }
}

export const getTaskProgressSummary = (task: { subtarefas: TaskSubtask[] }): TaskProgressSummary =>
  getSubtaskSummary(task.subtarefas)

export const deriveTaskStatusFromSubtasks = (
  subtarefas: TaskSubtask[] = [],
  fallbackStatus: TaskStatus,
): TaskStatus => {
  const { total, completed } = getSubtaskSummary(subtarefas)

  if (total === 0) {
    return fallbackStatus
  }

  if (completed === 0) {
    return fallbackStatus === 'done' ? 'pending' : fallbackStatus
  }

  if (completed === total) {
    return 'done'
  }

  return 'doing'
}
