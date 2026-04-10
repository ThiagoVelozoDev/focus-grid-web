import { useOutletContext } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import type { LayoutOutletContext } from '../layouts/AppLayout'

export function HomePage() {
  const { responsaveis, locais, theme, activeWorkspaceId, activeWorkspace } = useOutletContext<LayoutOutletContext>()

  return (
    <Dashboard
      responsaveis={responsaveis}
      locais={locais}
      theme={theme}
      activeWorkspaceId={activeWorkspaceId}
      activeWorkspace={activeWorkspace}
    />
  )
}
