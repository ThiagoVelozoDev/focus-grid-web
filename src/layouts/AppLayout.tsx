import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { AppHeader } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useCatalog, type CatalogItem } from '../hooks/useCatalog'
import { useApps, type App, type AppFormData } from '../hooks/useApps'
import { useLabels, type Label } from '../hooks/useLabels'
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
  reorderApps: (appIds: string[]) => Promise<void>
}

type LabelsContext = {
  labels: Label[]
  loading: boolean
  errorMessage: string | null
  addLabel: (name: string) => Promise<void>
  updateLabel: (id: string, name: string) => Promise<void>
  deleteLabel: (id: string) => Promise<void>
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
  labelsCatalog: LabelsContext
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
  const labelsHook = useLabels(workspacesHook.activeWorkspaceId)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isDark = theme === 'dark'

  // Ref para ler labels sem incluí-las na dep array (evita loop infinito no sync)
  const labelsRef = useRef(labelsHook.labels)
  labelsRef.current = labelsHook.labels

  // Sync automático: cria/atualiza/remove etiquetas conforme os apps cadastrados
  useEffect(() => {
    if (appsHook.loading || labelsHook.loading) return

    const apps = appsHook.apps
    const labels = labelsRef.current

    const run = async () => {
      for (const app of apps) {
        const existing = labels.find((l) => l.sourceAppId === app.id)
        if (!existing) {
          await labelsHook.addAppLabel(app.id, app.name)
        } else if (existing.name !== app.name) {
          await labelsHook.updateLabel(existing.id, app.name)
        }
      }
      for (const label of labels) {
        if (label.sourceAppId && !apps.find((a) => a.id === label.sourceAppId)) {
          await labelsHook.deleteLabel(label.id)
        }
      }
    }

    void run()
    // Reage apenas a mudanças nos apps; lê labels via ref para não criar loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appsHook.apps, appsHook.loading, labelsHook.loading])

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
      reorderApps: appsHook.reorderApps,
    },
    labelsCatalog: {
      labels: labelsHook.labels,
      loading: labelsHook.loading,
      errorMessage: labelsHook.errorMessage,
      addLabel: labelsHook.addLabel,
      updateLabel: labelsHook.updateLabel,
      deleteLabel: labelsHook.deleteLabel,
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
