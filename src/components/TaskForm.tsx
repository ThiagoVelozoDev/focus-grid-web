import { type FormEvent, useState } from 'react'
import type { Task, TaskInput } from '../types/task'

type TaskFormProps = {
  editingTask: Task | null
  onSubmitTask: (input: TaskInput) => void
  onCancelEdit: () => void
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
  quantoCusta: '',
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

export function TaskForm({ editingTask, onSubmitTask, onCancelEdit }: TaskFormProps) {
  const [form, setForm] = useState<TaskInput>(() => buildInitialForm(editingTask))

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
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
      <h2 className="text-xl font-semibold text-slate-900">
        {editingTask ? 'Editar tarefa 5W2H' : 'Nova tarefa 5W2H'}
      </h2>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        O que sera feito?
        <input
          required
          value={form.oQue}
          onChange={(event) => handleChange('oQue', event.target.value)}
          placeholder="Descreva a tarefa"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-sky-300 transition focus:ring"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Por que isso deve ser feito?
        <textarea
          required
          rows={2}
          value={form.porQue}
          onChange={(event) => handleChange('porQue', event.target.value)}
          placeholder="Motivo e impacto esperado"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-sky-300 transition focus:ring"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Detalhamento da tarefa
        <textarea
          required
          rows={6}
          value={form.detalhamento}
          onChange={(event) => handleChange('detalhamento', event.target.value)}
          placeholder="Descreva contexto, premissas, etapas e observacoes importantes"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-sky-300 transition focus:ring"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Onde sera executado?
          <input
            required
            value={form.onde}
            onChange={(event) => handleChange('onde', event.target.value)}
            placeholder="Local, sistema ou contexto"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-sky-300 transition focus:ring"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Quem e responsavel?
          <input
            required
            value={form.quem}
            onChange={(event) => handleChange('quem', event.target.value)}
            placeholder="Pessoa responsavel"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-sky-300 transition focus:ring"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Como sera feito?
        <input
          required
          value={form.como}
          onChange={(event) => handleChange('como', event.target.value)}
          placeholder="Metodo, processo ou estrategia"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-sky-300 transition focus:ring"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Quanto vai custar?
        <input
          required
          value={form.quantoCusta}
          onChange={(event) => handleChange('quantoCusta', event.target.value)}
          placeholder="Tempo, dinheiro ou recursos"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-sky-300 transition focus:ring"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Data inicio
          <input
            required
            type="date"
            value={form.dataInicio}
            onChange={(event) => handleChange('dataInicio', event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-sky-300 transition focus:ring"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Quando (prazo)
          <input
            required
            type="date"
            value={form.quando}
            onChange={(event) => handleChange('quando', event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-sky-300 transition focus:ring"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Status
          <select
            value={form.status}
            onChange={(event) => handleChange('status', event.target.value as TaskInput['status'])}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-sky-300 transition focus:ring"
          >
            <option value="pending">Pendente</option>
            <option value="todo">A fazer</option>
            <option value="doing">Em andamento</option>
            <option value="done">Concluida</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Prioridade
          <select
            value={form.priority}
            onChange={(event) => handleChange('priority', event.target.value as TaskInput['priority'])}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-sky-300 transition focus:ring"
          >
            <option value="low">Baixa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </label>
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          {editingTask ? 'Salvar alteracoes' : 'Criar tarefa'}
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Fechar
        </button>
      </div>
    </form>
  )
}
