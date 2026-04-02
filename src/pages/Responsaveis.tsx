import { useOutletContext } from 'react-router-dom'
import { CatalogCrudPage } from '../components/CatalogCrudPage'
import type { LayoutOutletContext } from '../layouts/AppLayout'

export function ResponsaveisPage() {
  const { responsaveisCatalog, theme } = useOutletContext<LayoutOutletContext>()

  return (
    <CatalogCrudPage
      title="Responsáveis"
      description="Cadastre, pesquise, edite e exclua os responsaveis usados no formulario de tarefas."
      placeholder="Novo responsavel"
      entries={responsaveisCatalog.entries}
      loading={responsaveisCatalog.loading}
      errorMessage={responsaveisCatalog.errorMessage}
      onAdd={responsaveisCatalog.addItem}
      onUpdate={responsaveisCatalog.updateItem}
      onDelete={responsaveisCatalog.deleteItem}
      theme={theme}
    />
  )
}
