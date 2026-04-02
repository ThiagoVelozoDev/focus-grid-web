import { useOutletContext } from 'react-router-dom'
import { CatalogCrudPage } from '../components/CatalogCrudPage'
import type { LayoutOutletContext } from '../layouts/AppLayout'

export function LocaisPage() {
  const { locaisCatalog, theme } = useOutletContext<LayoutOutletContext>()

  return (
    <CatalogCrudPage
      title="Locais"
      description="Cadastre, pesquise, edite e exclua os locais usados no formulario de tarefas."
      placeholder="Novo local"
      entries={locaisCatalog.entries}
      loading={locaisCatalog.loading}
      errorMessage={locaisCatalog.errorMessage}
      onAdd={locaisCatalog.addItem}
      onUpdate={locaisCatalog.updateItem}
      onDelete={locaisCatalog.deleteItem}
      theme={theme}
    />
  )
}
