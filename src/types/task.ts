export type TaskStatus = 'pending' | 'todo' | 'doing' | 'done'

export type TaskAcompanhamento = {
  id: string
  texto: string
  createdAt: string
}

export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskInput = {
  oQue: string
  porQue: string
  detalhamento: string
  onde: string
  dataInicio: string
  quando: string
  quem: string
  como: string
  quantoCusta: string
  status: TaskStatus
  priority: TaskPriority
}

export type Task = TaskInput & {
  id: string
  acompanhamentos: TaskAcompanhamento[]
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type TaskFilter = TaskStatus | 'all'
