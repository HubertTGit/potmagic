import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center px-4 text-center gap-8">
      <Link to={'/' as any} className="transition-opacity hover:opacity-70">
        <img src="/icon-red.svg" alt="potmagic" className="h-10 dark:hidden" />
        <img src="/icon-white.svg" alt="potmagic" className="h-10 hidden dark:block" />
      </Link>

      <div className="flex flex-col gap-3">
        <p className="font-display text-8xl font-bold text-base-content/10 leading-none">404</p>
        <h1 className="font-display text-2xl font-semibold text-base-content">
          Page not found
        </h1>
        <p className="text-base-content/50 text-sm max-w-xs">
          The curtain has fallen on this URL. Let's get you back to the stage.
        </p>
      </div>

      <Link to={'/' as any} className="btn btn-accent btn-sm px-6">
        Return to Home
      </Link>
    </div>
  )
}
