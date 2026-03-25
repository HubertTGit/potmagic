import en from '@/i18n/en.json'
import de from '@/i18n/de.json'

const translations = { en, de } as const

export function getMeta(locale: string, key: keyof typeof en): string {
  const lang = locale === 'de' ? 'de' : 'en'
  const dict = translations[lang] as Record<string, string>
  return dict[key] ?? (translations.en as Record<string, string>)[key] ?? key
}
