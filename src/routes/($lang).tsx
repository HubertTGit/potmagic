import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import i18n from '@/i18n'
import { NotFound } from '@/components/not-found.component'

export const Route = createFileRoute('/($lang)')({
  notFoundComponent: NotFound,
  beforeLoad: ({ params }) => {
    // TanStack Router TypeScript infers param as "lang)" due to ($lang) syntax — cast required
    const lang = (params as { lang?: string }).lang
    // undefined = English (no prefix), 'de' = German
    // Any other segment means the URL is unknown — show 404
    if (lang !== undefined && lang !== 'de') {
      throw notFound()
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
