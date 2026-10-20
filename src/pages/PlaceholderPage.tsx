import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card>
        <p className="text-muted">
          This section is reserved for future modules. Core flows are available
          from the sidebar.
        </p>
      </Card>
    </div>
  )
}
