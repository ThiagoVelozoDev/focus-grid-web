import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { AppHeader } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useCatalog, type CatalogItem } from '../hooks/useCatalog'
import { useApps, type App, type AppFormData } from '../hooks/useApps'
import { useWorkspaces } from '../hooks/useWorkspaces'
import type { Workspace, WorkspaceKind } from '../types/workspace'

type ThemeMode = 'light' | 'dark'

type CatalogContext = {
  entries: CatalogItem[]
  loading: boolean
  errorMessage: string | null
  addItem: (name: string) => Promise<void>
  updateItem: (id: string, name: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

type AppsContext = {
  apps: App[]
  loading: boolean
  errorMessage: string | null
  addApp: (data: AppFormData) => Promise<void>
  updateApp: (id: string, data: AppFormData) => Promise<void>
  deleteApp: (id: string) => Promise<void>
}

export type LayoutOutletContext = {
  responsaveis: string[]
  locais: string[]
  theme: ThemeMode
  workspaces: Workspace[]
  activeWorkspaceId: string
  activeWorkspace: Workspace | null
  setActiveWorkspaceId: (workspaceId: string) => void
  addWorkspace: (name: string, kind: WorkspaceKind) => Promise<void>
  workspacesLoading: boolean
  workspacesErrorMessage: string | null
  responsaveisCatalog: CatalogContext
  locaisCatalog: CatalogContext
  appsCatalog: AppsContext
}

type AppLayoutProps = {
  theme: ThemeMode
  onToggleTheme: () => void
}

export function AppLayout({ theme, onToggleTheme }: AppLayoutProps) {
  const { user, signOutUser } = useAuth()
  const workspacesHook = useWorkspaces()
  const responsaveisHook = useCatalog('responsaveis', workspacesHook.activeWorkspaceId)
  const locaisHook = useCatalog('locais', workspacesHook.activeWorkspaceId)
  const appsHook = useApps(workspacesHook.activeWorkspaceId)

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
    workspaces: workspacesHook.workspaces,
    activeWorkspaceId: workspacesHook.activeWorkspaceId,
    activeWorkspace: workspacesHook.activeWorkspace,
    setActiveWorkspaceId: workspacesHook.setActiveWorkspaceId,
    addWorkspace: workspacesHook.addWorkspace,
    workspacesLoading: workspacesHook.loading,
    workspacesErrorMessage: workspacesHook.errorMessage,
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
    appsCatalog: {
      apps: appsHook.apps,
      loading: appsHook.loading,
      errorMessage: appsHook.errorMessage,
      addApp: appsHook.addApp,
      updateApp: appsHook.updateApp,
      deleteApp: appsHook.deleteApp,
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

      <div className={`min-w-0 transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-70'}`}>
        <AppHeader
          theme={theme}
          userEmail={user?.email}
          workspaces={workspacesHook.workspaces}
          activeWorkspaceId={workspacesHook.activeWorkspaceId}
          onChangeWorkspace={workspacesHook.setActiveWorkspaceId}
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
