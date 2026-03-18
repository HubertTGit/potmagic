import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, Moon } from "lucide-react";
import { useTheme, Theme } from "@/hooks/useTheme";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

export function LandingNavbar() {
  const { theme, toggle } = useTheme();
  const { data: session } = authClient.useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage = pathname === "/auth";

  return (
    <div className="navbar bg-base-100 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center px-12">
        <div className="navbar-start">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={theme === Theme.dark ? "logo-white.svg" : "logo-color.svg"}
              alt="potmagic"
              className="h-7"
            />
          </Link>
        </div>
        <div className="navbar-end flex items-center gap-1">
          <Link
            to="/pricing"
            className="btn btn-ghost btn-sm decoration-primary hover:text-primary [&.active]:text-primary underline-offset-4 hover:underline [&.active]:underline [&.active]:decoration-2"
          >
            Pricing
          </Link>
          <Link
            to="/concept"
            className="btn btn-ghost btn-sm decoration-primary hover:text-primary [&.active]:text-primary underline-offset-4 hover:underline [&.active]:underline [&.active]:decoration-2"
          >
            Concept
          </Link>
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
            className="btn btn-sm btn-accent font-display px-5 tracking-wide"
          >
            Watch Live
          </Link>
          <button
            type="button"
            onClick={toggle}
            className="btn btn-sm btn-ghost btn-square"
            aria-label="Toggle theme"
          >
            {theme === Theme.dark ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
