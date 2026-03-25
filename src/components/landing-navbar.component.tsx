import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Sun, Moon, Menu, Clapperboard, Drama } from "lucide-react";
import { useTheme, Theme } from "@/hooks/useTheme";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "@/components/language-switcher.component";
import { useLanguage } from "@/hooks/useLanguage";

const navLinkClass =
  "decoration-primary hover:text-primary [&.active]:text-primary text-sm font-medium underline-offset-4 hover:underline hover:decoration-2 [&.active]:underline [&.active]:decoration-2";

export function LandingNavbar() {
  const { theme, toggle } = useTheme();
  const { data: session } = authClient.useSession();
  const { t, langPrefix } = useLanguage();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage = pathname === "/auth" || pathname === "/de/auth";

  const handleLogout = async () => {
    await authClient.signOut();
    router.navigate({ to: `${langPrefix}/` as any });
  };

  return (
    <nav className="navbar bg-base-100 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center">
        {/* Logo */}
        <div className="navbar-start">
          <div className="relative inline-flex">
            <Link
              to={`${langPrefix}/` as any}
              className="flex items-center gap-2"
            >
              <img
                src={
                  theme === Theme.dark ? "/logo-white.svg" : "/logo-color.svg"
                }
                alt="potmagic"
                className="hidden h-7 md:block"
              />
              <img
                src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
                alt="potmagic"
                className="h-7 md:hidden"
              />
            </Link>
            {import.meta.env.VITE_UNDER_CONSTRUCTION === "true" && (
              <span className="badge badge-xs border-error/30 bg-warning/10 text-error/80 absolute -top-2 -right-2 translate-x-full tracking-wide uppercase">
                {t("ui.previewOnly")}
              </span>
            )}
          </div>
        </div>

        <div className="navbar-end flex items-center gap-5">
          {/* Desktop nav links */}
          <div className="hidden items-center gap-5 md:flex">
            <Link to={`${langPrefix}/pricing` as any} className={navLinkClass}>
              {t("nav.pricing")}
            </Link>
            <Link to={`${langPrefix}/concept` as any} className={navLinkClass}>
              {t("nav.concept")}
            </Link>
            <div className="dropdown dropdown-click dropdown-start flex flex-col">
              <Link
                tabIndex={0}
                to={`${langPrefix}/docs` as any}
                activeOptions={{ exact: false }}
                className={navLinkClass}
              >
                {t("nav.docs")}
              </Link>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 border-base-300 top-5 z-50 mt-2 w-48 rounded-xl border p-1.5 shadow-lg before:absolute before:-top-2 before:right-0 before:left-0 before:h-2 before:content-['']"
              >
                <li>
                  <Link
                    to={`${langPrefix}/docs` as any}
                    activeOptions={{ exact: true }}
                    className="[&.active]:text-primary text-sm [&.active]:font-medium"
                  >
                    {t("nav.overview")}
                  </Link>
                </li>
                <li>
                  <Link
                    to={`${langPrefix}/docs/create-story` as any}
                    className="[&.active]:text-primary text-sm [&.active]:font-medium"
                  >
                    {t("nav.createStory")}
                  </Link>
                </li>
                <li>
                  <Link
                    to={`${langPrefix}/docs/add-scenes` as any}
                    className="[&.active]:text-primary text-sm [&.active]:font-medium"
                  >
                    {t("nav.addScenes")}
                  </Link>
                </li>
                <li>
                  <Link
                    to={`${langPrefix}/docs/props` as any}
                    className="[&.active]:text-primary text-sm [&.active]:font-medium"
                  >
                    {t("nav.propsLibrary")}
                  </Link>
                </li>
                <li>
                  <Link
                    to={`${langPrefix}/docs/size-guidelines` as any}
                    className="[&.active]:text-primary text-sm [&.active]:font-medium"
                  >
                    {t("nav.sizeGuidelines")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden gap-2 md:flex">
            {session ? (
              <div className="dropdown dropdown-click dropdown-start flex flex-col">
                <button
                  tabIndex={0}
                  className={cn(
                    "btn btn-sm font-display gap-2 px-4 tracking-wide",
                    session.user.role === "director"
                      ? "btn-primary"
                      : "btn-secondary",
                  )}
                >
                  {session.user.role === "director" ? (
                    <Clapperboard className="size-4" />
                  ) : (
                    <Drama className="size-4" />
                  )}
                  <span>
                    {t("nav.welcome", {
                      name:
                        session.user.name || session.user.email.split("@")[0],
                    })}
                  </span>
                </button>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 border-base-300 top-7 z-50 mt-2 w-48 rounded-xl border p-1.5 shadow-lg before:absolute before:-top-2 before:right-0 before:left-0 before:h-2 before:content-['']"
                >
                  <li>
                    <Link to={`${langPrefix}/stories` as any} className="py-2">
                      {t("nav.goToStage")}
                    </Link>
                  </li>
                  <li>
                    <Link to={`${langPrefix}/profile` as any} className="py-2">
                      {t("nav.profile")}
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="text-error hover:bg-error/10 py-2"
                    >
                      {t("ui.logout")}
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link
                to={`${langPrefix}/auth` as any}
                search={{ token: undefined } as any}
                className={cn(
                  "btn btn-primary btn-sm font-display px-5 tracking-wide",
                  isAuthPage && "btn-active",
                )}
              >
                {t("nav.joinTheatre")}
              </Link>
            )}
            <Link
              to={`${langPrefix}/show` as any}
              className="btn btn-accent btn-sm font-display px-5 tracking-wide"
            >
              {t("nav.watchLive")}
            </Link>
            <LanguageSwitcher />
            {/* Theme toggle — always visible */}
            <button
              type="button"
              onClick={toggle}
              className="btn btn-ghost btn-sm btn-square"
              aria-label={t("ui.toggleTheme")}
            >
              {theme === Theme.dark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          </div>

          {/* Mobile burger */}
          <div className="dropdown dropdown-end md:hidden">
            <button
              tabIndex={0}
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              aria-label={t("ui.openMenu")}
            >
              <Menu className="size-5" />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 border-base-300 z-50 mt-2 w-56 rounded-xl border p-2 shadow-lg"
            >
              <li>
                <Link
                  to={`${langPrefix}/pricing` as any}
                  className="[&.active]:text-primary text-sm"
                >
                  {t("nav.pricing")}
                </Link>
              </li>
              <li>
                <Link
                  to={`${langPrefix}/concept` as any}
                  className="[&.active]:text-primary text-sm"
                >
                  {t("nav.concept")}
                </Link>
              </li>
              <li>
                <Link
                  to={`${langPrefix}/docs` as any}
                  activeOptions={{ exact: false }}
                  className="[&.active]:text-primary text-sm"
                >
                  {t("nav.docs")}
                </Link>
              </li>
              {session ? (
                <>
                  <li className="menu-title mt-1 text-xs">
                    {t("nav.welcome", {
                      name:
                        session.user.name || session.user.email.split("@")[0],
                    })}
                  </li>
                  <li>
                    <Link
                      to={`${langPrefix}/stories` as any}
                      className="btn btn-sm font-display justify-start tracking-wide"
                    >
                      {t("nav.goToStage")}
                    </Link>
                  </li>
                  <li className="mt-1">
                    <Link
                      to={`${langPrefix}/profile` as any}
                      className="btn btn-sm font-display justify-start tracking-wide"
                    >
                      {t("nav.profile")}
                    </Link>
                  </li>
                  <li className="mt-1">
                    <button
                      onClick={handleLogout}
                      className="btn btn-sm btn-error btn-outline font-display justify-start tracking-wide"
                    >
                      {t("ui.logout")}
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="menu-title mt-1 text-xs">
                    {t("nav.account")}
                  </li>
                  <li>
                    <Link
                      to={`${langPrefix}/auth` as any}
                      search={{ token: undefined } as any}
                      className={cn(
                        "btn btn-primary btn-sm font-display tracking-wide",
                        isAuthPage && "btn-active",
                      )}
                    >
                      {t("nav.joinTheatre")}
                    </Link>
                  </li>
                </>
              )}
              <li className="mt-1">
                <Link
                  to={`${langPrefix}/show` as any}
                  className="btn btn-accent btn-sm font-display tracking-wide"
                >
                  {t("nav.watchLive")}
                </Link>
              </li>
              <li className="mt-1 flex justify-between px-2">
                <LanguageSwitcher />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
