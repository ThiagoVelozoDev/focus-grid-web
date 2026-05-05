import { useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'
import type { LayoutOutletContext } from '../layouts/AppLayout'
import type { Task, TaskStatus } from '../types/task'

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluída',
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-slate-100', text: 'text-slate-600' },
  todo: { bg: 'bg-blue-100', text: 'text-blue-700' },
  doing: { bg: 'bg-amber-100', text: 'text-amber-700' },
  done: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
}

const statusColorsDark: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-slate-700/50', text: 'text-slate-300' },
  todo: { bg: 'bg-blue-900/40', text: 'text-blue-300' },
  doing: { bg: 'bg-amber-900/40', text: 'text-amber-300' },
  done: { bg: 'bg-emerald-900/40', text: 'text-emerald-300' },
}

const priorityLabel: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

const priorityColors: Record<string, string> = {
  low: 'text-slate-400',
  medium: 'text-amber-500',
  high: 'text-rose-500',
}

function TaskCard({ task, isDark }: { task: Task; isDark: boolean }) {
  const colors = isDark ? statusColorsDark[task.status] : statusColors[task.status]

  return (
    <Link
      to={`/tarefas/${task.id}`}
      className={`block rounded-2xl border p-4 transition-all hover:shadow-md ${
        isDark ? 'border-slate-800 bg-slate-900 hover:border-slate-600' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">{task.oQue || 'Sem título'}</h3>
        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text}`}>
          {statusLabel[task.status] ?? task.status}
        </span>
      </div>

      {task.porQue && (
        <p className={`mb-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{task.porQue}</p>
      )}

      <div className={`flex flex-wrap items-center gap-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {task.quem && (
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {task.quem}
          </span>
        )}
        {task.quando && (
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M8 2v4M16 2v4M3 10h18" />
            </svg>
            {task.quando}
          </span>
        )}
        {task.priority && (
          <span className={`flex items-center gap-1 font-medium ${priorityColors[task.priority]}`}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            {priorityLabel[task.priority]}
          </span>
        )}
        {task.subtarefas.length > 0 && (
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 11l3 3 9-9" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            {task.subtarefas.filter((s) => s.status === 'done').length}/{task.subtarefas.length}
          </span>
        )}
      </div>
    </Link>
  )
}

const byStatus = (a: Task, b: Task) => {
  const order: Record<string, number> = { doing: 0, todo: 1, pending: 2, done: 3 }
  return (order[a.status] ?? 4) - (order[b.status] ?? 4)
}

const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'doing', label: 'Em andamento' },
  { value: 'todo', label: 'A fazer' },
  { value: 'pending', label: 'Pendente' },
  { value: 'done', label: 'Concluída' },
]

export function AplicativoTarefasPage() {
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()
  const { appsCatalog, theme, activeWorkspaceId } = useOutletContext<LayoutOutletContext>()
  const { tasks, loading } = useTasks(activeWorkspaceId)
  const isDark = theme === 'dark'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')

  const app = appsCatalog.apps.find((a) => a.id === appId)

  const appTasks = useMemo(() => {
    if (!app) return []
    return tasks.filter((t) => t.etiquetas.includes(app.name)).sort(byStatus)
  }, [tasks, app])

  const filteredTasks = useMemo(() => {
    let result = appTasks
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter)
    }
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (term) {
      result = result.filter((t) =>
        t.oQue.toLocaleLowerCase('pt-BR').includes(term) ||
        t.porQue.toLocaleLowerCase('pt-BR').includes(term),
      )
    }
    return result
  }, [appTasks, statusFilter, search])

  const counts = useMemo(() => ({
    total: appTasks.length,
    doing: appTasks.filter((t) => t.status === 'doing').length,
    todo: appTasks.filter((t) => t.status === 'todo').length,
    done: appTasks.filter((t) => t.status === 'done').length,
    pending: appTasks.filter((t) => t.status === 'pending').length,
  }), [appTasks])

  if (!appsCatalog.loading && !app) {
    return (
      <main className="mx-auto w-[96%] py-8 md:w-[92%] xl:w-[90%]">
        <div className={`rounded-3xl border p-8 text-center ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <p className={`mb-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aplicativo não encontrado.</p>
          <button
            type="button"
            onClick={() => navigate('/aplicativos')}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}
          >
            Voltar para Aplicativos
          </button>
        </div>
      </main>
    )
  }

  const hasActiveFilter = statusFilter !== 'all' || search.trim() !== ''

  return (
    <main className="mx-auto w-[96%] py-8 md:w-[92%] xl:w-[90%]">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start gap-3">
        <button
          type="button"
          onClick={() => navigate('/aplicativos')}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${
            isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Aplicativos
        </button>

        <div className="mr-auto flex items-center gap-3">
          {app?.photo && (
            <img src={app.photo} alt={app.name} className="h-10 w-10 rounded-xl object-cover" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{app?.name ?? 'Carregando...'}</h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tarefas com a etiqueta <strong>{app?.name}</strong>
            </p>
          </div>
        </div>

        {app && (
          <Link
            to={`/tarefas/nova?etiqueta=${encodeURIComponent(app.name)}`}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-sky-700 text-white hover:bg-sky-600'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Adicionar tarefa
          </Link>
        )}
      </div>

      {/* Counters — clicáveis para filtrar por status */}
      {!loading && counts.total > 0 && (
        <div className="mb-5 flex flex-wrap gap-3">
          {([
            { key: 'all' as const, label: 'Total', value: counts.total, color: isDark ? 'text-slate-300' : 'text-slate-700' },
            { key: 'doing' as const, label: 'Em andamento', value: counts.doing, color: 'text-amber-500' },
            { key: 'todo' as const, label: 'A fazer', value: counts.todo, color: 'text-blue-500' },
            { key: 'pending' as const, label: 'Pendentes', value: counts.pending, color: isDark ? 'text-slate-400' : 'text-slate-500' },
            { key: 'done' as const, label: 'Concluídas', value: counts.done, color: 'text-emerald-500' },
          ] as { key: TaskStatus | 'all'; label: string; value: number; color: string }[]).map(({ key, label, value, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-2xl border px-4 py-2 text-center transition-colors ${
                statusFilter === key
                  ? isDark ? 'border-cyan-500 bg-cyan-500/10' : 'border-sky-500 bg-sky-50'
                  : isDark ? 'border-slate-800 bg-slate-900 hover:border-slate-700' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      {!loading && appTasks.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* Busca por nome */}
          <div className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 ${
            isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="shrink-0 text-slate-400 hover:text-slate-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filtro por status */}
          <div className={`flex items-center gap-1 rounded-xl border p-1 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === opt.value
                    ? isDark ? 'bg-cyan-500 text-slate-950' : 'bg-sky-700 text-white'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Limpar filtros */}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => { setSearch(''); setStatusFilter('all') }}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {(loading || appsCatalog.loading) && (
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Carregando tarefas...</p>
      )}

      {/* Empty — sem nenhuma tarefa no app */}
      {!loading && !appsCatalog.loading && appTasks.length === 0 && app && (
        <div className={`rounded-3xl border border-dashed px-6 py-16 text-center ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
          <p className={`mb-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Nenhuma tarefa com a etiqueta <strong>{app.name}</strong> encontrada.
          </p>
          <Link
            to={`/tarefas/nova?etiqueta=${encodeURIComponent(app.name)}`}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-sky-700 text-white hover:bg-sky-600'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Criar primeira tarefa
          </Link>
        </div>
      )}

      {/* Empty — filtro sem resultado */}
      {!loading && appTasks.length > 0 && filteredTasks.length === 0 && (
        <div className={`rounded-3xl border border-dashed px-6 py-12 text-center ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Nenhuma tarefa encontrada para os filtros aplicados.
          </p>
        </div>
      )}

      {/* Task list */}
      {!loading && filteredTasks.length > 0 && (
        <>
          <p className={`mb-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {filteredTasks.length} {filteredTasks.length === 1 ? 'tarefa' : 'tarefas'} exibida{filteredTasks.length === 1 ? '' : 's'}
            {hasActiveFilter && ` (de ${appTasks.length} no total)`}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} isDark={isDark} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
