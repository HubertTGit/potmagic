import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
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

function NotFound() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center px-4 text-center gap-8">
      <Link to="/" className="transition-opacity hover:opacity-70">
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

      <Link to="/" className="btn btn-accent btn-sm px-6">
        Return to Home
      </Link>
    </div>
  );
}

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'potmagic' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
    scripts: [
      {
        children: `document.documentElement.setAttribute('data-theme',
          localStorage.getItem('theme') || 'potmagic-dark');`,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
