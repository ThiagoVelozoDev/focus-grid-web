import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import brandLogo from '../assets/focusgrid-brand.svg'

type ThemeMode = 'light' | 'dark'

type SidebarProps = {
    theme: ThemeMode
    isOpen: boolean
    isCollapsed: boolean
    onClose: () => void
}

const getNavClass = (isActive: boolean, isDark: boolean) => {
    if (isActive) {
        return isDark
            ? 'w-full cursor-pointer bg-[#252525] text-white'
            : 'w-full cursor-pointer bg-slate-200 text-slate-900'
    }

    return isDark
        ? 'w-full cursor-pointer text-slate-300 hover:bg-[#252525] hover:text-white'
        : 'w-full cursor-pointer text-slate-600 hover:bg-slate-200 hover:text-slate-900'
}

export function Sidebar({ theme, isOpen, isCollapsed, onClose }: SidebarProps) {
    const location = useLocation()
    const [showConfigMenu, setShowConfigMenu] = useState(true)
    const [showTasksMenu, setShowTasksMenu] = useState(true)

    const isDark = theme === 'dark'
    const isConfiguracoesActive = location.pathname.startsWith('/configuracoes')
    const isTarefasActive = location.pathname.startsWith('/configuracoes/tarefas')

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="Fechar menu"
                    onClick={onClose}
                    className="fixed inset-0 z-30 bg-black/45 lg:hidden"
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-40 h-screen w-70 overflow-y-auto border-r px-4 py-5 transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } ${isCollapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'
                    } ${isDark ? 'border-[#2b2b2b] bg-[#181818]' : 'border-slate-200 bg-white'}`}
            >
                <div className="mb-5">
                    <img src={brandLogo} alt="FocusGrid" className="h-auto w-40 rounded-2xl object-contain shadow-sm" />
                    <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-slate-300' : 'text-sky-700'}`}>
                        Painel FocusGrid
                    </p>
                </div>

                <nav className="grid gap-2 text-sm">
                    <NavLink
                        to="/dashboard"
                        onClick={onClose}
                        className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold transition-all duration-200 ${getNavClass(isActive, isDark)}`}
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <rect x="3" y="4" width="7" height="7" />
                            <rect x="14" y="4" width="7" height="4" />
                            <rect x="14" y="11" width="7" height="9" />
                            <rect x="3" y="14" width="7" height="6" />
                        </svg>
                        Dashboard
                    </NavLink>


                    <NavLink
                        to="/"
                        onClick={onClose}
                        className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold transition-all duration-200 ${getNavClass(isActive, isDark)}`}
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M3 10.5 12 3l9 7.5" />
                            <path d="M5 9.5V21h14V9.5" />
                        </svg>
                        Página inicial
                    </NavLink>

                    <NavLink
                        to="/agenda"
                        onClick={onClose}
                        className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold transition-all duration-200 ${getNavClass(isActive, isDark)}`}
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M8 2v4M16 2v4M3 10h18" />
                        </svg>
                        Agenda
                    </NavLink>

                    <NavLink
                        to="/aplicativos"
                        onClick={onClose}
                        className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold transition-all duration-200 ${getNavClass(isActive, isDark)}`}
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        Aplicativos
                    </NavLink>

                    <button
                        type="button"
                        onClick={() => setShowConfigMenu((current) => !current)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-left font-semibold transition-all duration-200 ${getNavClass(isConfiguracoesActive, isDark)}`}
                    >
                        <span className="inline-flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                                <path d="M3 12h2m14 0h2M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M18.4 5.6 17 7m-10 10-1.4 1.4" />
                            </svg>
                            Configurações
                        </span>
                        <svg
                            viewBox="0 0 24 24"
                            className={`h-4 w-4 transition-transform ${showConfigMenu ? 'rotate-180' : 'rotate-0'}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>

                    {showConfigMenu && (
                        <div className="ml-2 grid gap-1">
                            <NavLink
                                to="/configuracoes/workspaces"
                                onClick={onClose}
                                className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold transition-all duration-200 ${getNavClass(isActive, isDark)}`}
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <rect x="3" y="4" width="18" height="16" rx="2" />
                                    <path d="M8 2v4M16 2v4M3 10h18" />
                                </svg>
                                Workspaces
                            </NavLink>

                            <button
                                type="button"
                                onClick={() => setShowTasksMenu((current) => !current)}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left font-semibold transition-all duration-200 ${getNavClass(isTarefasActive, isDark)}`}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M9 6h11M9 12h11M9 18h11" />
                                        <path d="M4 6h.01M4 12h.01M4 18h.01" />
                                    </svg>
                                    Tarefas
                                </span>
                                <svg
                                    viewBox="0 0 24 24"
                                    className={`h-4 w-4 transition-transform ${showTasksMenu ? 'rotate-180' : 'rotate-0'}`}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                >
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </button>

                            {showTasksMenu && (
                                <div className="ml-2 grid gap-1">
                                    <NavLink
                                        to="/configuracoes/tarefas/responsaveis"
                                        onClick={onClose}
                                        className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold transition-all duration-200 ${getNavClass(isActive, isDark)}`}
                                    >
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="8.5" cy="7" r="4" />
                                            <path d="M20 8v6M17 11h6" />
                                        </svg>
                                        Cadastrar responsável
                                    </NavLink>

                                    <NavLink
                                        to="/configuracoes/tarefas/locais"
                                        onClick={onClose}
                                        className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold transition-all duration-200 ${getNavClass(isActive, isDark)}`}
                                    >
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
                                            <circle cx="12" cy="10" r="2.5" />
                                        </svg>
                                        Cadastrar local
                                    </NavLink>
                                </div>
                            )}
                        </div>
                    )}
                </nav>
            </aside>
        </>
    )
}
