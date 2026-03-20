import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, Moon, Menu } from "lucide-react";
import { useTheme, Theme } from "@/hooks/useTheme";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

const navLinkClass =
  "decoration-primary hover:text-primary [&.active]:text-primary text-sm font-medium underline-offset-4 hover:underline hover:decoration-2 [&.active]:underline [&.active]:decoration-2";

export function LandingNavbar() {
  const { theme, toggle } = useTheme();
  const { data: session } = authClient.useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage = pathname === "/auth";

  return (
    <div className="navbar bg-base-100 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center">
        {/* Logo */}
        <div className="navbar-start">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={theme === Theme.dark ? "/logo-white.svg" : "/logo-color.svg"}
              alt="potmagic"
              className="hidden h-7 md:block"
            />
            <img
              src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
              alt="potmagic"
              className="h-7 md:hidden"
            />
          </Link>
        </div>

        <div className="navbar-end flex items-center gap-2">
          {/* Desktop nav links */}
          <div className="hidden items-center gap-5 md:flex">
            <Link to="/pricing" className={navLinkClass}>
              Pricing
            </Link>
            <Link to="/concept" className={navLinkClass}>
              Concept
            </Link>
            <div className="dropdown dropdown-hover flex flex-col">
              <Link
                tabIndex={0}
                to="/docs"
                activeOptions={{ exact: false }}
                className={navLinkClass}
              >
                Docs
              </Link>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 border-base-300 top-5 z-50 mt-2 w-48 rounded-xl border p-1.5 shadow-lg before:absolute before:-top-2 before:right-0 before:left-0 before:h-2 before:content-['']"
              >
                <li>
                  <Link
                    to="/docs"
                    activeOptions={{ exact: true }}
                    className="[&.active]:text-primary text-sm [&.active]:font-medium"
                  >
                    Overview
                  </Link>
                </li>
                <li>
                  <Link
                    to="/docs/create-story"
                    className="[&.active]:text-primary text-sm [&.active]:font-medium"
                  >
                    Create a Story
                  </Link>
                </li>
                <li>
                  <Link
                    to="/docs/add-scenes"
                    className="[&.active]:text-primary text-sm [&.active]:font-medium"
                  >
                    Add Scenes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/docs/props"
                    className="[&.active]:text-primary text-sm [&.active]:font-medium"
                  >
                    Props Library
                  </Link>
                </li>
                <li>
                  <Link
                    to="/docs/size-guidelines"
                    className="[&.active]:text-primary text-sm [&.active]:font-medium"
                  >
                    Size Guidelines
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden gap-2 md:flex">
            <Link
              to="/auth"
              search={{ token: undefined }}
              className={cn(
                "btn btn-primary btn-sm font-display px-5 tracking-wide",
                isAuthPage && "btn-active",
              )}
            >
              {session ? "Start Curating" : "Join Theatre"}
            </Link>
            <Link
              to="/show"
              className="btn btn-accent btn-sm font-display px-5 tracking-wide"
            >
              Watch Live
            </Link>
          </div>

          {/* Theme toggle — always visible */}
          <button
            type="button"
            onClick={toggle}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Toggle theme"
          >
            {theme === Theme.dark ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>

          {/* Mobile burger */}
          <div className="dropdown dropdown-end md:hidden">
            <button
              tabIndex={0}
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 border-base-300 z-50 mt-2 w-56 rounded-xl border p-2 shadow-lg"
            >
              <li>
                <Link to="/pricing" className="[&.active]:text-primary text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/concept" className="[&.active]:text-primary text-sm">
                  Concept
                </Link>
              </li>
              <li>
                <Link
                  to="/docs"
                  activeOptions={{ exact: false }}
                  className="[&.active]:text-primary text-sm"
                >
                  Docs
                </Link>
              </li>
              <li className="menu-title mt-1 text-xs">Account</li>
              <li>
                <Link
                  to="/auth"
                  search={{ token: undefined }}
                  className={cn(
                    "btn btn-primary btn-sm font-display tracking-wide",
                    isAuthPage && "btn-active",
                  )}
                >
                  {session ? "Start Curating" : "Join Theatre"}
                </Link>
              </li>
              <li className="mt-1">
                <Link
                  to="/show"
                  className="btn btn-accent btn-sm font-display tracking-wide"
                >
                  Watch Live
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
