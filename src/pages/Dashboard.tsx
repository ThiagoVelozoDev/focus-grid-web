import { useMemo, useState } from 'react'
import { TaskForm } from '../components/TaskForm'
import { useTasks } from '../hooks/useTasks'
import type { TaskInput, Task, TaskFilter, TaskStatus } from '../types/task'

type Segment = 'dueToday' | 'dueTomorrow' | 'onTime' | 'late' | 'completed'
type CategoryFilter = 'all' | Segment
type SortDirection = 'asc' | 'desc'
type SortColumn = 'segment' | 'oQue' | 'porQue' | 'onde' | 'quem' | 'como' | 'priority' | 'dataInicio' | 'quando' | 'status'

const isSameDate = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

const sectionTitle: Record<Segment, string> = {
  dueToday: 'Vence hoje',
  dueTomorrow: 'Vence em 1 dia',
  onTime: 'No prazo',
  late: 'Atrasadas',
  completed: 'Concluidas',
}

const categoryFilterLabels: Record<CategoryFilter, string> = {
  all: 'Todas categorias',
  dueToday: 'Vence hoje',
  dueTomorrow: 'Vence em 1 dia',
  onTime: 'No prazo',
  late: 'Atrasadas',
  completed: 'Concluidas',
}

const statusFilterLabels: Record<TaskFilter, string> = {
  all: 'Todos',
  pending: 'Pendente',
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluidos',
}

const statusLabel = {
  pending: 'Pendente',
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluida',
}

const statusBadge: Record<TaskStatus, string> = {
  pending: 'border border-orange-200 bg-orange-100 text-orange-800',
  todo: 'border border-amber-200 bg-amber-100 text-amber-800',
  doing: 'border border-violet-200 bg-violet-100 text-violet-800',
  done: 'border border-blue-200 bg-blue-100 text-blue-800',
}

const segmentLabel: Record<Segment, string> = {
  dueToday: 'Vence hoje',
  dueTomorrow: 'Vence em 1 dia',
  onTime: 'No prazo',
  late: 'Atrasada',
  completed: 'Concluida',
}

const segmentBadge: Record<Segment, string> = {
  dueToday: 'border border-rose-200 bg-rose-100 text-rose-800',
  dueTomorrow: 'border border-orange-200 bg-orange-100 text-orange-800',
  onTime: 'border border-emerald-200 bg-emerald-100 text-emerald-800',
  late: 'border border-red-200 bg-red-100 text-red-800',
  completed: 'border border-blue-200 bg-blue-100 text-blue-800',
}

