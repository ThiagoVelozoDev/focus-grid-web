export type TaskStatus = 'pending' | 'todo' | 'doing' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskSubtaskStatus = TaskStatus

export type TaskSubtask = {
  id: string
  descricao: string
  porQue: string
  detalhamento: string
  onde: string
  dataInicio: string
  quando: string
  quem: string
  como: string
  quantoCusta: number
  status: TaskSubtaskStatus
  priority: TaskPriority
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type TaskAcompanhamento = {
  id: string
  texto: string
  createdAt: string
}

export type TaskInput = {
  workspaceId: string
  oQue: string
  porQue: string
  detalhamento: string
  onde: string
  dataInicio: string
  quando: string
  quem: string
  como: string
  quantoCusta: number
  status: TaskStatus
  priority: TaskPriority
  subtarefas: TaskSubtask[]
}

export type Task = TaskInput & {
  id: string
  acompanhamentos: TaskAcompanhamento[]
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type TaskFilter = TaskStatus | 'all'

export type TaskPriorityFilter = TaskPriority | 'all'
