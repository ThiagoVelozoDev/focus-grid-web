import type { TaskSubtask } from '../types/task'

export const createEmptySubtask = (overrides: Partial<TaskSubtask> = {}): TaskSubtask => {
  const timestamp = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    descricao: '',
    porQue: '',
    detalhamento: '',
    onde: '',
    dataInicio: '',
    quando: '',
    quem: '',
    como: '',
    quantoCusta: 0,
    status: 'pending',
    priority: 'medium',
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
    ...overrides,
  }
}
