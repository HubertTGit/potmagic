import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useTheme, Theme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "@/components/language-switcher.component";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Sun,
  Moon,
  LogOut,
  Layers3,
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from "lucide-react";
import type { SubscriptionType } from "@/db/schema";

export function Sidebar() {
  const { data: session } = authClient.useSession();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const { t, langPrefix } = useLanguage();
  const isDirector = session?.user?.role === "director";
  const location = useRouterState({ select: (s) => s.location.pathname });
  const isStage = location.includes("/stage/");

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isStage) setCollapsed(true);
  }, [isStage]);

  const handleCollapseToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (!isStage) {
      try {
        localStorage.setItem("sidebar-collapsed", String(next));
      } catch {}
    }
  };

  const expandOnDesktop = () => {
    if (collapsed && window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed(false);
      if (!isStage) {
        try {
          localStorage.setItem("sidebar-collapsed", "false");
        } catch {}
      }
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.navigate({ to: `${langPrefix}/auth`, search: { token: "" } });
  };

  const sub = session?.user.subscription as SubscriptionType | undefined;
  const showSubDot = sub === "pro" || sub === "teams";

  const btnBase = cn(
    "btn btn-ghost btn-sm font-normal text-base-content/60",
    collapsed ? "btn-square" : "w-full justify-start gap-3",
  );

  return (
    <aside
      className={cn(
        "bg-base-200 border-base-300 relative flex min-h-full flex-col overflow-visible border-r transition-[width] duration-200 ease-in-out",
        collapsed ? "w-14" : "w-52",
      )}
    >
      {collapsed && (
        <button
          onClick={handleCollapseToggle}
          aria-label={t("ui.expandSidebar")}
          className="btn btn-xs btn-square absolute top-3 left-full z-50"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
      {/* Brand + collapse toggle */}
      <div
        className={cn(
          "border-base-300 flex h-13 items-center border-b",
          collapsed ? "justify-center px-0" : "px-4",
        )}
      >
        {collapsed ? (
          <Link
            to={`${langPrefix}/` as any}
            className="transition-opacity hover:opacity-75"
          >
            <img
              src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
              alt="potmagic"
              className="size-6"
            />
          </Link>
        ) : (
          <Link
            to={`${langPrefix}/` as any}
            className="transition-opacity hover:opacity-75"
          >
            <img
              src={theme === Theme.dark ? "/logo-white.svg" : "/logo-color.svg"}
              alt="potmagic"
              className="h-6"
            />
          </Link>
        )}
        <button
          onClick={handleCollapseToggle}
          aria-label={
            collapsed ? t("ui.expandSidebar") : t("ui.collapseSidebar")
          }
          className={cn(
            "btn btn-ghost btn-xs btn-square",
            collapsed ? "hidden" : "ml-auto",
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        <SidebarLink
          to={`${langPrefix}/stories/`}
          icon={<Layers3 className="size-4" />}
          collapsed={collapsed}
          onExpand={expandOnDesktop}
        >
          {t("nav.stories")}
        </SidebarLink>
        {isDirector && (
          <SidebarLink
            to={`${langPrefix}/director`}
            icon={<Megaphone className="size-4" />}
            collapsed={collapsed}
            onExpand={expandOnDesktop}
          >
            {t("nav.director")}
          </SidebarLink>
        )}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col">
        {/* User identity — links to profile */}
        <Link
          to={`${langPrefix}/profile` as any}
          onClick={expandOnDesktop}
          className={cn(
            "border-base-300 hover:bg-base-300/50 flex items-center gap-3 border-b px-3 py-3 transition-colors",
            collapsed && "tooltip tooltip-right justify-center px-0",
          )}
          data-tip={
            collapsed
              ? (session?.user?.name ??
                session?.user?.email ??
                t("nav.profile"))
              : undefined
          }
        >
          <div className="indicator shrink-0">
            {showSubDot && (
              <span className="indicator-item badge badge-accent badge-xs capitalize">
                {sub}
              </span>
            )}
            <div className="avatar">
              <div
                className={cn(
                  "bg-base-300 size-7 overflow-hidden rounded-full",
                  isDirector &&
                    "ring-primary ring-offset-base-200 ring-2 ring-offset-1",
                )}
              >
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="text-base-content/50 flex size-full items-center justify-center text-xs font-semibold select-none">
                    {(session?.user?.name ||
                      session?.user?.email ||
                      "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm leading-tight font-medium">
                {session?.user?.name ?? session?.user?.email ?? "—"}
              </p>
            </div>
          )}
        </Link>

        <div className="flex flex-col gap-1 p-2">
          <div
            className={cn(collapsed && "tooltip tooltip-right")}
            data-tip={collapsed ? t("ui.switchLanguage") : undefined}
          >
            <LanguageSwitcher />
          </div>

          <div
            className={cn(collapsed && "tooltip tooltip-right")}
            data-tip={
              collapsed
                ? theme === Theme.dark
                  ? t("ui.lightMode")
                  : t("ui.darkMode")
                : undefined
            }
          >
            <button onClick={toggle} className={btnBase}>
              {theme === Theme.dark ? (
                <Sun className="size-4 shrink-0" />
              ) : (
                <Moon className="size-4 shrink-0" />
              )}
              {!collapsed &&
                (theme === Theme.dark ? t("ui.lightMode") : t("ui.darkMode"))}
            </button>
          </div>

          {session && (
            <div
              className={cn(collapsed && "tooltip tooltip-right")}
              data-tip={collapsed ? t("ui.logout") : undefined}
            >
              <button
                onClick={handleLogout}
                className={cn(btnBase, "hover:btn-error hover:text-white")}
              >
                <LogOut className="size-4 shrink-0" />
                {!collapsed && t("ui.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  to,
  icon,
  collapsed,
  onExpand,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  collapsed: boolean;
  onExpand?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(collapsed && "tooltip tooltip-right")}
      data-tip={collapsed ? String(children) : undefined}
    >
      <Link
        to={to}
        onClick={onExpand}
        className={cn(
          "btn btn-sm btn-primary/10 text-primary font-normal",
          collapsed ? "btn-square" : "w-full justify-start gap-3",
          "[&.active]:btn-primary [&.active]:text-white",
        )}
      >
        {icon}
        {!collapsed && children}
      </Link>
    </div>
  );
}