const parseDateOnly = (value: string) => {
  if (!value) {
    return null
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const [, year, month, day] = match
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

const formatDate = (value: string) => {
  if (!value) {
    return '-'
  }

  const date = parseDateOnly(value)
  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date)
}

const getPrazoClass = (value: string) => {
  const prazo = parseDateOnly(value)
  if (!prazo) {
    return ''
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (prazo < today) {
    return 'text-red-600 font-semibold'
  }

  const oneDay = 24 * 60 * 60 * 1000
  const diffInDays = Math.round((prazo.getTime() - today.getTime()) / oneDay)

  if (diffInDays === 1) {
    return 'text-orange-600 font-semibold'
  }

  return ''
}

const byNewest = (a: Task, b: Task) =>
  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()

const segmentOrder: Record<Segment, number> = {
  dueToday: 1,
  dueTomorrow: 2,
  onTime: 3,
  late: 4,
  completed: 5,
}

const statusOrder: Record<TaskStatus, number> = {
  pending: 1,
  todo: 2,
  doing: 3,
  done: 4,
}

const priorityLabel = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
}

const priorityBadge = {
  low: 'border border-emerald-200 bg-emerald-100 text-emerald-800',
  medium: 'border border-amber-200 bg-amber-100 text-amber-800',
  high: 'border border-rose-200 bg-rose-100 text-rose-800',
}

const priorityOrder = {
  low: 1,
  medium: 2,
  high: 3,
}

export function Dashboard() {
  const { tasks, addTask, updateTask, deleteTask, toggleComplete, addAcompanhamento, updateAcompanhamento } = useTasks()
  const [statusFilter, setStatusFilter] = useState<TaskFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showDashboard, setShowDashboard] = useState(true)
  const [showFilters, setShowFilters] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)
  const [novoAcompanhamento, setNovoAcompanhamento] = useState('')
  const [editingAcompanhamentoId, setEditingAcompanhamentoId] = useState<string | null>(null)
  const [editingAcompanhamentoTexto, setEditingAcompanhamentoTexto] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('quando')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [flashMessage, setFlashMessage] = useState('')

  const detailTask = useMemo(
    () => tasks.find((task) => task.id === detailTaskId) ?? null,
    [tasks, detailTaskId],
  )

  const filteredByStatus = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR')

    const filteredBySearch = normalizedSearch
      ? tasks.filter((task) => task.oQue.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
      : tasks

    if (statusFilter === 'all') {
      return filteredBySearch
    }

    return filteredBySearch.filter((task) => task.status === statusFilter)
  }, [statusFilter, tasks, searchTerm])

  const segmentedTasks = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const oneDay = 24 * 60 * 60 * 1000

    const base = {
      dueToday: [] as Task[],
      dueTomorrow: [] as Task[],
      onTime: [] as Task[],
      late: [] as Task[],
      completed: [] as Task[],
    }

    for (const task of filteredByStatus) {
      const deadline = parseDateOnly(task.quando)

      if (task.status === 'done') {
        base.completed.push(task)
        continue
      }

      if (deadline && deadline < today) {
        base.late.push(task)
        continue
      }

      if (!deadline) {
        base.onTime.push(task)
        continue
      }

      const diffInDays = Math.round((deadline.getTime() - today.getTime()) / oneDay)

      if (diffInDays === 0) {
        base.dueToday.push(task)
      } else if (diffInDays === 1) {
        base.dueTomorrow.push(task)
      } else {
        base.onTime.push(task)
      }
    }

    return {
      dueToday: base.dueToday.sort(byNewest),
      dueTomorrow: base.dueTomorrow.sort(byNewest),
      onTime: base.onTime.sort(byNewest),
      late: base.late.sort(byNewest),
      completed: base.completed.sort(byNewest),
    }
  }, [filteredByStatus])

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((task) => task.status === 'done').length
    const progress = total === 0 ? 0 : Math.round((done / total) * 100)
    const today = new Date()

    const completedToday = tasks.filter((task) => {
      if (!task.completedAt) {
        return false
      }

      return isSameDate(new Date(task.completedAt), today)
    }).length

    return {
      total,
      done,
      progress,
      completedToday,
    }
  }, [tasks])

  const trackingRows = useMemo(() => {
    const rows: Array<{ task: Task; segment: Segment }> = []

    for (const segment of Object.keys(sectionTitle) as Segment[]) {
      for (const task of segmentedTasks[segment]) {
        rows.push({ task, segment })
      }
    }

    return rows
  }, [segmentedTasks])

  const categoryFilteredRows = useMemo(() => {
    if (categoryFilter === 'all') {
      return trackingRows
    }

    return trackingRows.filter((row) => row.segment === categoryFilter)
  }, [trackingRows, categoryFilter])

  const sortedTrackingRows = useMemo(() => {
    const directionMultiplier = sortDirection === 'asc' ? 1 : -1

    return [...categoryFilteredRows].sort((left, right) => {
      const leftTask = left.task
      const rightTask = right.task

      let comparison = 0

      switch (sortColumn) {
        case 'segment':
          comparison = segmentOrder[left.segment] - segmentOrder[right.segment]
          break
        case 'quando': {
          const leftDate = parseDateOnly(leftTask.quando)?.getTime() ?? Number.POSITIVE_INFINITY
          const rightDate = parseDateOnly(rightTask.quando)?.getTime() ?? Number.POSITIVE_INFINITY
          comparison = leftDate - rightDate
          break
        }
        case 'dataInicio': {
          const leftDate = parseDateOnly(leftTask.dataInicio)?.getTime() ?? Number.POSITIVE_INFINITY
          const rightDate = parseDateOnly(rightTask.dataInicio)?.getTime() ?? Number.POSITIVE_INFINITY
          comparison = leftDate - rightDate
          break
        }
        case 'status':
          comparison = statusOrder[leftTask.status] - statusOrder[rightTask.status]
          break
        case 'priority':
          comparison = priorityOrder[leftTask.priority] - priorityOrder[rightTask.priority]
          break
        case 'oQue':
        case 'porQue':
        case 'onde':
        case 'quem':
        case 'como':
          comparison = leftTask[sortColumn].localeCompare(rightTask[sortColumn], 'pt-BR', { sensitivity: 'base' })
          break
      }

      if (comparison === 0) {
        return byNewest(leftTask, rightTask)
      }

      return comparison * directionMultiplier
    })
  }, [categoryFilteredRows, sortColumn, sortDirection])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortColumn(column)
    setSortDirection('asc')
  }

  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) {
      return '↕'
    }

    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const handleSubmitTask = (input: TaskInput) => {
    if (editingTask) {
      updateTask(editingTask.id, input)
      setEditingTask(null)
      setIsFormOpen(false)
      return
    }

    addTask(input)
    setIsFormOpen(false)
  }

  const handleToggleComplete = (id: string) => {
    const activeTask = tasks.find((task) => task.id === id)
    toggleComplete(id)

    if (activeTask && activeTask.status !== 'done') {
      setFlashMessage('Tarefa concluida. Excelente ritmo!')
      window.setTimeout(() => setFlashMessage(''), 1800)
    }
  }

  const handleDeleteTask = (id: string) => {
    if (editingTask?.id === id) {
      setEditingTask(null)
    }

    deleteTask(id)
  }

  const openNewTaskDialog = () => {
    setEditingTask(null)
    setIsFormOpen(true)
  }

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleCloseDialog = () => {
    setEditingTask(null)
    setIsFormOpen(false)
  }

  const openDetailDialog = (task: Task) => {
    setDetailTaskId(task.id)
  }

  const closeDetailDialog = () => {
    setDetailTaskId(null)
    setNovoAcompanhamento('')
    setEditingAcompanhamentoId(null)
    setEditingAcompanhamentoTexto('')
  }

  const handleAddAcompanhamento = () => {
    if (!detailTaskId) {
      return
    }

    const texto = novoAcompanhamento.trim()
    if (!texto) {
      return
    }

    addAcompanhamento(detailTaskId, texto)
    setNovoAcompanhamento('')
  }

  const startEditAcompanhamento = (id: string, texto: string) => {
    setEditingAcompanhamentoId(id)
    setEditingAcompanhamentoTexto(texto)
  }

  const cancelEditAcompanhamento = () => {
    setEditingAcompanhamentoId(null)
    setEditingAcompanhamentoTexto('')
  }

  const saveEditAcompanhamento = () => {
    if (!detailTaskId || !editingAcompanhamentoId) {
      return
    }

    const texto = editingAcompanhamentoTexto.trim()
    if (!texto) {
      return
    }

    updateAcompanhamento(detailTaskId, editingAcompanhamentoId, texto)
    cancelEditAcompanhamento()
  }

  const renderTaskActions = (task: Task) => (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        title={task.status === 'done' ? 'Reabrir tarefa' : 'Concluir tarefa'}
        aria-label={task.status === 'done' ? 'Reabrir tarefa' : 'Concluir tarefa'}
        onClick={() => handleToggleComplete(task.id)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-700"
      >
        {task.status === 'done' ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 3v6h6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m5 13 4 4L19 7" />
          </svg>
        )}
      </button>
      <button
        type="button"
        title="Visualizar detalhamento"
        aria-label="Visualizar detalhamento"
        onClick={() => openDetailDialog(task)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-300 text-sky-700 hover:bg-sky-50"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      <button
        type="button"
        title="Editar tarefa"
        aria-label="Editar tarefa"
        onClick={() => openEditDialog(task)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="m16.5 3.5 4 4L7 21l-4 1 1-4 12.5-14.5Z" />
        </svg>
      </button>
      <button
        type="button"
        title="Excluir tarefa"
        aria-label="Excluir tarefa"
        onClick={() => handleDeleteTask(task.id)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>
  )

  return (
    <main className="mx-auto grid min-h-screen w-[96%] md:w-[90%] xl:w-[80%] max-w-none gap-8 py-8 md:gap-10">
      <section className="grid gap-4 rounded-3xl border border-white/40 bg-white/70 p-5 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-slate-900">Painel do dashboard</h2>
          <button
            type="button"
            onClick={() => setShowDashboard((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {showDashboard ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {showDashboard ? (
          <header className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-800 p-6 text-white shadow-xl">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-200/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-sky-300/20 blur-2xl" />

            <div className="relative grid gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/90">Focus Grid</p>
              <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Sistema 5W2H de tarefas pessoais</h1>
              <p className="max-w-3xl text-sm text-blue-100 sm:text-base">
                Planeje com clareza, acompanhe resultados e execute no ritmo certo todos os dias.
              </p>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/15 p-5 backdrop-blur">
                  <span className="text-xs uppercase tracking-wide text-blue-100/90">Total</span>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="rounded-2xl bg-white/15 p-5 backdrop-blur">
                  <span className="text-xs uppercase tracking-wide text-blue-100/90">Concluidas</span>
                  <p className="text-2xl font-bold">{stats.done}</p>
                </div>
                <div className="rounded-2xl bg-white/15 p-5 backdrop-blur">
                  <span className="text-xs uppercase tracking-wide text-blue-100/90">Feitas hoje</span>
                  <p className="text-2xl font-bold">{stats.completedToday}</p>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between text-xs uppercase tracking-wide text-blue-100/90">
                  <span>Progresso geral</span>
                  <span>{stats.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/30">
                  <div
                    style={{ width: `${stats.progress}%` }}
                    className="h-full rounded-full bg-white transition-[width] duration-500"
                  />
                </div>
              </div>
            </div>
          </header>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Dashboard minimizado.
          </div>
        )}
      </section>

      {flashMessage && (
        <div className="animate-bounce-in rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {flashMessage}
        </div>
      )}

      {isFormOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onClick={handleCloseDialog}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <TaskForm
              key={editingTask?.id ?? 'new-task'}
              editingTask={editingTask}
              onSubmitTask={handleSubmitTask}
              onCancelEdit={handleCloseDialog}
            />
          </div>
        </div>
      )}

      {detailTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onClick={closeDetailDialog}
        >
          <article
            className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-2xl text-slate-900">Detalhamento da tarefa</h3>
                <p className="mt-1 text-sm text-slate-600">{detailTask.oQue}</p>
              </div>
              <button
                type="button"
                onClick={closeDetailDialog}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Fechar
              </button>
            </header>

            <div className="mb-4 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
              <span><strong>Quem:</strong> {detailTask.quem}</span>
              <span><strong>Onde:</strong> {detailTask.onde}</span>
              <span><strong>Inicio:</strong> {formatDate(detailTask.dataInicio)}</span>
              <span className={getPrazoClass(detailTask.quando)}><strong>Quando:</strong> {formatDate(detailTask.quando)}</span>
              <span><strong>Status:</strong> {statusLabel[detailTask.status]}</span>
            </div>

            <p className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
              {detailTask.detalhamento || 'Sem detalhamento informado.'}
            </p>

            <section className="mt-4 grid gap-3">
              <h4 className="font-semibold text-slate-900">Acompanhamentos</h4>
              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <textarea
                  rows={3}
                  value={novoAcompanhamento}
                  onChange={(event) => setNovoAcompanhamento(event.target.value)}
                  placeholder="Adicionar novo comentario de andamento..."
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-300 transition focus:ring"
                />
                <div>
                  <button
                    type="button"
                    onClick={handleAddAcompanhamento}
                    className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                  >
                    Adicionar comentario
                  </button>
                </div>
              </div>

              <ol className="grid gap-2">
                {detailTask.acompanhamentos.length === 0 && (
                  <li className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
                    Sem acompanhamentos ainda.
                  </li>
                )}

                {[...detailTask.acompanhamentos]
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((item) => (
                    <li key={item.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-500">{formatDate(item.createdAt)} {new Date(item.createdAt).toLocaleTimeString('pt-BR')}</p>
                        {editingAcompanhamentoId !== item.id && (
                          <button
                            type="button"
                            onClick={() => startEditAcompanhamento(item.id, item.texto)}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Editar
                          </button>
                        )}
                      </div>

                      {editingAcompanhamentoId === item.id ? (
                        <div className="mt-2 grid gap-2">
                          <textarea
                            rows={3}
                            value={editingAcompanhamentoTexto}
                            onChange={(event) => setEditingAcompanhamentoTexto(event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-300 transition focus:ring"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={saveEditAcompanhamento}
                              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditAcompanhamento}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-slate-700">{item.texto}</p>
                      )}
                    </li>
                  ))}
              </ol>
            </section>
          </article>
        </div>
      )}

      <section className="grid gap-4 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-lg backdrop-blur mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Filtros</h2>
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {showFilters && (
          <div className="grid gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
              <div className="flex flex-wrap items-center gap-2 lg:flex-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                {(Object.keys(statusFilterLabels) as TaskFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      statusFilter === filter
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {statusFilterLabels[filter]}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:flex-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categoria</span>
                {(Object.keys(categoryFilterLabels) as CategoryFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setCategoryFilter(filter)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      categoryFilter === filter
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {categoryFilterLabels[filter]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-1 md:max-w-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Busca em O que</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar tarefa..."
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-300 transition focus:ring"
              />
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl text-slate-900">Tarefas</h2>
          <button
            type="button"
            onClick={openNewTaskDialog}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Adicionar tarefa
          </button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 hidden lg:block">
          <table className="min-w-full divide-y divide-slate-200 bg-white text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-5 py-3">
                  <button type="button" onClick={() => handleSort('segment')} className="inline-flex items-center gap-1">
                    Categoria <span>{getSortIndicator('segment')}</span>
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button type="button" onClick={() => handleSort('oQue')} className="inline-flex items-center gap-1">
                    O que <span>{getSortIndicator('oQue')}</span>
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button type="button" onClick={() => handleSort('porQue')} className="inline-flex items-center gap-1">
                    Por que <span>{getSortIndicator('porQue')}</span>
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button type="button" onClick={() => handleSort('onde')} className="inline-flex items-center gap-1">
                    Onde <span>{getSortIndicator('onde')}</span>
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button type="button" onClick={() => handleSort('quem')} className="inline-flex items-center gap-1">
                    Quem <span>{getSortIndicator('quem')}</span>
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button type="button" onClick={() => handleSort('como')} className="inline-flex items-center gap-1">
                    Como <span>{getSortIndicator('como')}</span>
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button type="button" onClick={() => handleSort('priority')} className="inline-flex items-center gap-1">
                    Prioridade <span>{getSortIndicator('priority')}</span>
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button type="button" onClick={() => handleSort('dataInicio')} className="inline-flex items-center gap-1">
                    Inicio <span>{getSortIndicator('dataInicio')}</span>
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button type="button" onClick={() => handleSort('quando')} className="inline-flex items-center gap-1">
                    Quando <span>{getSortIndicator('quando')}</span>
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button type="button" onClick={() => handleSort('status')} className="inline-flex items-center gap-1">
                    Status <span>{getSortIndicator('status')}</span>
                  </button>
                </th>
                <th className="px-5 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {sortedTrackingRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-8 text-center text-slate-500">
                    Nenhuma tarefa para acompanhar.
                  </td>
                </tr>
              )}

              {sortedTrackingRows.map(({ task, segment }) => (
                <tr key={task.id} className="align-top hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${segmentBadge[segment]}`}>
                      {segmentLabel[segment]}
                    </span>
                  </td>
                  <td className="px-5 py-4">{task.oQue}</td>
                  <td className="px-5 py-4">{task.porQue}</td>
                  <td className="px-5 py-4">{task.onde}</td>
                  <td className="px-5 py-4">{task.quem}</td>
                  <td className="px-5 py-4">{task.como}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityBadge[task.priority]}`}>
                      {priorityLabel[task.priority]}
                    </span>
                  </td>
                  <td className="px-5 py-4">{formatDate(task.dataInicio)}</td>
                  <td className={`px-5 py-4 ${getPrazoClass(task.quando)}`}>{formatDate(task.quando)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[task.status]}`}>
                      {statusLabel[task.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {renderTaskActions(task)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 lg:hidden">
          {sortedTrackingRows.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
              Nenhuma tarefa para acompanhar.
            </div>
          )}

          {sortedTrackingRows.map(({ task, segment }) => (
            <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">{task.oQue}</span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[task.status]}`}>
                  {statusLabel[task.status]}
                </span>
              </div>

              <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>
                  <strong>Categoria:</strong>{' '}
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${segmentBadge[segment]}`}>
                    {segmentLabel[segment]}
                  </span>
                </p>
                <p className={getPrazoClass(task.quando)}><strong>Quando:</strong> {formatDate(task.quando)}</p>
                <p><strong>Quem:</strong> {task.quem || '-'}</p>
                <p><strong>Onde:</strong> {task.onde || '-'}</p>
                <p><strong>Inicio:</strong> {formatDate(task.dataInicio)}</p>
                <p><strong>Como:</strong> {task.como || '-'}</p>
                <p>
                  <strong>Prioridade:</strong>{' '}
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityBadge[task.priority]}`}>
                    {priorityLabel[task.priority]}
                  </span>
                </p>
              </div>

              <p className="mt-3 text-sm text-slate-600"><strong>Por que:</strong> {task.porQue}</p>

              <div className="mt-4">{renderTaskActions(task)}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
