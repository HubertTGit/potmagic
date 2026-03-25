import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Clapperboard, Drama, Spotlight } from "lucide-react";
import { DirectorLogin } from "@/components/director-login.component";
import { ActorLogin } from "@/components/actor-login.component";
import { LandingNavbar } from "@/components/landing-navbar.component";
import { LandingFooter } from "@/components/landing-footer.component";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/hooks/useLanguage";
import { getMeta } from "@/i18n/meta";

export const Route = createFileRoute("/($lang)/auth")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return {
      meta: [
        { title: getMeta(locale, "meta.auth.title") },
        {
          name: "description",
          content: getMeta(locale, "meta.auth.description"),
        },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  validateSearch: (search: Record<string, unknown>) => ({
    token:
      typeof search.token === "string" && search.token
        ? search.token
        : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const { langPrefix, t } = useLanguage();

  useEffect(() => {
    if (session) {
      navigate({ to: `${langPrefix}/stories` });
    }
  }, [session, navigate, langPrefix]);

  return (
    <div className="bg-base-200 flex min-h-screen flex-col">
      <LandingNavbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div role="tablist" className="tabs tabs-lifted overflow-visible">
            {/* Director Tab */}
            <label className="tab has-checked:bg-base-100 has-checked:text-primary has-checked:tab-active gap-2 rounded-t-xl">
              <input type="radio" name="auth_tabs" role="tab" defaultChecked />
              <Clapperboard className="size-5" />
              {t("auth.role.director")}
            </label>
            <div
              role="tabpanel"
              className="tab-content bg-base-100 overflow-hidden rounded-tl-none"
            >
              <DirectorLogin token={token} />
            </div>

            {/* Actor Tab */}
            <label className="tab has-checked:bg-base-100 has-checked:text-secondary has-checked:tab-active gap-2 rounded-t-xl">
              <input type="radio" name="auth_tabs" role="tab" />
              <Drama className="size-5" />
              {t("auth.role.actor")}
            </label>
            <div
              role="tabpanel"
              className="tab-content bg-base-100 overflow-hidden"
            >
              <ActorLogin />
            </div>
          </div>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
