---
name: tanstack-start-i18n
description: Use when adding internationalization to a TanStack Start app — optional locale URL prefix, react-i18next translations, language switching, HTML lang attribute, and the ($lang) optional-segment pattern with its build workaround.
---

# TanStack Start i18n

## Overview

Implements EN/DE (or any two-locale) routing where DE gets a `/de/` URL prefix and EN has no prefix. Uses `react-i18next` for translations and TanStack Router's optional-segment pattern for locale-aware routes.

---

## Architecture

| Layer | What it does |
|---|---|
| `src/i18n/index.ts` | Initialises i18next with `en` and `de` resource bundles |
| `src/routes/($lang).tsx` | Optional layout route — validates `lang` param, calls `i18n.changeLanguage`, sets `document.documentElement.lang` |
| `src/hooks/useLanguage.ts` | Returns `{ t, locale, langPrefix }` — the single hook every component uses |
| `src/components/language-switcher.component.tsx` | Toggles between EN and DE by prepending/stripping `/de` on the current pathname |

---

## Optional-segment file naming caveat

TanStack Router ≥ v1.166 treats `(something).tsx` files as **route group configs**, which are disallowed. To prevent a build error, the router plugin must be configured to skip these files, and `routeTree.gen.ts` is maintained **manually**.

**vite.config.ts** — required config:

```ts
tanstackStart({
  router: {
    // Skips ($lang).tsx and ($lang)/ directory — prevents route-group error
    routeFileIgnorePrefix: '(',
    // Redirects generator output away from the hand-maintained routeTree.gen.ts
    generatedRouteTree: './src/routeTree.ignored.gen.ts',
  },
})
```

Add `src/routeTree.ignored.gen.ts` to `.gitignore`. The hand-maintained `src/routeTree.gen.ts` is the source of truth.

**Canonical TanStack Router syntax** (v1.166+, if not using the manual-tree workaround) uses `{-$locale}` for optional segments:

```ts
export const Route = createFileRoute('/{-$locale}/about')({...})
```

---

## Core pattern: `useLanguage` hook

```ts
// src/hooks/useLanguage.ts
import { useTranslation } from 'react-i18next'
import { useParams } from '@tanstack/react-router'

export function useLanguage() {
  const { t } = useTranslation()
  // Cast required: TS infers "lang)" (with paren) due to ($lang) file naming
  const { lang } = useParams({ strict: false }) as { lang?: string }
  const locale = lang ?? 'en'
  const langPrefix: '' | '/de' = locale === 'de' ? '/de' : ''
  return { t, locale, langPrefix }
}
```

**Use in every component that links to an in-app route:**

```tsx
function MyComponent() {
  const { t, langPrefix } = useLanguage()
  return (
    <Link to={`${langPrefix}/stories` as any}>
      {t('nav.stories')}
    </Link>
  )
}
```

The `as any` cast is required because TanStack Router's type system cannot resolve
template-literal paths that mix `'' | '/de'` with route param paths.

---

## Optional-segment layout route

```ts
// src/routes/($lang).tsx
export const Route = createFileRoute('/($lang)')({
  beforeLoad: ({ params }) => {
    const lang = (params as { lang?: string }).lang
    if (lang !== undefined && lang !== 'de') {
      throw redirect({ to: '/' as any })   // reject unknown prefixes
    }
    return { locale: lang ?? 'en' }
  },
  component: function LangLayout() {
    const { lang } = Route.useParams() as { lang?: string }
    const locale = lang ?? 'en'
    useEffect(() => {
      i18n.changeLanguage(locale)
      document.documentElement.lang = locale
    }, [locale])
    return <Outlet />
  },
})
```

---

## HTML `lang` attribute (SSR-safe)

Read the lang from router state in `__root.tsx` — avoids mutating the i18n singleton during SSR:

```tsx
function RootDocument({ children }: { children: ReactNode }) {
  const locale = useRouterState({
    select: (state) => {
      const m = state.matches.find((m) => m.routeId === '/($lang)')
      return (m?.params as { lang?: string })?.lang ?? 'en'
    },
  })
  return <html lang={locale} suppressHydrationWarning>...</html>
}
```

---

## Language switcher

```tsx
// src/components/language-switcher.component.tsx
export function LanguageSwitcher() {
  const { locale } = useLanguage()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const toggle = () => {
    if (locale === 'en') {
      navigate({ to: `/de${pathname}` })
    } else {
      navigate({ to: pathname.replace(/^\/de/, '') || '/' })
    }
  }

  return (
    <button onClick={toggle} className="btn btn-ghost btn-sm btn-square">
      {locale === 'en' ? 'DE' : 'EN'}
    </button>
  )
}
```

---

## Translation files

```
src/i18n/
  en.json          # English strings
  de.json          # German strings
  index.ts         # i18next init
  i18next.d.ts     # Type augmentation (TypeScript resources)
```

i18next init:

```ts
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  interpolation: { escapeValue: false },
})
```

TypeScript augmentation for `t()` autocompletion:

```ts
// src/i18n/i18next.d.ts
import en from './en.json'
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof en }
  }
}
```

---

## SEO: hreflang alternate links

In each public route's `head()`:

```ts
head: () => ({
  meta: [
    { tagName: 'link', rel: 'alternate', hreflang: 'en', href: `${BASE_URL}/about` },
    { tagName: 'link', rel: 'alternate', hreflang: 'de', href: `${BASE_URL}/de/about` },
  ],
})
```

---

## Common mistakes

| Mistake | Fix |
|---|---|
| `to={`${langPrefix}/stories`}` without `as any` | Add `as any` — TS can't resolve mixed-literal template paths |
| `params={{ storyId }}` with `($lang)` ancestry | Interpolate the ID into the path string instead: `to={`${langPrefix}/stories/${storyId}` as any}` |
| `Route.useParams().lang` without a cast | Cast: `(Route.useParams() as { lang?: string }).lang` — TS infers `"lang)"` |
| Mutating `i18n.changeLanguage` in server context | Only call it inside `useEffect` (client-only), as done in `($lang).tsx` |
| Forgetting `as any` on `redirect({ to: '/' })` inside `($lang)` routes | Root path is now under `($lang)` ancestry and requires the cast |
