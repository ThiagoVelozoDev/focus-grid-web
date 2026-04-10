export type WorkspaceKind = 'work' | 'personal'

export type Workspace = {
  id: string
  name: string
  kind: WorkspaceKind
  createdAt: string
  updatedAt: string
}
