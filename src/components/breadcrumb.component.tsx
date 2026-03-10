import { Link } from '@tanstack/react-router'

interface Crumb {
  label: string
  to?: string
  params?: Record<string, string>
}

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-6">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-base-content/25">/</span>}
            {isLast || !crumb.to ? (
              <span className={isLast ? 'text-base-content/60' : 'text-base-content/40'}>
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.to}
                params={crumb.params}
                className="text-base-content/40 hover:text-gold transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
