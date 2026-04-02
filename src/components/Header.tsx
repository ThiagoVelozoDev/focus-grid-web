type ThemeMode = 'light' | 'dark'

type AppHeaderProps = {
  theme: ThemeMode
  userEmail: string | null | undefined
  onOpenSidebar: () => void
  onToggleTheme: () => void
  onSignOut: () => void
}

export function AppHeader({ theme, userEmail, onOpenSidebar, onToggleTheme, onSignOut }: AppHeaderProps) {
  const isDark = theme === 'dark'

  return (
    <header className={`sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-3 shadow-sm backdrop-blur lg:px-8 ${isDark ? 'border-[#2b2b2b] bg-[#212121]/95' : 'border-slate-200 bg-white/95'}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={onOpenSidebar}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-300 bg-white text-slate-700'}`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <h1 className="font-bold text-base ">Atividades Diárias</h1>
      </div>

      <div className="flex items-center gap-2">
        <span className={`hidden rounded-xl border px-3 py-2 text-xs font-semibold md:block ${isDark ? 'border-[#353535] text-slate-200' : 'border-slate-300 text-slate-600'}`}>
          Conta conectada: {userEmail ?? '-'}
        </span>
        <button
          type="button"
          onClick={onToggleTheme}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
        >
          {isDark ? 'Tema white' : 'Tema dark'}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100 hover:bg-[#2a2a2a]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
        >
          Sair
        </button>
      </div>
    </header>
  )
}
