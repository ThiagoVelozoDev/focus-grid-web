import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { CatalogItem } from '../hooks/useCatalog'

type CatalogCrudPageProps = {
  title: string
  description: string
  placeholder: string
  entries: CatalogItem[]
  loading: boolean
  errorMessage: string | null
  onAdd: (name: string) => Promise<void>
  onUpdate: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  theme: 'light' | 'dark'
}

export function CatalogCrudPage({
  title,
  description,
  placeholder,
  entries,
  loading,
  errorMessage,
  onAdd,
  onUpdate,
  onDelete,
  theme,
}: CatalogCrudPageProps) {
  const [search, setSearch] = useState('')
  const [newValue, setNewValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const isDark = theme === 'dark'

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (!term) {
      return entries
    }

    return entries.filter((item) => item.name.toLocaleLowerCase('pt-BR').includes(term))
  }, [entries, search])

  const handleAdd = async () => {
    const text = newValue.trim()
    if (!text) {
      toast.warning('Digite um nome antes de cadastrar.')
      return
    }

    try {
      await onAdd(text)
      toast.success(`"${text}" cadastrado com sucesso!`)
      setNewValue('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar. Tente novamente.'
      toast.error(message)
    }
  }

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id)
    setEditingValue(item.name)
  }

  const saveEdit = async () => {
    if (!editingId) {
      return
    }

    const text = editingValue.trim()
    if (!text) {
      toast.warning('O nome nao pode ficar em branco.')
      return
    }

    try {
      await onUpdate(editingId, text)
      toast.success('Item atualizado com sucesso!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar. Tente novamente.'
      toast.error(message)
    }
    setEditingId(null)
    setEditingValue('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingValue('')
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      await onDelete(id)
      toast.success(`"${name}" excluido com sucesso.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir. Tente novamente.'
      toast.error(message)
    }
  }

  return (
    <main className="mx-auto grid w-[96%] gap-8 py-8 md:w-[92%] xl:w-[90%] ">
      <section className={`rounded-3xl mb-8 border p-5 shadow-sm ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white mb-5'}`}>
        <h2 className="font-heading text-2xl">{title}</h2>
        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p>

        {errorMessage && (
          <p
            className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
              isDark ? 'border-amber-400/40 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'
            }`}
          >
            {errorMessage}
          </p>
        )}

        <div className="mt-4  mb grid gap-3 md:grid-cols-[1fr_auto] mb">
          <input
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
            placeholder={placeholder}
            className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}
          />
          <button
            type="button"
            onClick={() => void handleAdd()}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-sky-700 text-white hover:bg-sky-600'}`}
          >
            Cadastrar
          </button>
        </div>
      </section>

      <section className={`rounded-3xl border p-5 shadow-sm ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="grid gap-3">
          <h3 className="font-semibold">Lista</h3>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar..."
            className={`w-full max-w-xs rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}
          />
        </div>

        <div className="mt-4 grid gap-2">
          {loading && <p className="text-sm">Carregando...</p>}

          {!loading && filteredEntries.length === 0 && (
            <p className={`rounded-xl border border-dashed px-3 py-4 text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
              Nenhum item encontrado.
            </p>
          )}

          {filteredEntries.map((item) => (
            <article
              key={item.id}
              className={`rounded-xl border px-3 py-3 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}
            >
              {editingId === item.id ? (
                <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                  <input
                    value={editingValue}
                    onChange={(event) => setEditingValue(event.target.value)}
                    className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}
                  />
                  <button
                    type="button"
                    onClick={() => void saveEdit()}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${isDark ? 'bg-cyan-500 text-slate-950' : 'bg-sky-700 text-white'}`}
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-700'}`}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{item.name}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className={`rounded-lg border px-2 py-1 text-xs font-semibold ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-700'}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id, item.name)}
                      className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-600"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
