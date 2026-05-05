import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import type { LayoutOutletContext } from '../layouts/AppLayout'

export function EtiquetasPage() {
  const { labelsCatalog, appsCatalog, theme } = useOutletContext<LayoutOutletContext>()
  const isDark = theme === 'dark'

  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const appById = (appId: string | null) =>
    appId ? appsCatalog.apps.find((a) => a.id === appId) : undefined

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) { toast.warning('Digite um nome para a etiqueta.'); return }
    if (labelsCatalog.labels.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
      toast.warning('Já existe uma etiqueta com esse nome.')
      return
    }
    setSaving(true)
    try {
      await labelsCatalog.addLabel(name)
      setNewName('')
      toast.success(`Etiqueta "${name}" criada.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar etiqueta.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    const name = editingName.trim()
    if (!name) { toast.warning('O nome não pode ficar em branco.'); return }
    setSavingEdit(true)
    try {
      await labelsCatalog.updateLabel(editingId, name)
      setEditingId(null)
      toast.success('Etiqueta atualizada.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar etiqueta.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      await labelsCatalog.deleteLabel(id)
      toast.success(`Etiqueta "${name}" removida.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir etiqueta.')
    }
  }

  const customLabels = labelsCatalog.labels.filter((l) => !l.sourceAppId)
  const appLabels = labelsCatalog.labels.filter((l) => l.sourceAppId)

  const inputClass = `rounded-xl border px-3 py-2 text-sm outline-none transition ${
    isDark
      ? 'border-slate-700 bg-slate-900 text-slate-100 ring-cyan-400 focus:ring'
      : 'border-slate-200 bg-white ring-sky-300 focus:ring'
  }`

  return (
    <main className="mx-auto w-[96%] py-8 md:w-[92%] xl:w-[90%]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Etiquetas</h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Gerencie as etiquetas disponíveis para classificar tarefas.
        </p>
      </div>

      {labelsCatalog.errorMessage && (
        <p className={`mb-4 rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-amber-400/40 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
          {labelsCatalog.errorMessage}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Etiquetas personalizadas */}
        <section className={`rounded-3xl border p-6 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <h2 className="mb-4 text-base font-bold">Etiquetas personalizadas</h2>

          <div className="mb-4 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd() }}
              placeholder="Nova etiqueta..."
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving}
              className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
                isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-sky-700 text-white hover:bg-sky-600'
              }`}
            >
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>

          {labelsCatalog.loading && (
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Carregando...</p>
          )}

          {!labelsCatalog.loading && customLabels.length === 0 && (
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Nenhuma etiqueta personalizada cadastrada.
            </p>
          )}

          <div className="grid gap-2">
            {customLabels.map((label) => (
              <div
                key={label.id}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                  isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50'
                }`}
              >
                {editingId === label.id ? (
                  <>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void handleUpdate() }}
                      className={`flex-1 rounded-lg border px-2 py-1 text-sm outline-none ${
                        isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-300 bg-white text-slate-900'
                      }`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => void handleUpdate()}
                      disabled={savingEdit}
                      className={`rounded-lg px-2 py-1 text-xs font-semibold ${isDark ? 'bg-cyan-500 text-slate-950' : 'bg-sky-700 text-white'}`}
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className={`rounded-lg border px-2 py-1 text-xs font-semibold ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'}`}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`mr-1 inline-flex h-2 w-2 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-sky-500'}`} />
                    <span className="flex-1 text-sm font-medium">{label.name}</span>
                    <button
                      type="button"
                      onClick={() => { setEditingId(label.id); setEditingName(label.name) }}
                      className={`rounded-lg border px-2 py-1 text-xs font-semibold ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(label.id, label.name)}
                      className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-500"
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Etiquetas de apps */}
        <section className={`rounded-3xl border p-6 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <h2 className="mb-1 text-base font-bold">Etiquetas de aplicativos</h2>
          <p className={`mb-4 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Criadas automaticamente a partir dos aplicativos cadastrados. Atualizadas conforme os apps são editados.
          </p>

          {labelsCatalog.loading && (
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Carregando...</p>
          )}

          {!labelsCatalog.loading && appLabels.length === 0 && (
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Nenhum aplicativo cadastrado ainda.
            </p>
          )}

          <div className="grid gap-2">
            {appLabels.map((label) => {
              const app = appById(label.sourceAppId)
              return (
                <div
                  key={label.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                    isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  {app?.photo ? (
                    <img src={app.photo} alt={app.name} className="h-6 w-6 rounded-lg object-cover" />
                  ) : (
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                    </div>
                  )}
                  <span className="flex-1 text-sm font-medium">{label.name}</span>
                  <span className={`rounded-lg px-2 py-0.5 text-xs ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                    automática
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
