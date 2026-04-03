import { useForm } from "@tanstack/react-form";
import { Drama } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { actorSignIn } from "@/lib/actor-auth.fns";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/hooks/useLanguage";
import { emailSchema } from "@/lib/schemas";

export function ActorLogin() {
  const router = useRouter();
  const { langPrefix, t } = useLanguage();
  // refetch() updates the shared useSession() atom — getSession() does not
  const { refetch } = authClient.useSession();

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      try {
        await actorSignIn({ data: { email: value.email } });
        // Hydrate the shared session atom so _app.tsx sees a non-null session
        await refetch();
        await router.navigate({ to: `${langPrefix}/stories` as any });
      } catch (err: unknown) {
        throw new Error(
          (err as { message?: string })?.message ?? t("auth.error.loginFailed"),
        );
      }
    },
  });

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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <form.Subscribe
            selector={(state) =>
              state.submissionAttempts > 0 &&
              !state.isSubmitting &&
              state.errorMap.onSubmit
            }
          >
            {(submitError) =>
              submitError ? (
                <p className="text-error border-error-content bg-error/10 rounded-2xl border p-3 text-center text-xs">
                  {`${submitError}`}
                </p>
              ) : null
            }
          </form.Subscribe>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                const result = emailSchema.safeParse(value);
                if (result.success) return undefined;
                return result.error.issues[0].code === "too_small" || value === ""
                  ? t("auth.error.emailRequired" as any)
                  : t("auth.error.invalidEmail" as any);
              },
              onBlur: ({ value }) => {
                const result = emailSchema.safeParse(value);
                if (result.success) return undefined;
                return result.error.issues[0].code === "too_small" || value === ""
                  ? t("auth.error.emailRequired" as any)
                  : t("auth.error.invalidEmail" as any);
              },
            }}
          >
            {(field) => (
              <fieldset className="fieldset gap-1">
                <legend className="fieldset-legend text-base-content/40 text-xs tracking-widest">
                  {t("common.email")}
                </legend>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn(
                    "input w-full",
                    field.state.meta.isTouched &&
                      !field.state.meta.isValid &&
                      "input-error",
                  )}
                />
                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <p role="alert" className="text-error mt-1 text-xs">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </fieldset>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) =>
              [state.canSubmit, state.isSubmitting] as const
            }
          >
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={cn(
                  "btn btn-secondary btn-block font-display mt-1 text-base tracking-[0.08em]",
                  (!canSubmit || isSubmitting) &&
                    "cursor-not-allowed opacity-60",
                )}
              >
                {isSubmitting
                  ? t("auth.loading.entering")
                  : t("auth.actor.enter")}
              </button>
            )}
          </form.Subscribe>
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
