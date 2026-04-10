import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'
import type { LayoutOutletContext } from '../layouts/AppLayout'
import type { Task, TaskStatus } from '../types/task'
import { getTaskProgressSummary } from '../utils/taskProgress'

type ViewMode = 'month' | 'week'
type AgendaEventType = 'Inicio' | 'Prazo'

type AgendaEvent = {
  id: string
  task: Task
  date: Date
  dateKey: string
  type: AgendaEventType
}

const weekLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']

const statusLabel: Record<TaskStatus, string> = {
  pending: 'Pendente',
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluida',
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

const formatKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)

const addDays = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

const startOfWeek = (date: Date) => {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayIndex = (normalized.getDay() + 6) % 7
  normalized.setDate(normalized.getDate() - dayIndex)
  return normalized
}

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

const buildEvents = (task: Task): AgendaEvent[] => {
  const start = parseDateOnly(task.dataInicio)
  const due = parseDateOnly(task.quando)
  const events: AgendaEvent[] = []

  if (start) {
    events.push({
      id: `${task.id}-inicio`,
      task,
      date: start,
      dateKey: formatKey(start),
      type: 'Inicio',
    })
  }

  if (due && (!start || !isSameDay(start, due))) {
    events.push({
      id: `${task.id}-prazo`,
      task,
      date: due,
      dateKey: formatKey(due),
      type: 'Prazo',
    })
  }

  return events
}

const getStatusClasses = (status: TaskStatus, isDark: boolean) => {
  switch (status) {
    case 'done':
      return isDark ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    case 'doing':
      return isDark ? 'bg-violet-500/20 text-violet-200 border border-violet-500/30' : 'bg-violet-100 text-violet-800 border border-violet-200'
    case 'todo':
      return isDark ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-200'
    default:
      return isDark ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30' : 'bg-orange-100 text-orange-800 border border-orange-200'
  }
}

