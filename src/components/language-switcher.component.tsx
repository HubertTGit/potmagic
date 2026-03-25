import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useLanguage } from '@/hooks/useLanguage'
import { cn } from '@/lib/cn'

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
] as const

/**
 * Dropdown to switch between EN (no prefix) and DE (/de/ prefix).
 * Trigger shows the CURRENT language code.
 * Only used in navbar and sidebar — never rendered on show/ routes.
 */
export function LanguageSwitcher() {
  const { locale } = useLanguage()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const switchTo = (code: 'en' | 'de') => {
    ;(document.activeElement as HTMLElement)?.blur()
    if (code === locale) return
    if (code === 'de') {
      navigate({ to: `/de${pathname}` })
    } else {
      navigate({ to: pathname.replace(/^\/de/, '') || '/' })
    }
  }

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0]

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        tabIndex={0}
        className="btn btn-ghost btn-sm btn-square font-display text-xs tracking-wider"
        aria-label="Switch language"
      >
        {current.short}
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-200 border-base-300 rounded-box z-10 mt-1 w-32 border p-1 shadow-lg"
      >
        {LANGUAGES.map((lang) => (
          <li key={lang.code}>
            <button
              type="button"
              onClick={() => switchTo(lang.code)}
              className={cn(
                'flex items-center justify-between text-xs',
                locale === lang.code && 'font-semibold text-primary',
              )}
            >
              <span>{lang.label}</span>
              <span className="text-base-content/40 font-display tracking-wider">
                {lang.short}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
