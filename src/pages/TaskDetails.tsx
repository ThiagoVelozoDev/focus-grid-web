import { useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useTasks } from '../hooks/useTasks'
import type { LayoutOutletContext } from '../layouts/AppLayout'
import type { Task, TaskStatus, TaskSubtask } from '../types/task'
import { createEmptySubtask } from '../utils/subtask'
import { getTaskProgressSummary } from '../utils/taskProgress'

const statusLabel: Record<TaskStatus, string> = {
  pending: 'Pendente',
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluida',
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

const formatDateTime = (value: string) => {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed)
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

const getStatusLabel = (status: unknown) => {
  if (status === 'pending' || status === 'todo' || status === 'doing' || status === 'done') {
    return statusLabel[status]
  }

  return '-'
}

type TaskProgressProps = {
  task: Task
  isDark: boolean
}

function TaskProgress({ task, isDark }: TaskProgressProps) {
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
      <div className={`flex items-center justify-between gap-2 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
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

export function TaskDetailsPage() {
  const navigate = useNavigate()
  const { taskId } = useParams<{ taskId?: string }>()
  const { responsaveis, locais, theme, activeWorkspaceId, activeWorkspace } = useOutletContext<LayoutOutletContext>()
  const { tasks, loading, addSubtask, toggleSubtask, addAcompanhamento, updateAcompanhamento } = useTasks(activeWorkspaceId)
  const [novaSubtarefa, setNovaSubtarefa] = useState<TaskSubtask>(() => createEmptySubtask())
  const [novoAcompanhamento, setNovoAcompanhamento] = useState('')
  const [editingAcompanhamentoId, setEditingAcompanhamentoId] = useState<string | null>(null)
  const [editingAcompanhamentoTexto, setEditingAcompanhamentoTexto] = useState('')
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({})
  const [showSubtaskForm, setShowSubtaskForm] = useState(false)

  const isDark = theme === 'dark'

  const detailTask = useMemo(
    () => (taskId ? tasks.find((task) => task.id === taskId) ?? null : null),
    [taskId, tasks],
  )

  const responsavelOptions = useMemo(
    () => Array.from(new Set(responsaveis.map((item) => item.trim()).filter(Boolean))),
    [responsaveis],
  )

  const localOptions = useMemo(
    () => Array.from(new Set(locais.map((item) => item.trim()).filter(Boolean))),
    [locais],
  )

  const handleBack = () => {
    navigate('/', { replace: true })
  }

  const handleAddAcompanhamento = async () => {
    if (!detailTask) {
      return
    }

    const texto = novoAcompanhamento.trim()
    if (!texto) {
      return
    }

    try {
      await addAcompanhamento(detailTask.id, texto)
      toast.success('Acompanhamento adicionado.')
      setNovoAcompanhamento('')
    } catch {
      toast.error('Erro ao adicionar acompanhamento.')
    }
  }

  const handleAddSubtarefa = async () => {
    if (!detailTask) {
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
      await addSubtask(detailTask.id, subtarefa)
      setExpandedSubtasks((current) => ({
        ...current,
        [subtarefa.id]: false,
      }))
      setNovaSubtarefa(
        createEmptySubtask({
          quem: detailTask.quem,
          onde: detailTask.onde,
          dataInicio: detailTask.dataInicio,
          quando: detailTask.quando,
        }),
      )
      setShowSubtaskForm(false)
      toast.success('Subtarefa adicionada.')
    } catch {
      toast.error('Erro ao adicionar subtarefa.')
    }
  }

  const handleToggleSubtarefa = async (subtaskId: string, isDone: boolean) => {
    if (!detailTask) {
      return
    }

    try {
      await toggleSubtask(detailTask.id, subtaskId)
      toast.success(isDone ? 'Subtarefa reaberta.' : 'Subtarefa concluida.')
    } catch {
      toast.error('Erro ao atualizar subtarefa.')
    }
  }

  const handleSaveAcompanhamento = async () => {
    if (!detailTask || !editingAcompanhamentoId) {
      return
    }

    const texto = editingAcompanhamentoTexto.trim()
    if (!texto) {
      return
    }

    try {
      await updateAcompanhamento(detailTask.id, editingAcompanhamentoId, texto)
      setEditingAcompanhamentoId(null)
      setEditingAcompanhamentoTexto('')
      toast.success('Acompanhamento atualizado.')
    } catch {
      toast.error('Erro ao atualizar acompanhamento.')
    }
  }

  const toggleSubtaskExpanded = (subtaskId: string) => {
    setExpandedSubtasks((current) => ({
      ...current,
      [subtaskId]: !(current[subtaskId] ?? false),
    }))
  }

  if (!activeWorkspaceId || !activeWorkspace) {
    return (
      <main className={`mx-auto grid w-[96%] py-8 md:w-[92%] xl:w-[90%] ${isDark ? 'text-slate-100' : ''}`}>
        <section className={`grid gap-4 rounded-3xl border p-6 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
          <div>
            <h1 className={`font-heading text-2xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Selecione um workspace primeiro</h1>
            <p className={`mt-2 max-w-2xl text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Para abrir o detalhamento, escolha um workspace ativo ou cadastre um novo workspace no sistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/configuracoes/workspaces"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Ir para workspaces
            </Link>
            <button
              type="button"
              onClick={handleBack}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              Voltar
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (loading && !detailTask) {
    return (
      <main className={`mx-auto grid w-[96%] py-8 md:w-[92%] xl:w-[90%] ${isDark ? 'text-slate-100' : ''}`}>
        <section className={`rounded-3xl border p-6 text-sm shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121] text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}>
          Carregando os dados da tarefa...
        </section>
      </main>
    )
  }

  if (!detailTask) {
    return (
      <main className={`mx-auto grid w-[96%] py-8 md:w-[92%] xl:w-[90%] ${isDark ? 'text-slate-100' : ''}`}>
        <section className={`grid gap-4 rounded-3xl border p-6 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
          <div>
            <h1 className={`font-heading text-2xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Tarefa nao encontrada</h1>
            <p className={`mt-2 max-w-2xl text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Verifique se ela ainda existe no workspace selecionado ou volte ao painel para escolher outra atividade.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleBack}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              Voltar ao painel
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={`mx-auto grid w-[96%] gap-6 py-8 md:w-[92%] xl:w-[90%] ${isDark ? 'text-slate-100' : ''}`}>
      <section className={`grid gap-3 rounded-3xl border p-5 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-white/40 bg-white/80'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
              Detalhamento 5W2H
            </p>
            <h1 className={`mt-1 font-heading text-2xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {detailTask.oQue}
            </h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Workspace atual: <strong>{activeWorkspace.name}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/tarefas/${detailTask.id}/editar`}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Editar tarefa
            </Link>
            <button
              type="button"
              onClick={handleBack}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              Voltar
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className={`grid gap-3 rounded-3xl border p-4 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-white/40 bg-white/80'}`}>
            <div className={`grid gap-2 rounded-2xl p-4 text-sm sm:grid-cols-2 ${isDark ? 'bg-[#181818] text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
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

            <div className={`rounded-2xl border p-4 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-200 bg-slate-50'}`}>
              <TaskProgress task={detailTask} isDark={isDark} />
            </div>

            <div className={`rounded-2xl border p-4 text-sm leading-relaxed ${isDark ? 'border-[#353535] bg-[#181818] text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Detalhamento
              </p>
              <p className="whitespace-pre-wrap">{detailTask.detalhamento || 'Sem detalhamento informado.'}</p>
            </div>
          </div>

          <section className={`grid gap-3 rounded-3xl border p-4 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-white/40 bg-white/80'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className={`font-heading text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Checklist / subtarefas</h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {detailTask.subtarefas.length === 0
                    ? 'Adicione subtarefas para acompanhar o progresso automaticamente.'
                    : `${getTaskProgressSummary(detailTask).completed} de ${getTaskProgressSummary(detailTask).total} subtarefas concluidas`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {detailTask.subtarefas.length > 0 && (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                    {getTaskProgressSummary(detailTask).percent}% concluido
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowSubtaskForm((current) => !current)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-sky-600 text-white hover:bg-sky-500'}`}
                >
                  {showSubtaskForm ? 'Ocultar formulário' : 'Adicionar Subtarefa'}
                </button>
              </div>
            </div>

            {showSubtaskForm ? (
              <div className={`grid gap-3 rounded-2xl border p-3 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-200 bg-slate-50'}`}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    O que sera feito?
                    <input
                      value={novaSubtarefa.descricao}
                      onChange={(event) => setNovaSubtarefa((current) => ({ ...current, descricao: event.target.value }))}
                      placeholder="Nova subtarefa"
                      className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100 placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-700'}`}
                    />
                  </label>

                  <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Quem e responsavel?
                    <select
                      value={novaSubtarefa.quem}
                      onChange={(event) => setNovaSubtarefa((current) => ({ ...current, quem: event.target.value }))}
                      className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
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
                      className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                    />
                  </label>

                  <label className={`grid gap-2 text-sm font-medium sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Detalhamento
                    <textarea
                      rows={3}
                      value={novaSubtarefa.detalhamento}
                      onChange={(event) => setNovaSubtarefa((current) => ({ ...current, detalhamento: event.target.value }))}
                      className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                    />
                  </label>

                  <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Onde sera executado?
                    <select
                      value={novaSubtarefa.onde}
                      onChange={(event) => setNovaSubtarefa((current) => ({ ...current, onde: event.target.value }))}
                      className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
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
                      className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                    />
                  </label>

                  <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Data inicio
                    <input
                      type="date"
                      value={novaSubtarefa.dataInicio}
                      onChange={(event) => setNovaSubtarefa((current) => ({ ...current, dataInicio: event.target.value }))}
                      className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                    />
                  </label>

                  <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Prazo final
                    <input
                      type="date"
                      value={novaSubtarefa.quando}
                      onChange={(event) => setNovaSubtarefa((current) => ({ ...current, quando: event.target.value }))}
                      className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                    />
                  </label>

                  <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Status
                    <select
                      value={novaSubtarefa.status}
                      onChange={(event) => setNovaSubtarefa((current) => ({ ...current, status: event.target.value as TaskSubtask['status'] }))}
                      className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
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
                      className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
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
                      className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
                    />
                  </label>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => void handleAddSubtarefa()}
                    className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                  >
                    Adicionar Subtarefa
                  </button>
                </div>
              </div>
            ) : (
              <div className={`rounded-2xl border border-dashed px-3 py-3 text-sm ${isDark ? 'border-[#353535] text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                O formulário de nova subtarefa está minimizado. Clique em <strong>{'"Adicionar Subtarefa"'}</strong> para preencher os campos apenas quando precisar.
              </div>
            )}

            <ol className="grid gap-2">
              {detailTask.subtarefas.length === 0 && (
                <li className={`rounded-xl border border-dashed px-3 py-2 text-sm ${isDark ? 'border-[#353535] text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                  Nenhuma subtarefa cadastrada ainda.
                </li>
              )}

              {detailTask.subtarefas.map((item, index) => {
                const isExpanded = expandedSubtasks[item.id] ?? false
                const subtaskTitle = item.descricao.trim() || `Subtarefa ${index + 1}`

                return (
                  <li key={item.id} className={`rounded-xl border px-3 py-3 ${isDark ? 'border-[#353535] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <input
                          type="checkbox"
                          checked={item.status === 'done'}
                          onChange={() => void handleToggleSubtarefa(item.id, item.status === 'done')}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-300"
                        />

                        <button
                          type="button"
                          onClick={() => toggleSubtaskExpanded(item.id)}
                          className="grid min-w-0 flex-1 gap-1 text-left"
                        >
                          <span className={`truncate text-sm font-medium ${item.status === 'done' ? 'line-through opacity-70' : ''} ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                            {subtaskTitle}
                          </span>
                          <div className={`flex flex-wrap gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span>{getStatusLabel(item.status)}</span>
                            <span>Responsavel: {item.quem || '-'}</span>
                            <span>Inicio: {formatDate(item.dataInicio)}</span>
                            <span>Prazo: {formatDate(item.quando)}</span>
                          </div>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${priorityBadge[item.priority]}`}>
                          {priorityLabel[item.priority]}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSubtaskExpanded(item.id)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${isDark ? 'border-[#353535] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                        >
                          {isExpanded ? 'Minimizar' : 'Maximizar'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={`mt-3 grid gap-1 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item.porQue && <p><strong>Por que:</strong> {item.porQue}</p>}
                        {item.detalhamento && <p className="whitespace-pre-wrap"><strong>Detalhamento:</strong> {item.detalhamento}</p>}
                        <p><strong>Onde:</strong> {item.onde || '-'} • <strong>Como:</strong> {item.como || '-'}</p>
                        <p><strong>Custo:</strong> {formatCurrency(item.quantoCusta)}</p>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        </div>

        <section className={`grid h-fit gap-3 rounded-3xl border p-4 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-white/40 bg-white/80'}`}>
          <h2 className={`font-heading text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Acompanhamentos</h2>

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

          <ol className="grid max-h-136 gap-2 overflow-y-auto pr-1">
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
                    <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {formatDateTime(item.createdAt)}
                    </p>
                    {editingAcompanhamentoId !== item.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAcompanhamentoId(item.id)
                          setEditingAcompanhamentoTexto(item.texto)
                        }}
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
                          onClick={() => void handleSaveAcompanhamento()}
                          className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAcompanhamentoId(null)
                            setEditingAcompanhamentoTexto('')
                          }}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold ${isDark ? 'border-[#353535] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={`mt-2 whitespace-pre-wrap text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.texto}</p>
                  )}
                </li>
              ))}
          </ol>
        </section>
      </section>
    </main>
  )
}
