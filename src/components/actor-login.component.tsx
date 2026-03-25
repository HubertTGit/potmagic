import { useState } from "react";
import { Drama, Spotlight } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { actorSignIn } from "@/lib/actor-auth.fns";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/hooks/useLanguage";

export function ActorLogin() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { langPrefix, t } = useLanguage();
  // refetch() updates the shared useSession() atom — getSession() does not
  const { refetch } = authClient.useSession();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await actorSignIn({ data: { email: form.get("email") as string } });
      // Hydrate the shared session atom so _app.tsx sees a non-null session
      await refetch();
      await router.navigate({ to: `${langPrefix}/stories` });
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ?? t("auth.error.loginFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-base-100 min-w-87.5">
      {/* Role icon header */}
      <div className="flex flex-col items-center px-8 pt-8 pb-6">
        <div className="flex size-20 items-center justify-center">
          <Drama className="text-secondary size-10" />
        </div>
        <p className="font-display text-base-content/40 mb-4 text-sm tracking-[0.25em] uppercase">
          {t("auth.subtitle.enterStage")}
        </p>
        <p className="text-base-content/60 px-6 text-center text-sm leading-relaxed">
          {t("auth.actor.description")}
        </p>
      </div>

      <div className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="text-error border-error-content bg-error/10 rounded-2xl border p-3 text-center text-xs">
              {error}
            </p>
          )}

          <fieldset className="fieldset gap-1">
            <legend className="fieldset-legend text-base-content/40 text-xs tracking-widest">
              {t("common.email")}
            </legend>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              required
              className="input w-full"
            />
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "btn btn-secondary btn-block font-display mt-1 text-base tracking-[0.08em]",
              loading && "cursor-not-allowed opacity-60",
            )}
          >
            {loading ? t("auth.loading.entering") : t("auth.actor.enter")}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-base-content/30 text-sm">
            {t("auth.actor.line1")}
            <br />
            <span className="text-secondary/70">{t("auth.actor.line2")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
