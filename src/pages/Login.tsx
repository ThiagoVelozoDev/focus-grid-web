import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import heroLogo from '../assets/focusgrid-brand.svg'

type AuthMode = 'login' | 'register'

const highlights = [
  'Defina e acompanhe suas metas',
  'Organize sua rotina diária',
  'Visualize seu progresso',
]

function getAuthErrorMessage(error: unknown, mode: AuthMode) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'O login com Google foi cancelado.'
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela de login do Google.'
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.'
    case 'auth/invalid-email':
      return 'Informe um e-mail válido.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha inválidos.'
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.'
    case 'auth/operation-not-allowed':
      return 'Ative o provedor E-mail/Senha no Firebase Authentication.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.'
    default:
      return mode === 'register'
        ? 'Não foi possível criar sua conta agora.'
        : 'Não foi possível autenticar agora.'
  }
}

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isRegisterMode = mode === 'register'

  const handleGoogleLogin = async () => {
    setSubmitting(true)

    try {
      await signInWithGoogle()
    } catch (error) {
      toast.error(getAuthErrorMessage(error, 'login'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail || !password || (isRegisterMode && !trimmedName)) {
      toast.error('Preencha os campos obrigatórios para continuar.')
      return
    }

    if (isRegisterMode && password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setSubmitting(true)

    try {
      if (isRegisterMode) {
        await signUpWithEmail({
          name: trimmedName,
          email: trimmedEmail,
          password,
        })
        toast.success('Conta criada com sucesso.')
      } else {
        await signInWithEmail(trimmedEmail, password)
        toast.success('Login realizado com sucesso.')
      }
    } catch (error) {
      toast.error(getAuthErrorMessage(error, mode))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleMode = () => {
    setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'))
    setPassword('')
  }

  return (
    <main className="min-h-dvh bg-slate-100">
      <div className="grid min-h-dvh lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-linear-to-br from-blue-950 via-blue-800 to-sky-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_0,transparent_42%)]" />
          <div className="absolute -left-10 top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />

          <div className="relative z-10 flex h-full w-full flex-col justify-center px-12 py-16 text-white">
            <div className="mx-auto max-w-xl text-center">
              <img src={heroLogo} alt="FocusGrid" className="mx-auto h-auto w-64 max-w-full object-contain" />
              <p className="mt-6 font-heading text-4xl font-bold leading-tight">
                Alcance suas metas com foco, organização e disciplina diária.
              </p>

              <ul className="mt-10 space-y-4 text-left text-lg text-sky-50">
                {highlights.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/60 bg-white/10">
                      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.2 7.262a1 1 0 0 1-1.42.01L3.3 9.287a1 1 0 1 1 1.4-1.428l4.08 4.006 6.51-6.569a1 1 0 0 1 1.414-.006Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-10 sm:px-8 lg:bg-slate-50">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <img src={heroLogo} alt="FocusGrid" className="mx-auto h-auto w-28 object-contain" />
              <h1 className="mt-5 font-heading text-3xl font-bold text-slate-900">
                {isRegisterMode ? 'Crie sua conta' : 'Bem-vindo de volta'}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {isRegisterMode
                  ? 'Cadastre-se para gerenciar suas tarefas na nuvem.'
                  : 'Entre para gerenciar suas tarefas'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.8 2.9l2.9 2.2c1.7-1.6 2.7-3.9 2.7-6.7 0-.6-.1-1.2-.2-1.8H12Z" />
                <path fill="#34A853" d="M12 21c2.4 0 4.4-.8 5.9-2.1l-2.9-2.2c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7l-3 .2v2.3C5.5 19.2 8.5 21 12 21Z" />
                <path fill="#4A90E2" d="M7 13.9c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V8.2H4c-.6 1.2-1 2.6-1 4s.4 2.8 1 4L7 13.9Z" />
                <path fill="#FBBC05" d="M12 6.8c1.3 0 2.4.4 3.3 1.3l2.4-2.4C16.4 4.4 14.4 3.6 12 3.6c-3.5 0-6.5 2-8 4.9l3 2.3c.7-2.1 2.7-4 5-4Z" />
              </svg>
              Continuar com Google
            </button>

            <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>ou</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              {isRegisterMode ? (
                <label className="block text-sm font-semibold text-slate-700">
                  Nome
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 15 0" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Seu nome"
                      autoComplete="name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </label>
              ) : null}

              <label className="block text-sm font-semibold text-slate-700">
                E-mail
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 7.5v9A2.25 2.25 0 0 1 19.5 18.75h-15A2.25 2.25 0 0 1 2.25 16.5v-9m19.5 0A2.25 2.25 0 0 0 19.5 5.25h-15A2.25 2.25 0 0 0 2.25 7.5m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615A2.25 2.25 0 0 1 2.25 7.743V7.5" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Senha
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 0h10.5A2.25 2.25 0 0 1 19.5 12.75v6A2.25 2.25 0 0 1 17.25 21h-10.5A2.25 2.25 0 0 1 4.5 18.75v-6A2.25 2.25 0 0 1 6.75 10.5Z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </label>

              {isRegisterMode ? (
                <p className="text-xs text-slate-500">
                  Sua senha fica protegida no Firebase Authentication e não é armazenada em texto puro no banco.
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {submitting ? 'Aguarde...' : isRegisterMode ? 'Criar conta' : 'Entrar'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isRegisterMode ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                {isRegisterMode ? 'Entrar' : 'Criar conta'}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
