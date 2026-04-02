import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import heroLogo from '../assets/logo.png'

export function LoginPage() {
  const { signInWithGoogle } = useAuth()

  const handleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch {
      toast.error('Nao foi possivel autenticar com Google. Verifique a configuracao do Firebase Auth.')
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-10 h-96 w-96 rounded-full bg-emerald-200/50 blur-3xl" />

      <div className="relative grid min-h-dvh place-items-center px-4 py-8">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-2xl backdrop-blur">
          <div className="flex justify-center">
            <img src={heroLogo} alt="Logo Gerenciamento de Tarefas" className="h-24 w-24 object-contain" />
          </div>

          <h1 className="mt-2 font-heading text-3xl text-slate-900">Acesse seu painel 5W2H</h1>
          <p className="mt-3 text-sm text-slate-600">
            Entre com sua conta Google para sincronizar tarefas e acompanhar sua rotina.
          </p>

          <button
            type="button"
            onClick={() => void handleLogin()}
            className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.8 2.9l2.9 2.2c1.7-1.6 2.7-3.9 2.7-6.7 0-.6-.1-1.2-.2-1.8H12Z" />
              <path fill="#34A853" d="M12 21c2.4 0 4.4-.8 5.9-2.1l-2.9-2.2c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7l-3 .2v2.3C5.5 19.2 8.5 21 12 21Z" />
              <path fill="#4A90E2" d="M7 13.9c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V8.2H4c-.6 1.2-1 2.6-1 4s.4 2.8 1 4L7 13.9Z" />
              <path fill="#FBBC05" d="M12 6.8c1.3 0 2.4.4 3.3 1.3l2.4-2.4C16.4 4.4 14.4 3.6 12 3.6c-3.5 0-6.5 2-8 4.9l3 2.3c.7-2.1 2.7-4 5-4Z" />
            </svg>
            Entrar com Google
          </button>
        </section>
      </div>
    </main>
  )
}
