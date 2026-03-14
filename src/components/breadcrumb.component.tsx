import { Link } from '@tanstack/react-router';
import { RectangleStackIcon, FilmIcon } from '@heroicons/react/24/outline';

interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="breadcrumbs text-sm mb-6 text-base-content/60">
      <ul>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i}>
              {crumb.to && !isLast ? (
                <Link
                  to={crumb.to}
                  params={crumb.params}
                  className="hover:text-gold transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
