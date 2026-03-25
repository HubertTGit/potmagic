import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import i18n from '@/i18n'

export const Route = createFileRoute('/($lang)')({
  beforeLoad: ({ params }) => {
    // TanStack Router TypeScript infers param as "lang)" due to ($lang) syntax — cast required
    const lang = (params as { lang?: string }).lang
    // undefined = English (no prefix), 'de' = German
    // Any other value is invalid — redirect to home
    if (lang !== undefined && lang !== 'de') {
      throw redirect({ to: '/' as any })
    }
    return { locale: lang ?? 'en' }
  },
  component: function LangLayout() {
    const { lang } = Route.useParams() as { lang?: string }
    const locale = lang ?? 'en'

    useEffect(() => {
      // client-only: avoids SSR singleton mutation on concurrent requests
      i18n.changeLanguage(locale)
      document.documentElement.lang = locale
    }, [locale])

    return <Outlet />
  },
})
