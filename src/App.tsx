import { Dashboard } from './pages/Dashboard'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm font-semibold text-slate-600">Carregando sessao...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <section className="w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-8 shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Focus Grid</p>
          <h1 className="mt-2 font-heading text-3xl text-slate-900">Entre para continuar</h1>
          <p className="mt-3 text-sm text-slate-600">
            Use sua conta Google para salvar seu historico no Firebase e acessar suas tarefas de qualquer lugar.
          </p>

          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-600"
          >
            Entrar com Google
          </button>
        </section>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-slate-200/70 bg-slate-950 px-4 py-5 text-slate-100 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-5">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Focus Grid</p>
          <h2 className="mt-2 font-heading text-xl">Painel de Execucao</h2>
        </div>

        <nav className="grid gap-2 text-sm">
          <span className="rounded-xl bg-slate-800/80 px-3 py-2 font-semibold text-white">Dashboard</span>
          <span className="rounded-xl px-3 py-2 text-slate-300">Historico no Firebase</span>
          <span className="rounded-xl px-3 py-2 text-slate-300">Acompanhamento 5W2H</span>
        </nav>

        <div className="mt-8 rounded-2xl bg-slate-900/80 p-3 text-xs text-slate-300">
          <p className="font-semibold text-slate-100">Conta conectada</p>
          <p className="mt-1 truncate">{user.email}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/50 bg-white/85 px-4 py-3 shadow-sm backdrop-blur lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
            <h1 className="font-heading text-xl text-slate-900">Tarefas e Metas</h1>
          </div>

          <button
            type="button"
            onClick={() => void signOutUser()}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Sair
          </button>
        </header>

        <Dashboard />
      </div>
    </div>
  )
}

export default App
