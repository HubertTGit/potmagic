import {
  createFileRoute,
  Link,
  Navigate,
  Outlet,
} from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { BookOpen, FilePlus, Layers, Library, Ruler } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const BASE_URL = "https://potmagic.com";

export const Route = createFileRoute("/($lang)/docs")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return {
      meta: [
        { title: "Docs — potmagic: Live Story Theater" },
      ],
      links: [
        { rel: "alternate", hrefLang: "en", href: `${BASE_URL}/docs` },
        { rel: "alternate", hrefLang: "de", href: `${BASE_URL}/de/docs` },
      ],
    };
  },
  component: DocsLayout,
  notFoundComponent: () => <Navigate to={'/docs' as any} />,
});

function DocsLayout() {
  const { t, langPrefix } = useLanguage();

  const navItems = [
    { to: `${langPrefix}/docs`, label: t('nav.overview'), icon: BookOpen, exact: true },
    { to: `${langPrefix}/docs/create-story`, label: t('nav.createStory'), icon: FilePlus, exact: false },
    { to: `${langPrefix}/docs/add-scenes`, label: t('nav.addScenes'), icon: Layers, exact: false },
    { to: `${langPrefix}/docs/props`, label: t('nav.propsLibrary'), icon: Library, exact: false },
    { to: `${langPrefix}/docs/size-guidelines`, label: t('nav.sizeGuidelines'), icon: Ruler, exact: false },
  ];

  return (
    <div className="bg-base-200 text-base-content flex min-h-screen flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="flex gap-10">
            {/* Main content */}
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>

            {/* Vertical separator */}
            <div className="border-base-300 self-stretch border-l" />

            {/* Sidebar */}
            <aside className="w-48 shrink-0">
              <p className="text-base-content/40 mb-3 text-[11px] font-semibold tracking-widest uppercase">
                Documentation
              </p>
              <nav className="flex flex-col gap-0.5">
                {navItems.map(({ to, label, icon: Icon, exact }) => (
                  <Link
                    key={to}
                    to={to as any}
                    activeOptions={{ exact }}
                    className="text-base-content/60 hover:bg-base-300 hover:text-base-content [&.active]:bg-primary/10 [&.active]:text-primary flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors [&.active]:font-medium"
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
