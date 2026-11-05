import { Link } from '@tanstack/react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SiteListItem } from '@/features/sites/api'
import { pluralize } from '@/lib/format'

const taskForms = { one: 'задача', few: 'задачи', many: 'задач' }

export function SiteList({ sites }: { sites: SiteListItem[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => (
        <li key={site.id}>
          <Link
            to="/sites/$siteId"
            params={{ siteId: site.id }}
            className="block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-colors hover:border-ring/60">
              <CardHeader>
                <CardTitle>{site.name}</CardTitle>
                <CardDescription>{site.address}</CardDescription>
                <CardDescription className="pt-2 text-foreground">
                  {pluralize(site.taskCount, taskForms)}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  )
}
