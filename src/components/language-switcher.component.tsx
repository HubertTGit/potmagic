import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useLanguage } from '@/hooks/useLanguage'

/**
 * Toggles between EN (no prefix) and DE (/de/ prefix).
 * Button shows the TARGET language — matching sun/moon theme toggle convention.
 * Only used in navbar and sidebar — never rendered on show/ routes.
 */
export function LanguageSwitcher() {
  const { locale } = useLanguage()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const toggle = () => {
    if (locale === 'en') {
      navigate({ to: `/de${pathname}` })
    } else {
      const stripped = pathname.replace(/^\/de/, '') || '/'
      navigate({ to: stripped })
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost btn-sm btn-square font-display text-xs tracking-wider"
      aria-label="Switch language"
    >
      {locale === 'en' ? 'DE' : 'EN'}
    </button>
  )
}
