import { Link } from '@tanstack/react-router';
import { Layers, Film, Layers3 } from 'lucide-react';

interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
  type?: 'story' | 'scene';
}

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="breadcrumbs text-sm mb-6 text-base-content/60">
      <ul>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i}>
              <div className="flex items-center gap-2">
                {crumb.type === 'story' && (
                  <Layers3 className="w-4 h-4" />
                )}
                {crumb.type === 'scene' && <Film className="w-4 h-4" />}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    params={crumb.params}
                    className="hover:text-primary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
