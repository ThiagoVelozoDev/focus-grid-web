import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicOnly, RequireAuth } from '../middleware/AuthGuard'
import { AppLayout } from '../layouts/AppLayout'
import { DashboardReportPage } from '../pages/DashboardReport'
import { AgendaPage } from '../pages/Agenda'
import { HomePage } from '../pages/Home'
import { LoginPage } from '../pages/Login'
import { LocaisPage } from '../pages/Locais'
import { ResponsaveisPage } from '../pages/Responsaveis'
import { WorkspacesPage } from '../pages/Workspaces'
import { TaskEditorPage } from '../pages/TaskEditor'
import { TaskDetailsPage } from '../pages/TaskDetails'
import { AplicativosPage } from '../pages/Aplicativos'
import { AplicativoTarefasPage } from '../pages/AplicativoTarefas'
import { EtiquetasPage } from '../pages/Etiquetas'

type ThemeMode = 'light' | 'dark'

type AppRoutesProps = {
  theme: ThemeMode
  onToggleTheme: () => void
}

export function AppRoutes({ theme, onToggleTheme }: AppRoutesProps) {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/" element={<AppLayout theme={theme} onToggleTheme={onToggleTheme} />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardReportPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="tarefas/nova" element={<TaskEditorPage />} />
          <Route path="tarefas/:taskId" element={<TaskDetailsPage />} />
          <Route path="tarefas/:taskId/editar" element={<TaskEditorPage />} />
          <Route path="configuracoes/workspaces" element={<WorkspacesPage />} />
          <Route path="configuracoes/tarefas/responsaveis" element={<ResponsaveisPage />} />
          <Route path="configuracoes/tarefas/locais" element={<LocaisPage />} />
          <Route path="configuracoes/tarefas/etiquetas" element={<EtiquetasPage />} />
          <Route path="aplicativos" element={<AplicativosPage />} />
          <Route path="aplicativos/:appId/tarefas" element={<AplicativoTarefasPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
