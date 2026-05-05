import { type FormEvent, useState } from 'react'
import type { Task, TaskInput, TaskSubtask } from '../types/task'
import { createEmptySubtask } from '../utils/subtask'

type TaskFormProps = {
  editingTask: Task | null
  workspaceId: string
  workspaceName?: string
  onSubmitTask: (input: TaskInput) => void | Promise<void>
  onCancelEdit: () => void
  responsaveis: string[]
  locais: string[]
  theme: 'light' | 'dark'
  initialEtiquetas?: string[]
}

const buildInitialForm = (editingTask: Task | null, workspaceId: string, initialEtiquetas: string[] = []): TaskInput => {
  if (!editingTask) {
    return {
      workspaceId,
      oQue: '',
      porQue: '',
      detalhamento: '',
      onde: '',
      dataInicio: '',
      quando: '',
      quem: '',
      como: '',
      quantoCusta: 0,
      status: 'pending',
      priority: 'medium',
      etiquetas: initialEtiquetas,
      subtarefas: [],
    }
  }

  return {
    workspaceId: editingTask.workspaceId,
    oQue: editingTask.oQue,
    porQue: editingTask.porQue,
    detalhamento: editingTask.detalhamento,
    onde: editingTask.onde,
    dataInicio: editingTask.dataInicio,
    quando: editingTask.quando,
    quem: editingTask.quem,
    como: editingTask.como,
    quantoCusta: editingTask.quantoCusta,
    status: editingTask.status,
    priority: editingTask.priority,
    etiquetas: editingTask.etiquetas,
    subtarefas: editingTask.subtarefas,
  }
}

