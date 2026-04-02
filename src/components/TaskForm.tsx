import { type FormEvent, useState } from 'react'
import type { Task, TaskInput } from '../types/task'

type TaskFormProps = {
  editingTask: Task | null
  onSubmitTask: (input: TaskInput) => void | Promise<void>
  onCancelEdit: () => void
  responsaveis: string[]
  locais: string[]
  theme: 'light' | 'dark'
}

const initialTask: TaskInput = {
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
}

const buildInitialForm = (editingTask: Task | null): TaskInput => {
  if (!editingTask) {
    return initialTask
  }

  return {
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
  }
}

export function TaskForm({ editingTask, onSubmitTask, onCancelEdit, responsaveis, locais, theme }: TaskFormProps) {
  const [form, setForm] = useState<TaskInput>(() => buildInitialForm(editingTask))

  const responsavelOptions = Array.from(new Set([...responsaveis, editingTask?.quem ?? ''].filter(Boolean)))
  const localOptions = Array.from(new Set([...locais, editingTask?.onde ?? ''].filter(Boolean)))
  const isDark = theme === 'dark'

  const fieldClass = `rounded-xl border px-3 py-2 outline-none transition ${
    isDark ? 'border-slate-700 bg-slate-900 text-slate-100 ring-cyan-400 focus:ring' : 'border-slate-200 bg-white ring-sky-300 focus:ring'
  }`

  const handleChange = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmitTask(form)

    if (!editingTask) {
      setForm(initialTask)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`grid gap-5 rounded-3xl border p-6 shadow-lg ${isDark ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-white/60 bg-white/80'}`}>
      <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        {editingTask ? 'Editar tarefa 5W2H' : 'Nova tarefa 5W2H'}
      </h2>

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

      <div className="mt-1 flex flex-wrap gap-2">
        <button type="submit" className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-sky-600 text-white hover:bg-sky-500'}`}>
          {editingTask ? 'Salvar alteracoes' : 'Criar tarefa'}
        </button>
        <button type="button" onClick={onCancelEdit} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
          Fechar
        </button>
      </div>
    </form>
  )
}
