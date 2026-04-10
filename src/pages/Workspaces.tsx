import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import type { LayoutOutletContext } from '../layouts/AppLayout'
import type { WorkspaceKind } from '../types/workspace'

const workspaceKindLabel: Record<WorkspaceKind, string> = {
  work: 'Trabalho',
  personal: 'Pessoal',
}

export function WorkspacesPage() {
  const {
    theme,
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    addWorkspace,
    workspacesLoading,
    workspacesErrorMessage,
  } = useOutletContext<LayoutOutletContext>()

  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceKind, setNewWorkspaceKind] = useState<WorkspaceKind>('personal')
  const isDark = theme === 'dark'

  const handleCreateWorkspace = async () => {
    const name = newWorkspaceName.trim()
    if (!name) {
      toast.info('Informe um nome para o workspace.')
      return
    }

    try {
      await addWorkspace(name, newWorkspaceKind)
      toast.success('Workspace salvo no Firebase com sucesso!')
      setNewWorkspaceName('')
      setNewWorkspaceKind('personal')
    } catch {
      toast.error('Erro ao salvar o workspace no Firebase.')
    }
  }

  return (
    <main className="mx-auto w-[96%] py-8 md:w-[92%] xl:w-[90%]">
      <section className={`grid gap-5 rounded-3xl border p-6 shadow-lg ${isDark ? 'border-[#2f2f2f] bg-[#212121] text-slate-200' : 'border-slate-200 bg-white text-slate-800'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl">Gerenciar workspaces</h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Crie áreas separadas para trabalho e pessoal. Tudo é sincronizado e salvo no Firebase.
            </p>
          </div>

          {activeWorkspace && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${activeWorkspace.kind === 'work' ? isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700' : isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
              Atual: {activeWorkspace.name} • {workspaceKindLabel[activeWorkspace.kind]}
            </span>
          )}
        </div>

        {workspacesErrorMessage && (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${isDark ? 'border-amber-500/40 bg-amber-500/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            <p className="font-semibold">Firestore bloqueou os workspaces.</p>
            <p className="mt-1">{workspacesErrorMessage}</p>
            <p className="mt-1 text-xs opacity-80">
              Para salvar no Firebase, inclua a regra da colecao `users/{'{uid}'}/workspaces` e publique as regras.
            </p>
          </div>
        )}

        <section className={`grid gap-4 rounded-3xl border p-4 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-200 bg-slate-50'}`}>
          <div className="grid gap-3">
            <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Workspace ativo
              <select
                value={activeWorkspaceId}
                onChange={(event) => setActiveWorkspaceId(event.target.value)}
                className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-300 bg-white text-slate-700'}`}
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name} ({workspaceKindLabel[workspace.kind]})
                  </option>
                ))}
              </select>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {workspacesLoading ? 'Carregando workspaces...' : `${workspaces.length} workspace(s) sincronizado(s) com o Firebase.`}
              </span>
            </label>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                Novo workspace
                <input
                  value={newWorkspaceName}
                  onChange={(event) => setNewWorkspaceName(event.target.value)}
                  placeholder="Ex: Casa, Estudos, Trabalho"
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100 placeholder:text-slate-500' : 'border-slate-300 bg-white text-slate-700'}`}
                />
              </label>

              <label className={`grid gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                Tipo
                <select
                  value={newWorkspaceKind}
                  onChange={(event) => setNewWorkspaceKind(event.target.value as WorkspaceKind)}
                  className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 transition focus:ring ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-300 bg-white text-slate-700'}`}
                >
                  <option value="work">Trabalho</option>
                  <option value="personal">Pessoal</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() => void handleCreateWorkspace()}
                className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500"
              >
                Criar
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Lista de workspaces</h3>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((workspace) => {
              const isActive = workspace.id === activeWorkspaceId

              return (
                <article
                  key={workspace.id}
                  className={`rounded-2xl border p-4 ${isDark ? 'border-[#353535] bg-[#181818]' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{workspace.name}</h4>
                      <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Tipo: {workspaceKindLabel[workspace.kind]}
                      </p>
                    </div>

                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? 'bg-sky-600 text-white' : isDark ? 'bg-[#252525] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      {isActive ? 'Ativo' : 'Disponível'}
                    </span>
                  </div>

                  <p className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Criado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(workspace.createdAt))}
                  </p>

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => setActiveWorkspaceId(workspace.id)}
                      className={`mt-4 rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] text-slate-200 hover:bg-[#252525]' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                    >
                      Usar este workspace
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      </section>
    </main>
  )
}
