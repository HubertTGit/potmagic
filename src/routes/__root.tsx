import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router';
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import type { ReactNode } from 'react';
import appCss from '@/index.css?url';
import { toast } from '@/lib/toast';
import { Toaster } from '@/components/toaster.component';
import { NotFound } from '@/components/not-found.component';

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => toast.error(errorMessage(error)),
  }),
  mutationCache: new MutationCache({
    onError: (error) => toast.error(errorMessage(error)),
  }),
});


export const Route = createRootRoute({
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { property: 'og:site_name', content: 'potmagic' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: 'https://potmagic.live/potmagic-logo.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: 'https://potmagic.live/potmagic-logo.png' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
    scripts: [
      {
        children: `document.documentElement.setAttribute('data-theme',
          localStorage.getItem('theme') || 'potmagic-light');`,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootDocument({ children }: { children: ReactNode }) {
  const locale = useRouterState({
    select: (state) => {
      const langMatch = state.matches.find((m) => m.routeId === '/($lang)')
      return (langMatch?.params as { lang?: string })?.lang ?? 'en'
    },
  })

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