export function AgendaPage() {
  const { theme, activeWorkspaceId, activeWorkspace } = useOutletContext<LayoutOutletContext>()
  const { tasks, loading } = useTasks(activeWorkspaceId)
  const isDark = theme === 'dark'

  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [cursorDate, setCursorDate] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)

  const filteredTasks = useMemo(
    () => (statusFilter === 'all' ? tasks : tasks.filter((task) => task.status === statusFilter)),
    [statusFilter, tasks],
  )

  const events = useMemo(() => filteredTasks.flatMap(buildEvents), [filteredTasks])

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, AgendaEvent[]>()

    for (const event of events) {
      const current = grouped.get(event.dateKey) ?? []
      current.push(event)
      current.sort((left, right) => left.task.oQue.localeCompare(right.task.oQue, 'pt-BR', { sensitivity: 'base' }))
      grouped.set(event.dateKey, current)
    }

    return grouped
  }, [events])

  const monthDays = useMemo(() => {
    const firstDay = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1)
    const gridStart = startOfWeek(firstDay)

    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
  }, [cursorDate])

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursorDate)
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [cursorDate])

  const currentPeriodLabel =
    viewMode === 'month'
      ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(cursorDate)
      : `${formatDate(weekDays[0])} - ${formatDate(weekDays[weekDays.length - 1])}`

  const moveCalendar = (direction: number) => {
    const nextDate = new Date(cursorDate)

    if (viewMode === 'month') {
      nextDate.setMonth(nextDate.getMonth() + direction)
    } else {
      nextDate.setDate(nextDate.getDate() + direction * 7)
    }

    setCursorDate(nextDate)
  }

  return (
    <main className={`mx-auto grid w-[96%] gap-6 py-8 md:w-[92%] xl:w-[90%] ${isDark ? 'text-slate-100' : ''}`}>
      <section className={`grid gap-4 rounded-3xl border p-6 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={`font-heading text-2xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Agenda</h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Visualize tarefas por inicio e prazo final, com destaque por status e progresso da checklist.
            </p>
            <p className={`mt-1 text-xs font-semibold ${isDark ? 'text-cyan-300' : 'text-sky-700'}`}>
              Workspace atual: {activeWorkspace?.name ?? 'Trabalho'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${viewMode === 'month' ? 'bg-sky-600 text-white' : isDark ? 'border border-[#353535] bg-[#181818] text-slate-200' : 'border border-slate-300 bg-white text-slate-700'}`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${viewMode === 'week' ? 'bg-sky-600 text-white' : isDark ? 'border border-[#353535] bg-[#181818] text-slate-200' : 'border border-slate-300 bg-white text-slate-700'}`}
            >
              Semanal
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => moveCalendar(-1)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] bg-[#181818] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setCursorDate(new Date())}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] bg-[#181818] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => moveCalendar(1)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] bg-[#181818] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
            >
              Proximo
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-sm font-semibold capitalize ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{currentPeriodLabel}</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | TaskStatus)}
              className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'border-[#353535] bg-[#181818] text-slate-200' : 'border-slate-300 bg-white text-slate-700'}`}
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="todo">A fazer</option>
              <option value="doing">Em andamento</option>
              <option value="done">Concluida</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
            Sincronizando agenda com Firebase...
          </div>
        )}

        <div className={`overflow-hidden rounded-3xl border ${isDark ? 'border-[#353535]' : 'border-slate-200'}`}>
          <div className={`grid grid-cols-7 ${isDark ? 'bg-[#181818]' : 'bg-slate-50'}`}>
            {weekLabels.map((label) => (
              <div key={label} className={`border-b px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide ${isDark ? 'border-[#2f2f2f] text-slate-300' : 'border-slate-200 text-slate-600'}`}>
                {label}
              </div>
            ))}
          </div>

          {viewMode === 'month' ? (
            <div className="grid grid-cols-1 md:grid-cols-7">
              {monthDays.map((day) => {
                const dayKey = formatKey(day)
                const dayEvents = eventsByDay.get(dayKey) ?? []
                const isToday = isSameDay(day, new Date())
                const isCurrentMonth = day.getMonth() === cursorDate.getMonth()

                return (
                  <div key={dayKey} className={`min-h-40 border p-2 ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? 'bg-sky-600 text-white' : isCurrentMonth ? isDark ? 'text-slate-100' : 'text-slate-900' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {day.getDate()}
                      </span>
                      <span className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {dayEvents.length} item(ns)
                      </span>
                    </div>

                    <div className="grid gap-1.5">
                      {dayEvents.slice(0, 4).map((event) => {
                        const summary = getTaskProgressSummary(event.task)

                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => setSelectedEvent(event)}
                            className={`rounded-xl px-2 py-1.5 text-left text-xs font-semibold transition hover:opacity-90 ${getStatusClasses(event.task.status, isDark)}`}
                          >
                            <span className="block truncate">{event.task.oQue}</span>
                            <span className="mt-1 block text-[10px] opacity-80">
                              {event.type} • {summary.percent}%
                            </span>
                          </button>
                        )
                      })}

                      {dayEvents.length > 4 && (
                        <span className={`px-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          +{dayEvents.length - 4} mais
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-7">
              {weekDays.map((day) => {
                const dayKey = formatKey(day)
                const dayEvents = eventsByDay.get(dayKey) ?? []
                const isToday = isSameDay(day, new Date())

                return (
                  <div key={dayKey} className={`min-h-64 border p-3 ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
                    <div className="mb-3">
                      <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{weekLabels[(day.getDay() + 6) % 7]}</p>
                      <p className={`text-sm font-semibold ${isToday ? 'text-sky-500' : isDark ? 'text-slate-100' : 'text-slate-900'}`}>{formatDate(day)}</p>
                    </div>

                    <div className="grid gap-2">
                      {dayEvents.length === 0 && (
                        <div className={`rounded-xl border border-dashed px-2 py-3 text-center text-xs ${isDark ? 'border-[#353535] text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                          Sem tarefas
                        </div>
                      )}

                      {dayEvents.map((event) => {
                        const summary = getTaskProgressSummary(event.task)

                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => setSelectedEvent(event)}
                            className={`rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition hover:opacity-90 ${getStatusClasses(event.task.status, isDark)}`}
                          >
                            <span className="block">{event.task.oQue}</span>
                            <span className="mt-1 block text-[10px] opacity-80">
                              {event.type} • {summary.completed}/{summary.total || 0} subtarefas
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className={`grid gap-4 rounded-3xl border p-6 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className={`font-heading text-xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {selectedEvent ? 'Detalhes da tarefa' : 'Selecione uma tarefa no calendario'}
          </h3>
          {selectedEvent && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(selectedEvent.task.status, isDark)}`}>
              {statusLabel[selectedEvent.task.status]}
            </span>
          )}
        </div>

        {selectedEvent ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-3">
              <div>
                <h4 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{selectedEvent.task.oQue}</h4>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedEvent.task.porQue}</p>
              </div>

              <div className={`grid gap-2 rounded-2xl p-4 text-sm sm:grid-cols-2 ${isDark ? 'bg-[#181818] text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                <span><strong>Responsavel:</strong> {selectedEvent.task.quem || '-'}</span>
                <span><strong>Local:</strong> {selectedEvent.task.onde || '-'}</span>
                <span><strong>Inicio:</strong> {selectedEvent.task.dataInicio || '-'}</span>
                <span><strong>Prazo:</strong> {selectedEvent.task.quando || '-'}</span>
                <span><strong>Evento clicado:</strong> {selectedEvent.type}</span>
                <span><strong>Custo:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedEvent.task.quantoCusta)}</span>
              </div>

              <div className={`rounded-2xl border p-4 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-200 bg-slate-50'}`}>
                <p className={`mb-2 text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Detalhamento</p>
                <p className={`whitespace-pre-wrap text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {selectedEvent.task.detalhamento || 'Sem detalhamento informado.'}
                </p>
              </div>
            </div>

            <div className={`grid gap-3 rounded-2xl border p-4 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-200 bg-slate-50'}`}>
              {(() => {
                const summary = getTaskProgressSummary(selectedEvent.task)

                return (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Progresso</p>
                      <span className={`text-sm font-bold ${isDark ? 'text-cyan-300' : 'text-sky-700'}`}>{summary.percent}%</span>
                    </div>

                    <div className={`h-3 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${summary.percent}%` }} />
                    </div>

                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {summary.total === 0
                        ? 'Sem subtarefas cadastradas.'
                        : `${summary.completed} de ${summary.total} subtarefas concluidas`}
                    </p>

                    <div className="grid gap-2">
                      <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Checklist</p>

                      {selectedEvent.task.subtarefas.length === 0 && (
                        <div className={`rounded-xl border border-dashed px-3 py-3 text-sm ${isDark ? 'border-[#353535] text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                          Nenhuma subtarefa vinculada.
                        </div>
                      )}

                      {selectedEvent.task.subtarefas.map((item) => (
                        <div key={item.id} className={`rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-[#353535] bg-[#212121] text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span>{item.descricao}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.status === 'done' ? getStatusClasses('done', isDark) : getStatusClasses('pending', isDark)}`}>
                              {item.status === 'done' ? 'Concluida' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl border border-dashed px-4 py-8 text-center text-sm ${isDark ? 'border-[#353535] text-slate-400' : 'border-slate-300 text-slate-500'}`}>
            Clique em uma tarefa na agenda para abrir o resumo detalhado.
          </div>
        )}
      </section>
    </main>
  )
}
