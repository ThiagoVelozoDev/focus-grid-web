import type { Workspace } from '../types/workspace'

type ThemeMode = 'light' | 'dark'

type AppHeaderProps = {
  theme: ThemeMode
  userEmail: string | null | undefined
  workspaces: Workspace[]
  activeWorkspaceId: string
  onChangeWorkspace: (workspaceId: string) => void
  onOpenSidebar: () => void
  isSidebarCollapsed: boolean
  onToggleSidebarCollapse: () => void
  onToggleTheme: () => void
  onSignOut: () => void
}

export function AppHeader({
  theme,
  userEmail,
  workspaces,
  activeWorkspaceId,
  onChangeWorkspace,
  onOpenSidebar,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onToggleTheme,
  onSignOut,
}: AppHeaderProps) {
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

        <button
          type="button"
          aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          onClick={onToggleSidebarCollapse}
          className={`hidden h-10 w-10 items-center justify-center rounded-xl border lg:inline-flex ${isDark ? 'border-[#353535] bg-[#212121] text-slate-100' : 'border-slate-300 bg-white text-slate-700'}`}
        >
          {isSidebarCollapsed ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6 9 12l6 6" />
            </svg>
          )}
        </button>

        <h1 className="font-bold text-base ">Atividades Diárias</h1>
      </div>

      <div className="flex items-center gap-2">
        <label className={`hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold xl:flex ${isDark ? 'border-[#353535] text-slate-200' : 'border-slate-300 text-slate-600'}`}>
          <span>Workspace</span>
          <select
            value={activeWorkspaceId}
            onChange={(event) => onChangeWorkspace(event.target.value)}
            disabled={workspaces.length === 0}
            className={`rounded-lg border px-2 py-1 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? 'border-[#353535] bg-[#181818] text-slate-100' : 'border-slate-300 bg-white text-slate-700'}`}
          >
            {workspaces.length === 0 ? <option value="">Nenhum workspace</option> : null}
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </label>

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
