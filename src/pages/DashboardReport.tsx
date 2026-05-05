import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'
import type { LayoutOutletContext } from '../layouts/AppLayout'

const parseDateOnly = (value: string): Date | null => {
  if (!value) return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const [, year, month, day] = match
    return new Date(Number(year), Number(month) - 1, Number(day))
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const formatDate = (value: string) => {
  const d = parseDateOnly(value)
  if (!d) return '-'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(d)
}

function KpiCard({
  label,
  value,
  color,
  isDark,
  sub,
}: {
  label: string
  value: number | string
  color: string
  isDark: boolean
  sub?: string
}) {
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      {sub && <p className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{sub}</p>}
    </div>
  )
}

function Bar({ pct, color, isDark }: { pct: number; color: string; isDark: boolean }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
      <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }} />
    </div>
  )
}

export function DashboardReportPage() {
  const { theme, activeWorkspaceId, appsCatalog } = useOutletContext<LayoutOutletContext>()
  const { tasks, loading } = useTasks(activeWorkspaceId)
  const isDark = theme === 'dark'

  const metrics = useMemo(() => {
    const now = new Date()
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const next7 = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000)

    const total = tasks.length
    const pending = tasks.filter((t) => t.status === 'pending').length
    const todo = tasks.filter((t) => t.status === 'todo').length
    const doing = tasks.filter((t) => t.status === 'doing').length
    const done = tasks.filter((t) => t.status === 'done').length
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

    const overdue = tasks
      .filter((t) => {
        const d = parseDateOnly(t.quando)
        return d && d < todayDate && t.status !== 'done'
      })
      .sort((a, b) => {
        const da = parseDateOnly(a.quando)
        const db = parseDateOnly(b.quando)
        if (!da || !db) return 0
        return da.getTime() - db.getTime()
      })

    const upcoming = tasks
      .filter((t) => {
        const d = parseDateOnly(t.quando)
        return d && d >= todayDate && d <= next7 && t.status !== 'done'
      })
      .sort((a, b) => {
        const da = parseDateOnly(a.quando)
        const db = parseDateOnly(b.quando)
        if (!da || !db) return 0
        return da.getTime() - db.getTime()
      })

    const high = tasks.filter((t) => t.priority === 'high').length
    const medium = tasks.filter((t) => t.priority === 'medium').length
    const low = tasks.filter((t) => t.priority === 'low').length

    const personMap: Record<string, number> = {}
    for (const t of tasks) {
      if (t.quem) personMap[t.quem] = (personMap[t.quem] ?? 0) + 1
    }
    const byPerson = Object.entries(personMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    const totalCost = tasks.reduce((s, t) => s + (t.quantoCusta ?? 0), 0)
    const costDoing = tasks.filter((t) => t.status === 'doing').reduce((s, t) => s + (t.quantoCusta ?? 0), 0)
    const costDone = tasks.filter((t) => t.status === 'done').reduce((s, t) => s + (t.quantoCusta ?? 0), 0)
    const costPending = tasks.filter((t) => t.status !== 'done').reduce((s, t) => s + (t.quantoCusta ?? 0), 0)

    const allSubs = tasks.flatMap((t) => t.subtarefas)
    const doneSubs = allSubs.filter((s) => s.status === 'done').length

    const appTaskMap: Record<string, number> = {}
    for (const t of tasks) {
      for (const tag of t.etiquetas) {
        appTaskMap[tag] = (appTaskMap[tag] ?? 0) + 1
      }
    }
    const topApps = Object.entries(appTaskMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    return {
      total, pending, todo, doing, done, completionRate,
      overdue, upcoming,
      high, medium, low,
      byPerson,
      totalCost, costDoing, costDone, costPending,
      allSubsLen: allSubs.length, doneSubs,
      topApps,
    }
  }, [tasks])

  const card = `rounded-2xl border p-5 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`

  if (loading) {
    return (
      <main className="mx-auto w-[96%] py-8 md:w-[92%] xl:w-[90%]">
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Carregando...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-[96%] py-8 md:w-[92%] xl:w-[90%]">
      {/* Header */}
      <div className="mb-6">
        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
          Visão estratégica
        </p>
        <h1 className="mt-1 text-2xl font-bold">Dashboard</h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Indicadores e análises do workspace atual.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Total de tarefas" value={metrics.total} color={isDark ? 'text-slate-200' : 'text-slate-800'} isDark={isDark} />
        <KpiCard label="Em andamento" value={metrics.doing} color="text-amber-500" isDark={isDark} sub={metrics.total > 0 ? `${Math.round((metrics.doing / metrics.total) * 100)}% do total` : undefined} />
        <KpiCard label="Atrasadas" value={metrics.overdue.length} color="text-rose-500" isDark={isDark} sub={metrics.overdue.length > 0 ? 'Requerem atenção' : 'Tudo em dia'} />
        <KpiCard label="Concluídas" value={metrics.done} color="text-emerald-500" isDark={isDark} sub={metrics.total > 0 ? `${Math.round((metrics.done / metrics.total) * 100)}% do total` : undefined} />
        <KpiCard label="Taxa de conclusão" value={`${metrics.completionRate}%`} color="text-sky-500" isDark={isDark} sub={`${metrics.done} de ${metrics.total} tarefas`} />
      </div>

      {/* Row 2: Status + Priority */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Status distribution */}
        <div className={card}>
          <h2 className={`mb-4 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Distribuição por situação</h2>
          {metrics.total === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nenhuma tarefa cadastrada.</p>
          ) : (
            <div className="grid gap-3">
              {[
                { label: 'Em andamento', count: metrics.doing, color: 'bg-amber-500' },
                { label: 'A fazer', count: metrics.todo, color: 'bg-blue-500' },
                { label: 'Pendente', count: metrics.pending, color: 'bg-slate-400' },
                { label: 'Concluída', count: metrics.done, color: 'bg-emerald-500' },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{count}</span>
                  </div>
                  <Bar pct={metrics.total > 0 ? (count / metrics.total) * 100 : 0} color={color} isDark={isDark} />
                </div>
              ))}

              {/* Mini donut — visual summary as proportional segments */}
              <div className={`mt-2 flex h-3 w-full overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                {metrics.doing > 0 && <div className="bg-amber-500" style={{ width: `${(metrics.doing / metrics.total) * 100}%` }} />}
                {metrics.todo > 0 && <div className="bg-blue-500" style={{ width: `${(metrics.todo / metrics.total) * 100}%` }} />}
                {metrics.pending > 0 && <div className="bg-slate-400" style={{ width: `${(metrics.pending / metrics.total) * 100}%` }} />}
                {metrics.done > 0 && <div className="bg-emerald-500" style={{ width: `${(metrics.done / metrics.total) * 100}%` }} />}
              </div>
            </div>
          )}
        </div>

        {/* Priority + Subtasks */}
        <div className={card}>
          <h2 className={`mb-4 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Prioridade e subtarefas</h2>
          <div className="grid gap-3">
            {[
              { label: 'Alta prioridade', count: metrics.high, dotColor: 'bg-rose-500', textColor: 'text-rose-500' },
              { label: 'Média prioridade', count: metrics.medium, dotColor: 'bg-amber-500', textColor: 'text-amber-500' },
              { label: 'Baixa prioridade', count: metrics.low, dotColor: 'bg-slate-400', textColor: 'text-slate-400' },
            ].map(({ label, count, dotColor, textColor }) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
                <span className={`flex-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
                <span className={`text-xl font-bold ${textColor}`}>{count}</span>
              </div>
            ))}

            {metrics.allSubsLen > 0 && (
              <div className={`rounded-xl border px-4 py-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Subtarefas concluídas</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {metrics.doneSubs}/{metrics.allSubsLen}
                  </span>
                </div>
                <Bar pct={(metrics.doneSubs / metrics.allSubsLen) * 100} color="bg-sky-500" isDark={isDark} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: By person + Cost */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* By person */}
        <div className={card}>
          <h2 className={`mb-4 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Tarefas por responsável</h2>
          {metrics.byPerson.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nenhum responsável atribuído ainda.</p>
          ) : (
            <div className="grid gap-3">
              {metrics.byPerson.map(({ name, count }, i) => (
                <div key={name}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        i === 0
                          ? 'bg-sky-500 text-white'
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {i + 1}
                      </span>
                      <span className={`truncate text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`} title={name}>
                        {name}
                      </span>
                    </div>
                    <span className={`shrink-0 text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{count}</span>
                  </div>
                  <Bar
                    pct={(count / (metrics.byPerson[0]?.count ?? 1)) * 100}
                    color={i === 0 ? 'bg-sky-500' : 'bg-slate-400'}
                    isDark={isDark}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cost */}
        <div className={card}>
          <h2 className={`mb-4 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Custo estimado</h2>
          {metrics.totalCost === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nenhum custo registrado nas tarefas.</p>
          ) : (
            <div className="grid gap-3">
              <div className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total geral (estimado)</p>
                <p className="mt-1.5 text-2xl font-bold text-sky-500">{formatCurrency(metrics.totalCost)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Em andamento', value: metrics.costDoing, color: 'text-amber-500' },
                  { label: 'Concluídas', value: metrics.costDone, color: 'text-emerald-500' },
                  { label: 'A executar', value: metrics.costPending, color: 'text-rose-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded-xl border p-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <p className={`text-[10px] font-medium leading-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
                    <p className={`mt-1 text-sm font-bold ${color}`}>{formatCurrency(value)}</p>
                  </div>
                ))}
              </div>
              {metrics.totalCost > 0 && (
                <div>
                  <p className={`mb-1.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Percentual concluído</p>
                  <Bar pct={(metrics.costDone / metrics.totalCost) * 100} color="bg-emerald-500" isDark={isDark} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Overdue + Upcoming */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Overdue */}
        <div className={card}>
          <div className="mb-4 flex items-center gap-2">
            <h2 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Tarefas atrasadas</h2>
            {metrics.overdue.length > 0 && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                {metrics.overdue.length}
              </span>
            )}
          </div>
          {metrics.overdue.length === 0 ? (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${isDark ? 'border-emerald-800/40 bg-emerald-900/20' : 'border-emerald-200 bg-emerald-50'}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                Nenhuma tarefa atrasada!
              </span>
            </div>
          ) : (
            <div className="grid max-h-60 gap-2 overflow-y-auto">
              {metrics.overdue.slice(0, 10).map((t) => (
                <Link
                  key={t.id}
                  to={`/tarefas/${t.id}`}
                  className={`flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors ${
                    isDark
                      ? 'border-rose-900/40 bg-rose-950/20 hover:bg-rose-900/30'
                      : 'border-rose-100 bg-rose-50 hover:bg-rose-100'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {t.oQue || 'Sem título'}
                    </p>
                    {t.quem && (
                      <p className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.quem}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-rose-500">{formatDate(t.quando)}</span>
                </Link>
              ))}
              {metrics.overdue.length > 10 && (
                <p className={`text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  +{metrics.overdue.length - 10} mais
                </p>
              )}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className={card}>
          <div className="mb-4 flex items-center gap-2">
            <h2 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Vencimentos próximos</h2>
            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>próximos 7 dias</span>
          </div>
          {metrics.upcoming.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Nenhum vencimento nos próximos 7 dias.
            </p>
          ) : (
            <div className="grid max-h-60 gap-2 overflow-y-auto">
              {metrics.upcoming.map((t) => (
                <Link
                  key={t.id}
                  to={`/tarefas/${t.id}`}
                  className={`flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors ${
                    isDark
                      ? 'border-amber-900/40 bg-amber-950/20 hover:bg-amber-900/30'
                      : 'border-amber-100 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {t.oQue || 'Sem título'}
                    </p>
                    {t.quem && (
                      <p className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.quem}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-amber-600">{formatDate(t.quando)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 5: Top apps */}
      {metrics.topApps.length > 0 && (
        <div className={card}>
          <h2 className={`mb-4 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Tarefas por sistema</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.topApps.map(({ name, count }) => {
              const app = appsCatalog.apps.find((a) => a.name === name)
              const maxCount = metrics.topApps[0]?.count ?? 1
              return (
                <div
                  key={name}
                  className={`rounded-xl border p-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {app?.photo ? (
                      <img src={app.photo} alt={app.name} className="h-7 w-7 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                      </div>
                    )}
                    <span className={`min-w-0 flex-1 truncate text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {name}
                    </span>
                    <span className="shrink-0 font-bold text-sky-500">{count}</span>
                  </div>
                  <Bar pct={(count / maxCount) * 100} color="bg-sky-500" isDark={isDark} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}