export function TaskForm({
  editingTask,
  workspaceId,
  workspaceName,
  onSubmitTask,
  onCancelEdit,
  responsaveis,
  locais,
  theme,
  initialEtiquetas = [],
}: TaskFormProps) {
  const [form, setForm] = useState<TaskInput>(() => buildInitialForm(editingTask, workspaceId, initialEtiquetas))
  const [tagsInput, setTagsInput] = useState(() =>
    editingTask ? (editingTask.etiquetas ?? []).join(', ') : initialEtiquetas.join(', '),
  )
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((editingTask?.subtarefas ?? []).map((item) => [item.id, false])),
  )

  const responsavelOptions = Array.from(new Set([...responsaveis, editingTask?.quem ?? ''].filter(Boolean)))
  const localOptions = Array.from(new Set([...locais, editingTask?.onde ?? ''].filter(Boolean)))
  const isDark = theme === 'dark'

  const fieldClass = `rounded-xl border px-3 py-2 outline-none transition ${
    isDark ? 'border-slate-700 bg-slate-900 text-slate-100 ring-cyan-400 focus:ring' : 'border-slate-200 bg-white ring-sky-300 focus:ring'
  }`

  const handleChange = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubtaskChange = (subtaskId: string, updater: (subtask: TaskSubtask) => TaskSubtask) => {
    setForm((current) => ({
      ...current,
      subtarefas: current.subtarefas.map((item) => (item.id === subtaskId ? updater(item) : item)),
    }))
  }

  const toggleSubtaskExpanded = (subtaskId: string) => {
    setExpandedSubtasks((current) => ({
      ...current,
      [subtaskId]: !(current[subtaskId] ?? false),
    }))
  }

  const handleAddSubtask = () => {
    const newSubtask = createEmptySubtask({
      quem: form.quem,
      onde: form.onde,
      dataInicio: form.dataInicio,
      quando: form.quando,
    })

    setForm((current) => ({
      ...current,
      subtarefas: [...current.subtarefas, newSubtask],
    }))
    setExpandedSubtasks((current) => ({ ...current, [newSubtask.id]: true }))
  }

  const handleRemoveSubtask = (subtaskId: string) => {
    setForm((current) => ({
      ...current,
      subtarefas: current.subtarefas.filter((item) => item.id !== subtaskId),
    }))
    setExpandedSubtasks((current) => {
      const nextState = { ...current }
      delete nextState[subtaskId]
      return nextState
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const subtarefas = form.subtarefas
      .map((item) => ({
        ...item,
        descricao: item.descricao.trim(),
        porQue: item.porQue.trim(),
        detalhamento: item.detalhamento.trim(),
        como: item.como.trim(),
      }))
      .filter((item) => item.descricao.length > 0)

    const etiquetas = tagsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, array) => array.indexOf(item) === index)

    void onSubmitTask({
      ...form,
      workspaceId: form.workspaceId,
      etiquetas,
      subtarefas,
    })

    if (!editingTask) {
      setForm(buildInitialForm(null, workspaceId))
      setTagsInput('')
      setExpandedSubtasks({})
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`grid gap-5 rounded-3xl border p-6 shadow-lg ${isDark ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-white/60 bg-white/80'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          {editingTask ? 'Editar tarefa 5W2H' : 'Nova tarefa 5W2H'}
        </h2>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-cyan-500/15 text-cyan-300' : 'bg-sky-100 text-sky-700'}`}>
          Workspace: {workspaceName ?? 'Atual'}
        </span>
      </div>

      <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        O que sera feito?
        <input
          required
          value={form.oQue}
          onChange={(event) => handleChange('oQue', event.target.value)}
          placeholder="Descreva a tarefa"
          className={fieldClass}
        />
      </label>

      <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        Etiquetas
        <input
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          placeholder="Ex.: financeiro, cliente A, urgente"
          className={fieldClass}
        />
        <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Separe por vírgula para destacar rapidamente o contexto da atividade.
        </span>
      </label>

      <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        Por que isso deve ser feito?
        <textarea
          required
          rows={2}
          value={form.porQue}
          onChange={(event) => handleChange('porQue', event.target.value)}
          placeholder="Motivo e impacto esperado"
          className={fieldClass}
        />
      </label>

      <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        Detalhamento da tarefa
        <textarea
          required
          rows={6}
          value={form.detalhamento}
          onChange={(event) => handleChange('detalhamento', event.target.value)}
          placeholder="Descreva contexto, premissas, etapas e observacoes importantes"
          className={fieldClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          Onde sera executado?
          <select required value={form.onde} onChange={(event) => handleChange('onde', event.target.value)} className={fieldClass}>
            <option value="">Selecione...</option>
            {localOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          Quem e responsavel?
          <select required value={form.quem} onChange={(event) => handleChange('quem', event.target.value)} className={fieldClass}>
            <option value="">Selecione...</option>
            {responsavelOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        Como sera feito?
        <input required value={form.como} onChange={(event) => handleChange('como', event.target.value)} placeholder="Metodo, processo ou estrategia" className={fieldClass} />
      </label>

      <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        Quanto vai custar?
        <input required type="number" min={0} step="0.01" value={form.quantoCusta} onChange={(event) => handleChange('quantoCusta', Number(event.target.value))} placeholder="0.00" className={fieldClass} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          Data inicio
          <input required type="date" value={form.dataInicio} onChange={(event) => handleChange('dataInicio', event.target.value)} className={fieldClass} />
        </label>

        <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          Quando (prazo)
          <input required type="date" value={form.quando} onChange={(event) => handleChange('quando', event.target.value)} className={fieldClass} />
        </label>

        <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          Status
          <select value={form.status} onChange={(event) => handleChange('status', event.target.value as TaskInput['status'])} className={fieldClass}>
            <option value="pending">Pendente</option>
            <option value="todo">A fazer</option>
            <option value="doing">Em andamento</option>
            <option value="done">Concluida</option>
          </select>
        </label>

        <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          Prioridade
          <select value={form.priority} onChange={(event) => handleChange('priority', event.target.value as TaskInput['priority'])} className={fieldClass}>
            <option value="low">Baixa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </label>
      </div>

      <section className={`grid gap-4 rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Checklist / subtarefas</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cada subtarefa pode ter os mesmos dados de planejamento da tarefa principal, incluindo inicio e prazo final.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddSubtask}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-sky-600 text-white hover:bg-sky-500'}`}
          >
            Adicionar subtarefa
          </button>
        </div>

        {form.subtarefas.length === 0 && (
          <div className={`rounded-xl border border-dashed px-3 py-4 text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
            Nenhuma subtarefa cadastrada ainda.
          </div>
        )}

        <div className="grid gap-3">
          {form.subtarefas.map((subtarefa, index) => {
            const isExpanded = expandedSubtasks[subtarefa.id] ?? true
            const subtaskTitle = subtarefa.descricao.trim() || `Subtarefa ${index + 1}`

            return (
              <div key={subtarefa.id} className={`grid gap-3 rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{subtaskTitle}</h4>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isExpanded ? isDark ? 'bg-cyan-500/15 text-cyan-300' : 'bg-sky-100 text-sky-700' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        {isExpanded ? 'Expandida' : 'Minimizada'}
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Responsavel: {subtarefa.quem || '-'} • Prazo: {subtarefa.quando || '-'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSubtaskExpanded(subtarefa.id)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                    >
                      {isExpanded ? 'Minimizar' : 'Maximizar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(subtarefa.id)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                    >
                      Remover
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      O que sera feito?
                      <input
                        value={subtarefa.descricao}
                        onChange={(event) => {
                          const updatedAt = new Date().toISOString()
                          handleSubtaskChange(subtarefa.id, (current) => ({ ...current, descricao: event.target.value, updatedAt }))
                        }}
                        placeholder={`Subtarefa ${index + 1}`}
                        className={fieldClass}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Quem e responsavel?
                      <select
                        value={subtarefa.quem}
                        onChange={(event) => {
                          const updatedAt = new Date().toISOString()
                          handleSubtaskChange(subtarefa.id, (current) => ({ ...current, quem: event.target.value, updatedAt }))
                        }}
                        className={fieldClass}
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
                        value={subtarefa.porQue}
                        onChange={(event) => {
                          const updatedAt = new Date().toISOString()
                          handleSubtaskChange(subtarefa.id, (current) => ({ ...current, porQue: event.target.value, updatedAt }))
                        }}
                        className={fieldClass}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Detalhamento
                      <textarea
                        rows={3}
                        value={subtarefa.detalhamento}
                        onChange={(event) => {
                          const updatedAt = new Date().toISOString()
                          handleSubtaskChange(subtarefa.id, (current) => ({ ...current, detalhamento: event.target.value, updatedAt }))
                        }}
                        className={fieldClass}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Onde sera executado?
                      <select
                        value={subtarefa.onde}
                        onChange={(event) => {
                          const updatedAt = new Date().toISOString()
                          handleSubtaskChange(subtarefa.id, (current) => ({ ...current, onde: event.target.value, updatedAt }))
                        }}
                        className={fieldClass}
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
                        value={subtarefa.como}
                        onChange={(event) => {
                          const updatedAt = new Date().toISOString()
                          handleSubtaskChange(subtarefa.id, (current) => ({ ...current, como: event.target.value, updatedAt }))
                        }}
                        className={fieldClass}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Data inicio
                      <input
                        type="date"
                        value={subtarefa.dataInicio}
                        onChange={(event) => {
                          const updatedAt = new Date().toISOString()
                          handleSubtaskChange(subtarefa.id, (current) => ({ ...current, dataInicio: event.target.value, updatedAt }))
                        }}
                        className={fieldClass}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Prazo final
                      <input
                        type="date"
                        value={subtarefa.quando}
                        onChange={(event) => {
                          const updatedAt = new Date().toISOString()
                          handleSubtaskChange(subtarefa.id, (current) => ({ ...current, quando: event.target.value, updatedAt }))
                        }}
                        className={fieldClass}
                      />
                    </label>

                    <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Status
                      <select
                        value={subtarefa.status}
                        onChange={(event) => {
                          const updatedAt = new Date().toISOString()
                          const nextStatus = event.target.value as TaskSubtask['status']
                          handleSubtaskChange(subtarefa.id, (current) => ({
                            ...current,
                            status: nextStatus,
                            updatedAt,
                            completedAt: nextStatus === 'done' ? updatedAt : null,
                          }))
                        }}
                        className={fieldClass}
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
                        value={subtarefa.priority}
                        onChange={(event) => {
                          const updatedAt = new Date().toISOString()
                          handleSubtaskChange(subtarefa.id, (current) => ({ ...current, priority: event.target.value as TaskSubtask['priority'], updatedAt }))
                        }}
                        className={fieldClass}
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
                        value={subtarefa.quantoCusta}
                        onChange={(event) => {
                          const updatedAt = new Date().toISOString()
                          handleSubtaskChange(subtarefa.id, (current) => ({ ...current, quantoCusta: Number(event.target.value), updatedAt }))
                        }}
                        className={fieldClass}
                      />
                    </label>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <div className="mt-1 flex flex-wrap gap-2">
        <button type="submit" className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-sky-600 text-white hover:bg-sky-500'}`}>
          {editingTask ? 'Salvar alteracoes' : 'Criar tarefa'}
        </button>
        <button type="button" onClick={onCancelEdit} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
          Voltar
        </button>
      </div>
    </form>
  )
}
