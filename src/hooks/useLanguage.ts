import { useTranslation } from 'react-i18next'
import { useParams } from '@tanstack/react-router'

export function useLanguage() {
  const { t } = useTranslation()
  // TanStack Router infers param name as "lang)" (TS bug with optional ($lang) segments)
  const { lang } = useParams({ strict: false }) as { lang?: string }
  const locale = lang ?? 'en'
  const langPrefix: '' | '/de' = locale === 'de' ? '/de' : ''

  return { t, locale, langPrefix }
}
