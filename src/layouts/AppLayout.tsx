import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { AppHeader } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useCatalog } from '../hooks/useCatalog'

type ThemeMode = 'light' | 'dark'

type CatalogContext = {
  entries: Array<{ id: string; name: string; createdAt: string; updatedAt: string }>
  loading: boolean
  errorMessage: string | null
  addItem: (name: string) => Promise<void>
  updateItem: (id: string, name: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

export type LayoutOutletContext = {
  responsaveis: string[]
  locais: string[]
  theme: ThemeMode
  responsaveisCatalog: CatalogContext
  locaisCatalog: CatalogContext
}

type AppLayoutProps = {
  theme: ThemeMode
  onToggleTheme: () => void
}

export function AppLayout({ theme, onToggleTheme }: AppLayoutProps) {
  const { user, signOutUser } = useAuth()
  const responsaveisHook = useCatalog('responsaveis')
  const locaisHook = useCatalog('locais')

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isDark = theme === 'dark'

  const handleSignOut = async () => {
    await signOutUser()
    toast.success('Voce saiu da sua conta.')
  }

  const outletContext: LayoutOutletContext = {
    responsaveis: responsaveisHook.items,
    locais: locaisHook.items,
    theme,
    responsaveisCatalog: {
      entries: responsaveisHook.entries,
      loading: responsaveisHook.loading,
      errorMessage: responsaveisHook.errorMessage,
      addItem: responsaveisHook.addItem,
      updateItem: responsaveisHook.updateItem,
      deleteItem: responsaveisHook.deleteItem,
    },
    locaisCatalog: {
      entries: locaisHook.entries,
      loading: locaisHook.loading,
      errorMessage: locaisHook.errorMessage,
      addItem: locaisHook.addItem,
      updateItem: locaisHook.updateItem,
      deleteItem: locaisHook.deleteItem,
    },
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#181818] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar
        theme={theme}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={`min-w-0 transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-[280px]'}`}>
        <AppHeader
          theme={theme}
          userEmail={user?.email}
          onOpenSidebar={() => setSidebarOpen(true)}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={() => setSidebarCollapsed((current) => !current)}
          onToggleTheme={onToggleTheme}
          onSignOut={() => void handleSignOut()}
        />

        <Outlet context={outletContext} />
      </div>
    </div>
  )
}
