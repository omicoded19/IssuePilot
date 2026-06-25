import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'

export function NotFoundPage() {
  return (
    <main className="dot-grid flex min-h-screen items-center justify-center p-6">
      <section className="glass-card w-full max-w-xl">
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="This IssuePilot route does not exist or is no longer available."
          action={
            <Link
              to="/"
              className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Return home
            </Link>
          }
        />
      </section>
    </main>
  )
}
