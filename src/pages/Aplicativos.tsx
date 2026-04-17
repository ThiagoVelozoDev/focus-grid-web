import { useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { useAppCategories } from '../hooks/useAppCategories'
import type { App, AppFormData } from '../hooks/useApps'
import type { LayoutOutletContext } from '../layouts/AppLayout'

const emptyForm: AppFormData = { name: '', url: '', photo: '', description: '', categoryId: '' }

const compressImage = (file: File, maxSize = 256, quality = 0.85): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas não suportado')); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('Imagem inválida'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'))
    reader.readAsDataURL(file)
  })

export function AplicativosPage() {
  const { appsCatalog, theme, activeWorkspaceId } = useOutletContext<LayoutOutletContext>()
  const { categories, addCategory, updateCategory, deleteCategory } = useAppCategories(activeWorkspaceId)
  const isDark = theme === 'dark'

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showCatModal, setShowCatModal] = useState(false)
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())
  const [editingApp, setEditingApp] = useState<App | null>(null)

  const toggleCollapse = (id: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const [form, setForm] = useState<AppFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')
  const [savingCat, setSavingCat] = useState(false)

  const filteredApps = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (!term) return appsCatalog.apps
    return appsCatalog.apps.filter((a) => a.name.toLocaleLowerCase('pt-BR').includes(term))
  }, [appsCatalog.apps, search])

  const grouped = useMemo(() => {
    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      apps: filteredApps.filter((a) => a.categoryId === cat.id),
    }))
    const uncategorized = filteredApps.filter(
      (a) => !a.categoryId || !categories.find((c) => c.id === a.categoryId),
    )
    return { categorized: result, uncategorized }
  }, [categories, filteredApps])

  const openAdd = () => { setEditingApp(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (app: App) => {
    setEditingApp(app)
    setForm({ name: app.name, url: app.url, photo: app.photo, description: app.description, categoryId: app.categoryId })
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditingApp(null); setForm(emptyForm) }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.warning('Selecione um arquivo de imagem válido.'); return }
    setCompressing(true)
    try {
      const base64 = await compressImage(file)
      setForm((prev) => ({ ...prev, photo: base64 }))
    } catch {
      toast.error('Não foi possível processar a imagem. Tente outra.')
    } finally {
      setCompressing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.warning('O nome é obrigatório.'); return }
    if (!form.url.trim()) { toast.warning('A URL é obrigatória.'); return }
    setSaving(true)
    try {
      const data: AppFormData = {
        name: form.name.trim(), url: form.url.trim(),
        photo: form.photo.trim(), description: form.description.trim(),
        categoryId: form.categoryId,
      }
      if (editingApp) {
        await appsCatalog.updateApp(editingApp.id, data)
        toast.success('Sistema atualizado com sucesso!')
      } else {
        await appsCatalog.addApp(data)
        toast.success('Sistema cadastrado com sucesso!')
      }
      closeModal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (app: App) => {
    try {
      await appsCatalog.deleteApp(app.id)
      toast.success(`"${app.name}" removido com sucesso.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir. Tente novamente.')
    }
  }

  const handleAddCategory = async () => {
    const name = newCatName.trim()
    if (!name) { toast.warning('Digite um nome para a categoria.'); return }
    setSavingCat(true)
    try {
      await addCategory(name)
      setNewCatName('')
      toast.success(`Categoria "${name}" criada.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar categoria.')
    } finally {
      setSavingCat(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCatId) return
    const name = editingCatName.trim()
    if (!name) { toast.warning('O nome não pode ficar em branco.'); return }
    setSavingCat(true)
    try {
      await updateCategory(editingCatId, name)
      setEditingCatId(null)
      toast.success('Categoria atualizada.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar categoria.')
    } finally {
      setSavingCat(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      await deleteCategory(id)
      toast.success(`Categoria "${name}" removida.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir categoria.')
    }
  }

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm outline-none ${
    isDark ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-300 bg-white text-slate-900'
  }`
  const labelClass = `block text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`

  const AppGrid = ({ apps }: { apps: App[] }) => (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9">
      {apps.map((app) => (
        <div key={app.id} className="group relative">
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md ${
              isDark ? 'border-slate-800 bg-slate-900 hover:border-slate-600' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {app.photo ? (
              <img src={app.photo} alt={app.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className={`flex aspect-square w-full items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
            )}
            <div className={`px-2 py-2 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
              <span className="block text-center text-xs font-semibold leading-tight">{app.name}</span>
            </div>
          </a>
          <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
            <button
              type="button"
              onClick={() => openEdit(app)}
              title="Editar"
              className={`rounded-lg border p-1 shadow-sm ${isDark ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-slate-300 bg-white text-slate-600'}`}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="m18.5 2.5 2 2L10 15l-3 1 1-3Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => void handleDelete(app)}
              title="Excluir"
              className="rounded-lg border border-rose-300 bg-white p-1 text-rose-500 shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <main className="mx-auto w-[96%] py-8 md:w-[92%] xl:w-[90%]">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">Aplicativos</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Acesse os sistemas cadastrados rapidamente.
          </p>
        </div>

        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className={`w-44 bg-transparent text-sm outline-none ${isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowCatModal(true)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
            isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 6h16M4 10h16M4 14h10" />
          </svg>
          Categorias
        </button>

        <button
          type="button"
          onClick={openAdd}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
            isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-sky-700 text-white hover:bg-sky-600'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar sistema
        </button>
      </div>

      {appsCatalog.errorMessage && (
        <p className={`mb-4 rounded-xl border px-3 py-2 text-sm ${isDark ? 'border-amber-400/40 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
          {appsCatalog.errorMessage}
        </p>
      )}

      {appsCatalog.loading && (
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Carregando...</p>
      )}

      {!appsCatalog.loading && filteredApps.length === 0 && (
        <div className={`rounded-3xl border border-dashed px-6 py-16 text-center ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {search ? 'Nenhum sistema encontrado.' : 'Nenhum sistema cadastrado. Clique em "Adicionar sistema" para começar.'}
          </p>
        </div>
      )}

      {!appsCatalog.loading && filteredApps.length > 0 && (
        <div className="grid gap-8">
          {grouped.categorized.map((group) =>
            group.apps.length === 0 ? null : (
              <section key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleCollapse(group.id)}
                  className={`mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsedCats.has(group.id) ? '-rotate-90' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  {group.name}
                  <span className={`ml-1 text-xs font-normal normal-case tracking-normal ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    {group.apps.length}
                  </span>
                </button>
                {!collapsedCats.has(group.id) && <AppGrid apps={group.apps} />}
              </section>
            ),
          )}

          {grouped.uncategorized.length > 0 && (
            <section>
              {grouped.categorized.some((g) => g.apps.length > 0) && (
                <button
                  type="button"
                  onClick={() => toggleCollapse('__uncategorized')}
                  className={`mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsedCats.has('__uncategorized') ? '-rotate-90' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  Sem categoria
                  <span className={`ml-1 text-xs font-normal normal-case tracking-normal ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    {grouped.uncategorized.length}
                  </span>
                </button>
              )}
              {!collapsedCats.has('__uncategorized') && <AppGrid apps={grouped.uncategorized} />}
            </section>
          )}
        </div>
      )}

      {/* Modal: Adicionar/Editar sistema */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h2 className="mb-5 text-lg font-bold">{editingApp ? 'Editar sistema' : 'Adicionar sistema'}</h2>

            <div className="grid gap-4">
              <div className="grid gap-1">
                <label className={labelClass}>Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Portal de RH"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-1">
                <label className={labelClass}>URL *</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://sistema.exemplo.com"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-1">
                <label className={labelClass}>Categoria</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label className={labelClass}>Imagem</label>
                <div className="flex items-center gap-3">
                  <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                    {compressing ? (
                      <svg className="h-5 w-5 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : form.photo ? (
                      <img src={form.photo} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    )}
                  </div>
                  <div className="grid flex-1 gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFileChange(e)} />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={compressing}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                      {compressing ? 'Processando...' : 'Selecionar arquivo'}
                    </button>
                    {form.photo && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, photo: '' }))}
                        className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50"
                      >
                        Remover imagem
                      </button>
                    )}
                  </div>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ou cole a URL da imagem abaixo</p>
                <input
                  value={form.photo.startsWith('data:') ? '' : form.photo}
                  onChange={(e) => setForm((prev) => ({ ...prev, photo: e.target.value }))}
                  placeholder="https://exemplo.com/logo.png"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-1">
                <label className={labelClass}>Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Para que serve este sistema?"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || compressing}
                className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${isDark ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'bg-sky-700 text-white hover:bg-sky-600'}`}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gerenciar categorias */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-sm rounded-3xl border p-6 shadow-xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Categorias</h2>
              <button
                type="button"
                onClick={() => { setShowCatModal(false); setEditingCatId(null); setNewCatName('') }}
                className={`rounded-lg p-1 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleAddCategory() }}
                placeholder="Nova categoria..."
                className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}
              />
              <button
                type="button"
                onClick={() => void handleAddCategory()}
                disabled={savingCat}
                className={`rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-50 ${isDark ? 'bg-cyan-500 text-slate-950' : 'bg-sky-700 text-white'}`}
              >
                Adicionar
              </button>
            </div>

            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {categories.length === 0 && (
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nenhuma categoria cadastrada.</p>
              )}
              {categories.map((cat) => (
                <div key={cat.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                  {editingCatId === cat.id ? (
                    <>
                      <input
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') void handleUpdateCategory() }}
                        className={`flex-1 rounded-lg border px-2 py-1 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}
                        autoFocus
                      />
                      <button type="button" onClick={() => void handleUpdateCategory()} disabled={savingCat} className={`rounded-lg px-2 py-1 text-xs font-semibold ${isDark ? 'bg-cyan-500 text-slate-950' : 'bg-sky-700 text-white'}`}>Salvar</button>
                      <button type="button" onClick={() => setEditingCatId(null)} className={`rounded-lg border px-2 py-1 text-xs font-semibold ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'}`}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{cat.name}</span>
                      <button
                        type="button"
                        onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name) }}
                        className={`rounded-lg border px-2 py-1 text-xs font-semibold ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'}`}
                      >Editar</button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(cat.id, cat.name)}
                        className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-500"
                      >Excluir</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
