import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTasks } from '../hooks/useTasks.ts'
import type { TaskInput, Task, TaskStatus, TaskSubtask } from '../types/task'
import type { Workspace, WorkspaceKind } from '../types/workspace'
import { createEmptySubtask } from '../utils/subtask'
import { getTaskProgressSummary } from '../utils/taskProgress'

type Segment = 'dueToday' | 'dueTomorrow' | 'onTime' | 'late' | 'completed'
type ViewMode = 'table' | 'kanban'
type SortDirection = 'asc' | 'desc'
type SortColumn = 'segment' | 'oQue' | 'porQue' | 'onde' | 'quem' | 'como' | 'priority' | 'dataInicio' | 'quando' | 'status' | 'progresso'

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

const workspaceKindLabel: Record<WorkspaceKind, string> = {
  work: 'Trabalho',
  personal: 'Pessoal',
}

type TaskProgressProps = {
  task: Task
  isDark: boolean
  compact?: boolean
}

function TaskProgress({ task, isDark, compact = false }: TaskProgressProps) {
  const summary = getTaskProgressSummary(task)
  const fillClass =
    summary.percent === 100
      ? 'bg-emerald-500'
      : summary.percent >= 50
        ? 'bg-sky-600'
        : summary.percent > 0
          ? 'bg-amber-500'
          : 'bg-slate-400'

  return (
    <div className="grid gap-1.5">
      <div className={`flex items-center justify-between gap-2 ${compact ? 'text-[11px]' : 'text-xs'} font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        <span>Progresso</span>
        <span>{summary.percent}%</span>
      </div>

      <div className={`h-2.5 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
        <div className={`h-full rounded-full transition-all ${fillClass}`} style={{ width: `${summary.percent}%` }} />
      </div>

      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {summary.total === 0 ? 'Sem subtarefas' : `${summary.completed}/${summary.total} concluidas`}
      </span>
    </div>
  )
}

type TaskTagsProps = {
  tags: string[]
  isDark: boolean
}

function TaskTags({ tags, isDark }: TaskTagsProps) {
  if (tags.length === 0) {
    return null
  }

  const palette = isDark
    ? [
        'border-sky-500/30 bg-sky-500/10 text-sky-200',
        'border-violet-500/30 bg-violet-500/10 text-violet-200',
        'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
        'border-amber-500/30 bg-amber-500/10 text-amber-200',
      ]
    : [
        'border-sky-200 bg-sky-50 text-sky-700',
        'border-violet-200 bg-violet-50 text-violet-700',
        'border-emerald-200 bg-emerald-50 text-emerald-700',
        'border-amber-200 bg-amber-50 text-amber-700',
      ]

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span key={`${tag}-${index}`} className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${palette[index % palette.length]}`}>
          #{tag}
        </span>
      ))}
    </div>
  )
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
  activeWorkspaceId: string
  activeWorkspace: Workspace | null
}

export function Dashboard({ responsaveis, locais, theme, activeWorkspaceId, activeWorkspace }: DashboardProps) {
  const { tasks, loading, updateTask, deleteTask, toggleComplete, addSubtask, toggleSubtask, addAcompanhamento, updateAcompanhamento } = useTasks(activeWorkspaceId)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [responsavelFilter, setResponsavelFilter] = useState<string[]>([])
  const [localFilter, setLocalFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string[]>(['dueToday', 'dueTomorrow', 'onTime', 'late'])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDashboard, setShowDashboard] = useState(true)
  const [showFilters, setShowFilters] = useState(true)
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)
  const [novaSubtarefa, setNovaSubtarefa] = useState<TaskSubtask>(() => createEmptySubtask())
  const [novoAcompanhamento, setNovoAcompanhamento] = useState('')
  const [editingAcompanhamentoId, setEditingAcompanhamentoId] = useState<string | null>(null)
  const [editingAcompanhamentoTexto, setEditingAcompanhamentoTexto] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('quando')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [kanbanCardsPerColumn, setKanbanCardsPerColumn] = useState(6)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const hasActiveWorkspace = Boolean(activeWorkspaceId && activeWorkspace)

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
        [task.oQue, task.porQue, task.detalhamento, task.quem, task.onde, task.como, ...task.etiquetas]
          .some((value) => value.toLocaleLowerCase('pt-BR').includes(normalizedSearch)) ||
        task.subtarefas.some((item) =>
          [item.descricao, item.porQue, item.detalhamento, item.quem, item.onde, item.como]
            .some((value) => value.toLocaleLowerCase('pt-BR').includes(normalizedSearch)),
        )

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
        case 'progresso':
          comparison = getTaskProgressSummary(leftTask).percent - getTaskProgressSummary(rightTask).percent
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

  const kanbanColumns = useMemo(() => {
    const base: Record<TaskStatus, Array<{ task: Task; segment: Segment }>> = {
      pending: [],
      todo: [],
      doing: [],
      done: [],
    }

    for (const row of categoryFilteredRows) {
      base[row.task.status].push(row)
    }

    return {
      pending: base.pending.sort((left, right) => byNewest(left.task, right.task)),
      todo: base.todo.sort((left, right) => byNewest(left.task, right.task)),
      doing: base.doing.sort((left, right) => byNewest(left.task, right.task)),
      done: base.done.sort((left, right) => byNewest(left.task, right.task)),
    }
  }, [categoryFilteredRows])

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

  const syncSubtasksForStatus = (subtarefas: TaskSubtask[], nextStatus: TaskStatus) => {
    if (subtarefas.length === 0) {
      return subtarefas
    }

    const updatedAt = new Date().toISOString()

    if (nextStatus === 'done') {
      return subtarefas.map((item) => ({
        ...item,
        status: 'done' as const,
        updatedAt,
        completedAt: updatedAt,
      }))
    }

    if (nextStatus === 'doing') {
      return subtarefas.map((item, index) => ({
        ...item,
        status: index === 0 ? ('doing' as const) : ('pending' as const),
        updatedAt,
        completedAt: null,
      }))
    }

    const resetStatus = nextStatus === 'todo' ? ('todo' as const) : ('pending' as const)

    return subtarefas.map((item) => ({
      ...item,
      status: resetStatus,
      updatedAt,
      completedAt: null,
    }))
  }

  const handleMoveTaskToStatus = async (task: Task, nextStatus: TaskStatus) => {
    if (task.status === nextStatus) {
      return
    }

    const nextInput: TaskInput = {
      workspaceId: task.workspaceId,
      oQue: task.oQue,
      porQue: task.porQue,
      detalhamento: task.detalhamento,
      onde: task.onde,
      dataInicio: task.dataInicio,
      quando: task.quando,
      quem: task.quem,
      como: task.como,
      quantoCusta: task.quantoCusta,
      status: nextStatus,
      priority: task.priority,
      etiquetas: task.etiquetas,
      subtarefas: syncSubtasksForStatus(task.subtarefas, nextStatus),
    }

    try {
      await updateTask(task.id, nextInput)
      toast.success(`Tarefa movida para ${statusLabel[nextStatus].toLowerCase()}.`)
    } catch {
      toast.error('Erro ao mover a tarefa no kanban.')
    }
  }

  const handleKanbanDrop = async (nextStatus: TaskStatus) => {
    const activeTask = tasks.find((task) => task.id === draggedTaskId)
    setDragOverStatus(null)
    setDraggedTaskId(null)

    if (!activeTask) {
      return
    }

    await handleMoveTaskToStatus(activeTask, nextStatus)
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
    try {
      await deleteTask(id)
      toast.success('Tarefa excluida com sucesso.')
    } catch {
      toast.error('Erro ao excluir a tarefa. Tente novamente.')
    }
  }

  const openNewTaskDialog = () => {
    if (!activeWorkspaceId || !activeWorkspace) {
      toast.info('Crie um workspace e selecione-o antes de cadastrar tarefas.')
      return
    }

    navigate('/tarefas/nova')
  }

  const openEditDialog = (task: Task) => {
    navigate(`/tarefas/${task.id}/editar`)
  }

  const openDetailDialog = (task: Task) => {
    navigate(`/tarefas/${task.id}`)
  }

  const closeDetailDialog = () => {
    setDetailTaskId(null)
    setNovaSubtarefa(createEmptySubtask())
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

  const handleAddSubtarefa = async () => {
    if (!detailTaskId) {
      return
    }

    const subtarefa: TaskSubtask = {
      ...novaSubtarefa,
      descricao: novaSubtarefa.descricao.trim(),
      porQue: novaSubtarefa.porQue.trim(),
      detalhamento: novaSubtarefa.detalhamento.trim(),
      como: novaSubtarefa.como.trim(),
    }

    if (!subtarefa.descricao) {
      toast.info('Informe pelo menos o campo "O que" da subtarefa.')
      return
    }

    try {
      await addSubtask(detailTaskId, subtarefa)
      toast.success('Subtarefa adicionada.')
      setNovaSubtarefa(createEmptySubtask({ quem: detailTask?.quem ?? '', onde: detailTask?.onde ?? '' }))
    } catch {
      toast.error('Erro ao adicionar subtarefa.')
    }
  }

  const handleToggleSubtarefa = async (subtaskId: string, isDone: boolean) => {
    if (!detailTaskId) {
      return
    }

    try {
      await toggleSubtask(detailTaskId, subtaskId)
      toast.success(isDone ? 'Subtarefa reaberta.' : 'Subtarefa concluida.')
    } catch {
      toast.error('Erro ao atualizar subtarefa.')
    }
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
        title="Abrir página de detalhamento"
        aria-label="Abrir página de detalhamento"
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

  if (!loading && !hasActiveWorkspace) {
    return (
      <main className={`mx-auto grid w-[96%] py-8 md:w-[92%] xl:w-[90%] ${theme === 'dark' ? 'text-slate-100' : ''}`}>
        <section className={`grid gap-4 rounded-3xl border p-6 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4L11 7h7.5A2.5 2.5 0 0 1 21 9.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-11Z" />
            </svg>
          </div>

          <div>
            <h2 className={`font-heading text-2xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Nenhum workspace encontrado</h2>
            <p className={`mt-2 max-w-2xl text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Este usuário ainda não possui workspaces salvos no Firebase. Crie o primeiro workspace para começar a cadastrar tarefas, responsáveis e locais.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/configuracoes/workspaces"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Criar primeiro workspace
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={`mx-auto grid w-[96%] py-8 md:w-[92%] md:gap-10 xl:w-[90%] ${theme === 'dark' ? 'text-slate-100' : ''}`}>
      {loading && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
          Sincronizando tarefas com Firebase...
        </div>
      )}

      {activeWorkspace && (
        <>
          <section className={`mb-8 grid gap-2 rounded-3xl border p-4 shadow-lg backdrop-blur ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-white/40 bg-white/70'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className={`font-heading text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Workspace atual</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{activeWorkspace.name}</p>
              </div>

              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${activeWorkspace.kind === 'work' ? isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700' : isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                {workspaceKindLabel[activeWorkspace.kind]} • {tasks.length} tarefa(s)
              </span>
            </div>
          </section>

          {!loading && tasks.length === 0 && (
            <section className={`mb-8 grid gap-3 rounded-3xl border border-dashed p-5 ${isDark ? 'border-sky-500/30 bg-sky-500/5' : 'border-sky-200 bg-sky-50'}`}>
              <div>
                <h3 className={`font-heading text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Este workspace ainda está vazio</h3>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Crie a primeira tarefa para começar a visualizar indicadores, agenda e kanban deste workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openNewTaskDialog}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                  Criar primeira tarefa
                </button>
                <Link
                  to="/configuracoes/tarefas/responsaveis"
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 text-slate-700 hover:bg-white'}`}
                >
                  Cadastrar responsáveis
                </Link>
              </div>
            </section>
          )}
        </>
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
              {detailTask.etiquetas.length > 0 && (
                <div className="sm:col-span-2">
                  <strong>Etiquetas:</strong>
                  <div className="mt-2">
                    <TaskTags tags={detailTask.etiquetas} isDark={isDark} />
                  </div>
                </div>
              )}
            </div>

            <section className="mb-4 grid gap-3">
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-200 bg-slate-50'}`}>
                <TaskProgress task={detailTask} isDark={isDark} />
              </div>

              <div className={`grid gap-3 rounded-2xl border p-4 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Checklist</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {detailTask.subtarefas.length === 0
                        ? 'Adicione subtarefas para acompanhar o progresso automaticamente.'
                        : `${getTaskProgressSummary(detailTask).completed} de ${getTaskProgressSummary(detailTask).total} subtarefas concluidas`}
                    </p>
                  </div>

                  {detailTask.subtarefas.length > 0 && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                      {getTaskProgressSummary(detailTask).percent}% concluido
                    </span>
                  )}
                </div>

                <div className={`grid gap-3 rounded-2xl border p-3 ${isDark ? 'border-[#353535] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      O que sera feito?
                      <input
                        value={novaSubtarefa.descricao}
                        onChange={(event) => setNovaSubtarefa((current) => ({ ...current, descricao: event.target.value }))}
                        placeholder="Nova subtarefa"
                        className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100 placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-700'}`}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Quem e responsavel?
                      <select
                        value={novaSubtarefa.quem}
                        onChange={(event) => setNovaSubtarefa((current) => ({ ...current, quem: event.target.value }))}
                        className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                      >
                        <option value="">Selecione...</option>
                        {responsavelOptions.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </label>

                    <label className={`grid gap-2 text-sm font-medium sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Por que isso deve ser feito?
                      <textarea
                        rows={2}
                        value={novaSubtarefa.porQue}
                        onChange={(event) => setNovaSubtarefa((current) => ({ ...current, porQue: event.target.value }))}
                        className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Detalhamento
                      <textarea
                        rows={3}
                        value={novaSubtarefa.detalhamento}
                        onChange={(event) => setNovaSubtarefa((current) => ({ ...current, detalhamento: event.target.value }))}
                        className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Onde sera executado?
                      <select
                        value={novaSubtarefa.onde}
                        onChange={(event) => setNovaSubtarefa((current) => ({ ...current, onde: event.target.value }))}
                        className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                      >
                        <option value="">Selecione...</option>
                        {localOptions.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Como sera feito?
                      <input
                        value={novaSubtarefa.como}
                        onChange={(event) => setNovaSubtarefa((current) => ({ ...current, como: event.target.value }))}
                        className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Data inicio
                      <input
                        type="date"
                        value={novaSubtarefa.dataInicio}
                        onChange={(event) => setNovaSubtarefa((current) => ({ ...current, dataInicio: event.target.value }))}
                        className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Prazo final
                      <input
                        type="date"
                        value={novaSubtarefa.quando}
                        onChange={(event) => setNovaSubtarefa((current) => ({ ...current, quando: event.target.value }))}
                        className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Status
                      <select
                        value={novaSubtarefa.status}
                        onChange={(event) => setNovaSubtarefa((current) => ({ ...current, status: event.target.value as TaskSubtask['status'] }))}
                        className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="todo">A fazer</option>
                        <option value="doing">Em andamento</option>
                        <option value="done">Concluida</option>
                      </select>
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Prioridade
                      <select
                        value={novaSubtarefa.priority}
                        onChange={(event) => setNovaSubtarefa((current) => ({ ...current, priority: event.target.value as TaskSubtask['priority'] }))}
                        className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Quanto vai custar?
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={novaSubtarefa.quantoCusta}
                        onChange={(event) => setNovaSubtarefa((current) => ({ ...current, quantoCusta: Number(event.target.value) }))}
                        className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                      />
                    </label>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => void handleAddSubtarefa()}
                      className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                    >
                      Adicionar subtarefa
                    </button>
                  </div>
                </div>

                <ol className="grid gap-2">
                  {detailTask.subtarefas.length === 0 && (
                    <li className={`rounded-xl border border-dashed px-3 py-2 text-sm ${isDark ? 'border-[#353535] text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                      Nenhuma subtarefa cadastrada ainda.
                    </li>
                  )}

                  {detailTask.subtarefas.map((item) => (
                    <li key={item.id} className={`rounded-xl border px-3 py-3 ${isDark ? 'border-[#353535] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex flex-1 cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={item.status === 'done'}
                            onChange={() => void handleToggleSubtarefa(item.id, item.status === 'done')}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-300"
                          />
                          <div className="grid gap-1">
                            <span className={`text-sm font-medium ${item.status === 'done' ? 'line-through opacity-70' : ''} ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                              {item.descricao}
                            </span>
                            <div className={`flex flex-wrap gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <span>{getStatusLabel(item.status)}</span>
                              <span>Responsavel: {item.quem || '-'}</span>
                              <span>Inicio: {formatDate(item.dataInicio)}</span>
                              <span>Prazo: {formatDate(item.quando)}</span>
                            </div>
                          </div>
                        </label>

                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${priorityBadge[item.priority]}`}>
                          {priorityLabel[item.priority]}
                        </span>
                      </div>

                      {(item.porQue || item.detalhamento || item.como || item.onde || item.quantoCusta > 0) && (
                        <div className={`mt-3 grid gap-1 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {item.porQue && <p><strong>Por que:</strong> {item.porQue}</p>}
                          {item.detalhamento && <p className="whitespace-pre-wrap"><strong>Detalhamento:</strong> {item.detalhamento}</p>}
                          <p><strong>Onde:</strong> {item.onde || '-'} • <strong>Como:</strong> {item.como || '-'}</p>
                          <p><strong>Custo:</strong> {formatCurrency(item.quantoCusta)}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </section>

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
            <div className="w-full md:w-90">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por tarefa, etiqueta, motivo ou subtarefa..."
                className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100 placeholder:text-slate-500' : 'border-slate-300 bg-white text-slate-700'}`}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`inline-flex rounded-xl border p-1 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-300 bg-white'}`}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${viewMode === 'table' ? 'bg-blue-600 text-white' : isDark ? 'text-slate-300 hover:bg-[#252525]' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                Tabela
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : isDark ? 'text-slate-300 hover:bg-[#252525]' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                Kanban
              </button>
            </div>

            {viewMode === 'kanban' && (
              <label className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] bg-[#181818] text-slate-200' : 'border-slate-300 bg-white text-slate-700'}`}>
                Cards por coluna
                <select
                  value={kanbanCardsPerColumn}
                  onChange={(event) => setKanbanCardsPerColumn(Number(event.target.value))}
                  className={`rounded-lg border px-2 py-1 text-sm outline-none ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-300 bg-white text-slate-700'}`}
                >
                  <option value={4}>4</option>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                  <option value={12}>12</option>
                </select>
              </label>
            )}

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
        </div>
        {viewMode === 'table' ? (
          <>
            <div className={`overflow-x-auto rounded-2xl border hidden lg:block ${isDark ? 'border-[#353535]' : 'border-slate-200'}`}>
              <table className={`w-full table-fixed divide-y text-left ${isDark ? 'divide-[#2f2f2f] bg-[#181818]' : 'divide-slate-200 bg-white'}`}>
                <colgroup>
                  <col className="w-24" />
                  <col className="w-48" />
                  <col className="w-36" />
                  <col className="w-28" />
                  <col className="w-28" />
                  <col className="w-32" />
                  <col className="w-22" />
                  <col className="w-22" />
                  <col className="w-22" />
                  <col className="w-24" />
                  <col className="w-32" />
                  <col className="w-20" />
                </colgroup>
                <thead className={`${isDark ? 'bg-[#212121] text-slate-300' : 'bg-slate-50 text-slate-600'} text-xs uppercase tracking-wide`}>
                  <tr>
                    <th className="px-3 py-2.5">
                      <button type="button" onClick={() => handleSort('segment')} className="inline-flex items-center gap-1 whitespace-nowrap">
                        Categoria <span>{getSortIndicator('segment')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-2.5">
                      <button type="button" onClick={() => handleSort('oQue')} className="inline-flex items-center gap-1 whitespace-nowrap">
                        O que <span>{getSortIndicator('oQue')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-2.5">
                      <button type="button" onClick={() => handleSort('porQue')} className="inline-flex items-center gap-1 whitespace-nowrap">
                        Por que <span>{getSortIndicator('porQue')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-2.5">
                      <button type="button" onClick={() => handleSort('onde')} className="inline-flex items-center gap-1 whitespace-nowrap">
                        Onde <span>{getSortIndicator('onde')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-2.5">
                      <button type="button" onClick={() => handleSort('quem')} className="inline-flex items-center gap-1 whitespace-nowrap">
                        Quem <span>{getSortIndicator('quem')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-2.5">
                      <button type="button" onClick={() => handleSort('como')} className="inline-flex items-center gap-1 whitespace-nowrap">
                        Como <span>{getSortIndicator('como')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-2.5">
                      <button type="button" onClick={() => handleSort('priority')} className="inline-flex items-center gap-1 whitespace-nowrap">
                        Prior. <span>{getSortIndicator('priority')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-2.5">
                      <button type="button" onClick={() => handleSort('dataInicio')} className="inline-flex items-center gap-1 whitespace-nowrap">
                        Início <span>{getSortIndicator('dataInicio')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-2.5">
                      <button type="button" onClick={() => handleSort('quando')} className="inline-flex items-center gap-1 whitespace-nowrap">
                        Prazo <span>{getSortIndicator('quando')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-2.5">
                      <button type="button" onClick={() => handleSort('status')} className="inline-flex items-center gap-1 whitespace-nowrap">
                        Status <span>{getSortIndicator('status')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-2.5">
                      <button type="button" onClick={() => handleSort('progresso')} className="inline-flex items-center gap-1 whitespace-nowrap">
                        Progresso <span>{getSortIndicator('progresso')}</span>
                      </button>
                    </th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs ${isDark ? 'divide-[#2f2f2f] text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                  {paginatedTrackingRows.length === 0 && (
                    <tr>
                      <td colSpan={12} className={`px-3 py-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Nenhuma tarefa para acompanhar.
                      </td>
                    </tr>
                  )}

                  {paginatedTrackingRows.map(({ task, segment }) => (
                    <tr key={task.id} className={`align-middle ${isDark ? 'hover:bg-[#212121]' : 'hover:bg-slate-50'}`}>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${segmentBadge[segment]}`}>
                          {segmentLabel[segment]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="grid gap-1">
                          <span className="truncate font-semibold" title={task.oQue}>{task.oQue}</span>
                          <TaskTags tags={task.etiquetas} isDark={isDark} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="line-clamp-2" title={task.porQue}>{task.porQue}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="truncate block" title={task.onde}>{task.onde}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="truncate block" title={task.quem}>{task.quem}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="line-clamp-2" title={task.como}>{task.como}</span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${priorityBadge[task.priority]}`}>
                          {priorityLabel[task.priority]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(task.dataInicio)}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap ${getPrazoClass(task.quando)}`}>{formatDate(task.quando)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${statusBadge[task.status]}`}>
                          {statusLabel[task.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <TaskProgress task={task} isDark={isDark} compact />
                      </td>
                      <td className="px-3 py-2.5">
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

                  <TaskTags tags={task.etiquetas} isDark={isDark} />

                  <div className={`mt-3 grid gap-2 text-sm sm:grid-cols-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
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

                  <div className="mt-3">
                    <TaskProgress task={task} isDark={isDark} />
                  </div>

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
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {(['pending', 'todo', 'doing', 'done'] as TaskStatus[]).map((status) => {
              const rows = kanbanColumns[status]
              const shouldEnableScroll = rows.length > kanbanCardsPerColumn

              return (
                <section
                  key={status}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragOverStatus(status)
                  }}
                  onDragLeave={() => {
                    setDragOverStatus((current) => (current === status ? null : current))
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    void handleKanbanDrop(status)
                  }}
                  className={`flex flex-col rounded-2xl border p-3 transition ${
                    dragOverStatus === status
                      ? isDark
                        ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/40'
                        : 'border-sky-300 bg-sky-50 ring-2 ring-sky-200'
                      : isDark
                        ? 'border-[#353535] bg-[#181818]'
                        : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{statusLabel[status]}</h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {rows.length} tarefa(s){shouldEnableScroll ? ` • scroll após ${kanbanCardsPerColumn}` : ''}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${statusBadge[status]}`}>
                      {rows.length}
                    </span>
                  </div>

                  <div
                    className={`grid gap-3 ${shouldEnableScroll ? 'overflow-y-auto pr-1' : ''}`}
                    style={shouldEnableScroll ? { maxHeight: `${kanbanCardsPerColumn * 15}rem` } : undefined}
                  >
                    {rows.length === 0 && (
                      <div className={`rounded-xl border border-dashed px-3 py-4 text-sm ${isDark ? 'border-[#3a3a3a] text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                        Sem tarefas nesta etapa.
                      </div>
                    )}

                    {rows.map(({ task, segment }) => (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = 'move'
                          event.dataTransfer.setData('text/plain', task.id)
                          setDraggedTaskId(task.id)
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null)
                          setDragOverStatus(null)
                        }}
                        className={`rounded-2xl border p-4 shadow-sm transition ${
                          draggedTaskId === task.id ? 'cursor-grabbing opacity-60' : 'cursor-grab'
                        } ${isDark ? 'border-[#353535] bg-[#212121]' : 'border-slate-200 bg-white'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="grid gap-2">
                            <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{task.oQue}</h4>
                            <TaskTags tags={task.etiquetas} isDark={isDark} />
                          </div>

                          <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${priorityBadge[task.priority]}`}>
                            {priorityLabel[task.priority]}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${segmentBadge[segment]}`}>
                            {segmentLabel[segment]}
                          </span>
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${statusBadge[task.status]}`}>
                            {statusLabel[task.status]}
                          </span>
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            Arraste para mover
                          </span>
                        </div>

                        <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <strong>Por que:</strong> {task.porQue || 'Sem descrição complementar.'}
                        </p>

                        <div className={`mt-3 grid gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span><strong>Quem:</strong> {task.quem || '-'}</span>
                          <span><strong>Onde:</strong> {task.onde || '-'}</span>
                          <span className={getPrazoClass(task.quando)}><strong>Prazo:</strong> {formatDate(task.quando)}</span>
                        </div>

                        <div className="mt-3">
                          <TaskProgress task={task} isDark={isDark} compact />
                        </div>

                        <div className="mt-4">{renderTaskActions(task)}</div>
                      </article>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
