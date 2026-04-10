import { useMemo } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { TaskForm } from '../components/TaskForm'
import { useTasks } from '../hooks/useTasks'
import type { LayoutOutletContext } from '../layouts/AppLayout'
import type { TaskInput } from '../types/task'

export function TaskEditorPage() {
  const navigate = useNavigate()
  const { taskId } = useParams<{ taskId?: string }>()
  const { responsaveis, locais, theme, activeWorkspaceId, activeWorkspace } = useOutletContext<LayoutOutletContext>()
  const { tasks, loading, addTask, updateTask } = useTasks(activeWorkspaceId)
  const isDark = theme === 'dark'
  const isEditing = Boolean(taskId)

  const editingTask = useMemo(
    () => (taskId ? tasks.find((task) => task.id === taskId) ?? null : null),
    [taskId, tasks],
  )

  const handleBack = () => {
    navigate('/', { replace: true })
  }

  const handleSubmitTask = async (input: TaskInput) => {
    if (isEditing) {
      if (!editingTask) {
        toast.error('Nao foi possivel localizar a tarefa para edicao.')
        return
      }

      try {
        await updateTask(editingTask.id, input)
        toast.success('Tarefa atualizada com sucesso!')
        navigate('/', { replace: true })
      } catch {
        toast.error('Erro ao atualizar a tarefa. Tente novamente.')
      }

      return
    }

    try {
      await addTask(input)
      toast.success('Tarefa criada com sucesso!')
      navigate('/', { replace: true })
    } catch {
      toast.error('Erro ao criar a tarefa. Tente novamente.')
    }
  }

  if (!activeWorkspaceId || !activeWorkspace) {
    return (
      <main className={`mx-auto grid w-[96%] py-8 md:w-[92%] xl:w-[90%] ${isDark ? 'text-slate-100' : ''}`}>
        <section className={`grid gap-4 rounded-3xl border p-6 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-slate-200 bg-white'}`}>
          <div>
            <h1 className={`font-heading text-2xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Selecione um workspace primeiro</h1>
            <p className={`mt-2 max-w-2xl text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Para criar ou editar tarefas, escolha um workspace ativo ou cadastre um novo workspace no sistema.
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

  if (isEditing && loading && !editingTask) {
    return (
      <main className={`mx-auto grid w-[96%] py-8 md:w-[92%] xl:w-[90%] ${isDark ? 'text-slate-100' : ''}`}>
        <section className={`rounded-3xl border p-6 text-sm shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121] text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}>
          Carregando os dados da tarefa...
        </section>
      </main>
    )
  }

  if (isEditing && !editingTask) {
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
      <section className={`grid gap-3 rounded-3xl mb-8 border p-5 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121]' : 'border-white/40 bg-white/80'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
              Planejamento 5W2H
            </p>
            <h1 className={`mt-1 font-heading text-2xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {isEditing ? 'Editar tarefa' : 'Nova tarefa'}
            </h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Workspace atual: <strong>{activeWorkspace.name}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={handleBack}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] text-slate-200 hover:bg-[#2a2a2a]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
          >
            Voltar
          </button>
        </div>
      </section>

      <TaskForm
        key={`${taskId ?? 'new-task'}-${activeWorkspaceId}`}
        editingTask={editingTask}
        workspaceId={activeWorkspaceId}
        workspaceName={activeWorkspace.name}
        onSubmitTask={handleSubmitTask}
        onCancelEdit={handleBack}
        responsaveis={responsaveis}
        locais={locais}
        theme={theme}
      />
    </main>
  )
}
