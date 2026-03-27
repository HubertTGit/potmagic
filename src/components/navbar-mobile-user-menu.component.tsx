import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/hooks/useLanguage";
import type { SubscriptionType } from "@/db/schema";

export function NavbarMobileUserMenu() {
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
    const subBadgeClass: Record<SubscriptionType, string | null> = {
      standard: null,
      pro: "badge-accent",
      advance: "badge-success",
    };

    return (
      <>
        <li className="menu-title mt-1 flex items-center gap-1.5 text-xs">
          {t("nav.welcome", {
            name: session.user.name || session.user.email.split("@")[0],
          })}
          {subBadgeClass[sub] && (
            <span className={cn("badge badge-xs capitalize", subBadgeClass[sub])}>
              {sub}
            </span>
          )}
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
    );
  }

  return (
    <>
      <li className="menu-title mt-1 text-xs">{t("nav.account")}</li>
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
  );
}
