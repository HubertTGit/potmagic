import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Clapperboard, Drama } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/hooks/useLanguage";
import type { SubscriptionType } from "@/db/schema";

export function NavbarUserMenu() {
  const { data: session } = authClient.useSession();
  const { t, langPrefix } = useLanguage();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage = pathname === "/auth" || pathname === "/de/auth";

  const handleLogout = async () => {
    await authClient.signOut();
    router.navigate({ to: `${langPrefix}/` as any });
  };

  if (session) {
    const sub = session.user.subscription as SubscriptionType;
    const showBadge = sub === "pro" || sub === "advance";
    const showUpgrade = sub === "standard" || sub === "pro";

    return (
      <div className="dropdown dropdown-click dropdown-start flex flex-col">
        <div className="indicator">
          {showBadge && (
            <span className="indicator-item badge badge-accent badge-xs capitalize">
              {sub}
            </span>
          )}
          <button
            tabIndex={0}
            className={cn(
              "btn btn-sm font-display gap-2 px-4 tracking-wide",
              session.user.role === "director"
                ? "btn-primary"
                : "btn-secondary",
              sub === "advance" &&
                "ring-primary ring-offset-base-100 ring-2 ring-offset-2",
            )}
          >
            {session.user.role === "director" ? (
              <Clapperboard className="size-4" />
            ) : (
              <Drama className="size-4" />
            )}
            <span>
              {t("nav.welcome", {
                name: session.user.name || session.user.email.split("@")[0],
              })}
            </span>
          </button>
        </div>
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
          {showUpgrade && (
            <li>
              <Link
                to={`${langPrefix}/profile` as any}
                className="btn btn-accent btn-xs font-display my-1 w-full justify-center tracking-wide"
              >
                {t("profile.upgrade")}
              </Link>
            </li>
          )}
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
    );
  }

  return (
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
  );
}
