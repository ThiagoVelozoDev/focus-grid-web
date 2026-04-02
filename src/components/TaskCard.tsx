import type { Task } from '../types/task'

type TaskCardProps = {
  task: Task
  onToggleComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

const priorityColors = {
  low: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-300 bg-amber-50 text-amber-700',
  high: 'border-rose-300 bg-rose-50 text-rose-700',
}

const statusLabel = {
  pending: 'Pendente',
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluida',
}

const formatDate = (value: string) => {
  if (!value) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(value))
}

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isLate = task.status !== 'done' && new Date(task.quando) < new Date()

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${priorityColors[task.priority]}`}>
          Prioridade {task.priority}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          {statusLabel[task.status]}
        </span>
      </div>

      <h3 className="mb-2 text-lg font-semibold leading-tight text-slate-900">{task.oQue}</h3>
      <p className="mb-2 text-sm text-slate-600">Como: {task.como}</p>
      <p className="mb-2 text-sm text-slate-600">Por que: {task.porQue}</p>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <span>Responsavel: {task.quem || 'Nao definido'}</span>
        <span className={isLate ? 'font-semibold text-rose-600' : ''}>
          Prazo: {formatDate(task.quando)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-700"
        >
          {task.status === 'done' ? 'Reabrir' : 'Concluir'}
        </button>
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
        >
          Excluir
        </button>
      </div>
    </article>
  )
}
