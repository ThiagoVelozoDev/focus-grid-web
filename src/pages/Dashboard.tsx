import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { TaskForm } from '../components/TaskForm'
import { useTasks } from '../hooks/useTasks.ts'
import type { TaskInput, Task, TaskStatus } from '../types/task'

type Segment = 'dueToday' | 'dueTomorrow' | 'onTime' | 'late' | 'completed'
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


const statusLabel = {
  pending: 'Pendente',
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluida',
}

const getStatusLabel = (status: unknown) => {
  if (status === 'pending' || status === 'todo' || status === 'doing' || status === 'done') {
    return statusLabel[status]
  }

  return '-'
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

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

type MultiSelectFilterProps = {
  label: string
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  isDark: boolean
  labels?: Record<string, string>
}

function MultiSelectFilter({ label, options, selectedValues, onChange, isDark, labels }: MultiSelectFilterProps) {
  const getLabel = (value: string) => labels?.[value] ?? value

  const selectedLabel =
    selectedValues.length === 0
      ? 'Todos'
      : selectedValues.length === 1
        ? getLabel(selectedValues[0])
        : `${selectedValues.length} selecionados`

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value))
      return
    }

    onChange([...selectedValues, value])
  }

  return (
    <div className={`grid gap-1 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
      <span>{label}</span>
      <details className="relative">
        <summary
          className={`list-none cursor-pointer rounded-xl border px-3 py-2 text-sm normal-case outline-none ring-cyan-300 transition focus:ring ${
            isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-300 bg-white text-slate-700'
          }`}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="truncate">{selectedLabel}</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </summary>

        <div
          className={`absolute z-50 mt-2 max-h-56 w-full overflow-auto rounded-xl border p-2 shadow-xl ${
            isDark ? 'border-[#353535] bg-[#212121]' : 'border-slate-300 bg-white'
          }`}
        >
          <button
            type="button"
            onClick={() => onChange([])}
            className={`mb-1 w-full rounded-lg px-2 py-1 text-left text-xs font-semibold ${
              selectedValues.length === 0
                ? isDark
                  ? 'bg-[#252525] text-white'
                  : 'bg-slate-200 text-slate-900'
                : isDark
                  ? 'text-slate-300 hover:bg-[#252525] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Todos
          </button>

          <div className="grid gap-1">
            {options.map((option) => {
              const checked = selectedValues.includes(option)

              return (
                <label
                  key={option}
                  className={`flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium normal-case ${
                    checked
                      ? isDark
                        ? 'bg-[#252525] text-white'
                        : 'bg-slate-200 text-slate-900'
                      : isDark
                        ? 'text-slate-300 hover:bg-[#252525] hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleValue(option)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-300"
                  />
                  <span className="truncate">{getLabel(option)}</span>
                </label>
              )
            })}
          </div>
        </div>
      </details>
    </div>
  )
}

type DashboardProps = {
  responsaveis: string[]
  locais: string[]
  theme: 'light' | 'dark'
}

export function Dashboard({ responsaveis, locais, theme }: DashboardProps) {
  const { tasks, loading, addTask, updateTask, deleteTask, toggleComplete, addAcompanhamento, updateAcompanhamento } = useTasks()
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [responsavelFilter, setResponsavelFilter] = useState<string[]>([])
  const [localFilter, setLocalFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const isDark = theme === 'dark'

  const detailTask = useMemo(
    () => tasks.find((task) => task.id === detailTaskId) ?? null,
    [tasks, detailTaskId],
  )

  const responsavelOptions = useMemo(
    () => Array.from(new Set(responsaveis.map((item) => item.trim()).filter(Boolean))),
    [responsaveis],
  )

  const localOptions = useMemo(
    () => Array.from(new Set(locais.map((item) => item.trim()).filter(Boolean))),
    [locais],
  )

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR')

    return tasks.filter((task) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        task.oQue.toLocaleLowerCase('pt-BR').includes(normalizedSearch)

      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(task.status)
      const matchesResponsavel = responsavelFilter.length === 0 || responsavelFilter.includes(task.quem)
      const matchesLocal = localFilter.length === 0 || localFilter.includes(task.onde)
      const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(task.priority)

      return matchesSearch && matchesStatus && matchesResponsavel && matchesLocal && matchesPriority
    })
  }, [localFilter, priorityFilter, responsavelFilter, searchTerm, statusFilter, tasks])

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

    for (const task of filteredTasks) {
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
  }, [filteredTasks])

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((task) => task.status === 'done').length
    const todo = tasks.filter((task) => task.status === 'pending' || task.status === 'todo').length
    const doing = tasks.filter((task) => task.status === 'doing').length
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
      todo,
      doing,
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
    if (categoryFilter.length === 0) {
      return trackingRows
    }

    return trackingRows.filter((row) => categoryFilter.includes(row.segment))
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

  const totalPages = Math.max(1, Math.ceil(sortedTrackingRows.length / itemsPerPage))
  const normalizedPage = Math.min(currentPage, totalPages)

  const paginatedTrackingRows = useMemo(() => {
    const start = (normalizedPage - 1) * itemsPerPage
    return sortedTrackingRows.slice(start, start + itemsPerPage)
  }, [itemsPerPage, normalizedPage, sortedTrackingRows])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, categoryFilter, responsavelFilter, localFilter, priorityFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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

  const handleSubmitTask = async (input: TaskInput) => {
    if (editingTask) {
      try {
        await updateTask(editingTask.id, input)
        toast.success('Tarefa atualizada com sucesso!')
      } catch {
        toast.error('Erro ao atualizar a tarefa. Tente novamente.')
      }
      setEditingTask(null)
      setIsFormOpen(false)
      return
    }

    try {
      await addTask(input)
      toast.success('Tarefa criada com sucesso!')
    } catch {
      toast.error('Erro ao criar a tarefa. Tente novamente.')
    }
    setIsFormOpen(false)
  }

  const handleToggleComplete = (id: string) => {
    const activeTask = tasks.find((task) => task.id === id)
    void toggleComplete(id)

    if (activeTask) {
      if (activeTask.status !== 'done') {
        toast.success('Tarefa concluida. Excelente ritmo!')
      } else {
        toast.info('Tarefa reaberta.')
      }
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (editingTask?.id === id) {
      setEditingTask(null)
    }

    try {
      await deleteTask(id)
      toast.success('Tarefa excluida com sucesso.')
    } catch {
      toast.error('Erro ao excluir a tarefa. Tente novamente.')
    }
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

  const handleAddAcompanhamento = async () => {
    if (!detailTaskId) {
      return
    }

    const texto = novoAcompanhamento
    if (!texto.trim()) {
      return
    }

    try {
      await addAcompanhamento(detailTaskId, texto)
      toast.success('Acompanhamento adicionado.')
    } catch {
      toast.error('Erro ao adicionar acompanhamento.')
    }
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

  const saveEditAcompanhamento = async () => {
    if (!detailTaskId || !editingAcompanhamentoId) {
      return
    }

    const texto = editingAcompanhamentoTexto
    if (!texto.trim()) {
      return
    }

    try {
      await updateAcompanhamento(detailTaskId, editingAcompanhamentoId, texto)
      toast.success('Acompanhamento atualizado.')
    } catch {
      toast.error('Erro ao atualizar acompanhamento.')
    }
    cancelEditAcompanhamento()
  }

  const renderTaskActions = (task: Task) => (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        title={task.status === 'done' ? 'Reabrir tarefa' : 'Concluir tarefa'}
        aria-label={task.status === 'done' ? 'Reabrir tarefa' : 'Concluir tarefa'}
        onClick={() => handleToggleComplete(task.id)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-white ${isDark ? 'bg-[#212121] hover:bg-[#2a2a2a]' : 'bg-slate-900 hover:bg-slate-700'}`}
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
        onClick={() => void handleDeleteTask(task.id)}
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
    <main className={`mx-auto grid w-[96%] py-8 md:w-[92%] md:gap-10 xl:w-[90%] ${theme === 'dark' ? 'text-slate-100' : ''}`}>
      {loading && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
          Sincronizando tarefas com Firebase...
        </div>
      )}

      <section className={`grid gap-4 rounded-3xl border p-4 shadow-lg backdrop-blur ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-white/40 bg-white/70'}`}>
        <div className="flex items-center justify-between">
          <h2 className={`font-heading text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Painel do dashboard</h2>
          <button
            type="button"
            onClick={() => setShowDashboard((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] bg-[#212121] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {showDashboard ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {showDashboard && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <article className={`relative rounded-2xl border px-4 py-3 ${isDark ? 'border-[#353535] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
              <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-cyan-500" />
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-cyan-700'}`}>Total</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats.total}</p>
            </article>
            <article className={`relative rounded-2xl border px-4 py-3 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-200 bg-white'}`}>
              <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-emerald-500" />
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-emerald-700'}`}>Feitas hoje</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats.completedToday}</p>
            </article>
            <article className={`relative rounded-2xl border px-4 py-3 ${isDark ? 'border-[#353535] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
              <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-amber-500" />
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-amber-700'}`}>A fazer</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats.todo}</p>
            </article>
            <article className={`relative rounded-2xl border px-4 py-3 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-200 bg-white'}`}>
              <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-violet-500" />
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-violet-700'}`}>Em andamento</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats.doing}</p>
            </article>
            <article className={`relative rounded-2xl border px-4 py-3 ${isDark ? 'border-[#353535] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
              <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-blue-500" />
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-blue-700'}`}>Concluidos</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats.done}</p>
            </article>
          </div>
        )}
      </section>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onClick={handleCloseDialog}
        >
          <div
            className={`max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-4 shadow-2xl ${isDark ? 'bg-[#181818]' : 'bg-white'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <TaskForm
              key={editingTask?.id ?? 'new-task'}
              editingTask={editingTask}
              onSubmitTask={handleSubmitTask}
              onCancelEdit={handleCloseDialog}
              responsaveis={responsaveis}
              locais={locais}
              theme={theme}
            />
          </div>
        </div>
      )}

      {detailTask && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
          onClick={closeDetailDialog}
        >
          <article
            className={`max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 shadow-2xl ${isDark ? 'bg-[#212121] text-slate-100' : 'bg-white'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className={`font-heading text-2xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Detalhamento da tarefa</h3>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{detailTask.oQue}</p>
              </div>
              <button
                type="button"
                onClick={closeDetailDialog}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
                Fechar
              </button>
            </header>

            <div className={`mb-4 grid gap-2 rounded-2xl p-4 text-sm sm:grid-cols-2 ${isDark ? 'bg-[#181818] text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
              <span><strong>Quem:</strong> {detailTask.quem}</span>
              <span><strong>Onde:</strong> {detailTask.onde}</span>
              <span><strong>Inicio:</strong> {formatDate(detailTask.dataInicio)}</span>
              <span className={getPrazoClass(detailTask.quando)}><strong>Quando:</strong> {formatDate(detailTask.quando)}</span>
              <span><strong>Status:</strong> {getStatusLabel(detailTask.status)}</span>
              <span><strong>Custo:</strong> {formatCurrency(detailTask.quantoCusta)}</span>
            </div>

            <p className={`whitespace-pre-wrap rounded-2xl border p-4 text-sm leading-relaxed ${isDark ? 'border-[#353535] bg-[#181818] text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
              {detailTask.detalhamento || 'Sem detalhamento informado.'}
            </p>

            <section className="mt-4 grid gap-3">
              <h4 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Acompanhamentos</h4>
              <div className={`grid gap-2 rounded-2xl border p-3 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-200 bg-slate-50'}`}>
                <textarea
                  rows={3}
                  value={novoAcompanhamento}
                  onChange={(event) => setNovoAcompanhamento(event.target.value)}
                  placeholder="Adicionar novo comentario de andamento..."
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100 placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-700'}`}
                />
                <div>
                  <button
                    type="button"
                    onClick={() => void handleAddAcompanhamento()}
                    className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                  >
                    Adicionar comentario
                  </button>
                </div>
              </div>

              <ol className="grid max-h-72 gap-2 overflow-y-auto pr-1">
                {detailTask.acompanhamentos.length === 0 && (
                  <li className={`rounded-xl border border-dashed px-3 py-2 text-sm ${isDark ? 'border-[#353535] text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                    Sem acompanhamentos ainda.
                  </li>
                )}

                {[...detailTask.acompanhamentos]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((item) => (
                    <li key={item.id} className={`rounded-xl border px-3 py-2 ${isDark ? 'border-[#353535] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(item.createdAt)} {new Date(item.createdAt).toLocaleTimeString('pt-BR')}</p>
                        {editingAcompanhamentoId !== item.id && (
                          <button
                            type="button"
                            onClick={() => startEditAcompanhamento(item.id, item.texto)}
                            className={`rounded-lg border px-2 py-1 text-xs font-semibold ${isDark ? 'border-[#353535] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
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
                            className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void saveEditAcompanhamento()}
                              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditAcompanhamento}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${isDark ? 'border-[#353535] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={`mt-1 whitespace-pre-wrap text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.texto}</p>
                      )}
                    </li>
                  ))}
              </ol>
            </section>
          </article>
        </div>
      )}

      <section className={`relative z-10 mt-8 grid gap-4 rounded-3xl border p-5 shadow-lg backdrop-blur ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-white/60 bg-white/70'}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Filtros</h2>
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] bg-[#212121] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
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
            <div className="grid gap-3 md:grid-cols-2">
              <MultiSelectFilter
                label="Status"
                options={['pending', 'todo', 'doing', 'done']}
                labels={{ pending: 'Pendente', todo: 'A fazer', doing: 'Em andamento', done: 'Concluido' }}
                selectedValues={statusFilter}
                onChange={setStatusFilter}
                isDark={isDark}
              />

              <MultiSelectFilter
                label="Categoria"
                options={['dueToday', 'dueTomorrow', 'onTime', 'late', 'completed']}
                labels={{ dueToday: 'Vence hoje', dueTomorrow: 'Vence em 1 dia', onTime: 'No prazo', late: 'Atrasadas', completed: 'Concluidas' }}
                selectedValues={categoryFilter}
                onChange={setCategoryFilter}
                isDark={isDark}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <MultiSelectFilter
                label="Responsavel"
                options={responsavelOptions}
                selectedValues={responsavelFilter}
                onChange={setResponsavelFilter}
                isDark={isDark}
              />

              <MultiSelectFilter
                label="Onde"
                options={localOptions}
                selectedValues={localFilter}
                onChange={setLocalFilter}
                isDark={isDark}
              />

              <MultiSelectFilter
                label="Prioridade"
                options={['low', 'medium', 'high']}
                labels={{ low: 'Baixa', medium: 'Media', high: 'Alta' }}
                selectedValues={priorityFilter}
                onChange={setPriorityFilter}
                isDark={isDark}
              />
            </div>
          </div>
        )}
      </section>

      <section className={`relative z-0 mt-8 grid gap-4 rounded-3xl border p-6 shadow-lg backdrop-blur ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-white/60 bg-white/80'}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-2">
            <h2 className={`font-heading text-xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Tarefas</h2>
            <div className="w-full md:w-[360px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar em O que..."
                className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100 placeholder:text-slate-500' : 'border-slate-300 bg-white text-slate-700'}`}
              />
            </div>
          </div>
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
        <div className={`overflow-x-auto rounded-2xl border hidden lg:block ${isDark ? 'border-[#353535]' : 'border-slate-200'}`}>
          <table className={`min-w-full divide-y text-left ${isDark ? 'divide-[#2f2f2f] bg-[#181818]' : 'divide-slate-200 bg-white'}`}>
            <thead className={`${isDark ? 'bg-[#212121] text-slate-300' : 'bg-slate-50 text-slate-600'} text-xs uppercase tracking-wide`}>
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
            <tbody className={`divide-y text-sm ${isDark ? 'divide-[#2f2f2f] text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
              {paginatedTrackingRows.length === 0 && (
                <tr>
                  <td colSpan={11} className={`px-5 py-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Nenhuma tarefa para acompanhar.
                  </td>
                </tr>
              )}

              {paginatedTrackingRows.map(({ task, segment }) => (
                <tr key={task.id} className={`align-top ${isDark ? 'hover:bg-[#212121]' : 'hover:bg-slate-50'}`}>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${segmentBadge[segment]}`}>
                      {segmentLabel[segment]}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold">{task.oQue}</td>
                  <td className="px-5 py-4">{task.porQue}</td>
                  <td className="px-5 py-4">{task.onde}</td>
                  <td className="px-5 py-4">{task.quem}</td>
                  <td className="px-5 py-4">{task.como}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${priorityBadge[task.priority]}`}>
                      {priorityLabel[task.priority]}
                    </span>
                  </td>
                  <td className="px-5 py-4">{formatDate(task.dataInicio)}</td>
                  <td className={`px-5 py-4 ${getPrazoClass(task.quando)}`}>{formatDate(task.quando)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${statusBadge[task.status]}`}>
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
          {paginatedTrackingRows.length === 0 && (
            <div className={`rounded-2xl border px-5 py-8 text-center text-sm ${isDark ? 'border-[#353535] bg-[#212121] text-slate-400' : 'border-slate-200 bg-white text-slate-500'}`}>
              Nenhuma tarefa para acompanhar.
            </div>
          )}

          {paginatedTrackingRows.map(({ task, segment }) => (
            <article key={task.id} className={`rounded-2xl border p-4 shadow-sm ${isDark ? 'border-[#353535] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{task.oQue}</span>
                <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${statusBadge[task.status]}`}>
                  {statusLabel[task.status]}
                </span>
              </div>

              <div className={`grid gap-2 text-sm sm:grid-cols-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <p>
                  <strong>Categoria:</strong>{' '}
                  <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${segmentBadge[segment]}`}>
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
                  <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${priorityBadge[task.priority]}`}>
                    {priorityLabel[task.priority]}
                  </span>
                </p>
              </div>

              <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><strong>Por que:</strong> {task.porQue}</p>

              <div className="mt-4">{renderTaskActions(task)}</div>
            </article>
          ))}
        </div>

        {sortedTrackingRows.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
            <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Itens por pagina
              <select
                value={itemsPerPage}
                onChange={(event) => {
                  setItemsPerPage(Number(event.target.value))
                  setCurrentPage(1)
                }}
                className={`rounded-xl border px-2 py-1.5 text-sm font-semibold outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-200' : 'border-slate-300 bg-white text-slate-700'}`}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </label>

              <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {sortedTrackingRows.length} tarefas listadas
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={normalizedPage === 1}
                className={`rounded-xl border px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? 'border-[#353535] bg-[#181818] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
              >
                Anterior
              </button>

              <span className={`px-2 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Pagina {normalizedPage} de {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={normalizedPage === totalPages}
                className={`rounded-xl border px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? 'border-[#353535] bg-[#181818] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
              >
                Proxima
              </button>
          </div>
        )}
      </section>
    </main>
  )
}
