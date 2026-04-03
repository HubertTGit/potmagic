import { useForm } from "@tanstack/react-form";
import { Clapperboard, Megaphone } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/hooks/useLanguage";

import { emailSchema } from "@/lib/schemas";

export function DirectorLogin({ token = "" }: { token?: string }) {
  const { t, langPrefix } = useLanguage();

  const callbackURL = token
    ? `${langPrefix}/auth/director-setup?token=${encodeURIComponent(token)}`
    : `${langPrefix}/stories`;

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.signIn.magicLink({
        email: value.email,
        callbackURL,
      });
      if (error) {
        throw new Error(error.message ?? t("auth.error.failedSendLink"));
      }
    },
  });

  const googleForm = useForm({
    defaultValues: {},
    onSubmit: async () => {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
      if (error) {
        throw new Error(error.message ?? t("auth.error.googleSignInFailed"));
      }
      // on success the browser redirects — component unmounts
    },
  });

  const isSent = form.state.isSubmitSuccessful;
  const sentEmail = form.state.values.email;

  return (
    <div className="bg-base-100 min-w-87.5">
      {/* Role icon header */}
      <div className="flex flex-col items-center px-8 pt-8 pb-6">
        <div className="flex size-20 items-center justify-center">
          <Clapperboard className="text-primary size-10" />
        </div>
        <p className="font-display text-base-content/40 mb-4 text-sm tracking-[0.25em] uppercase">
          {t("auth.subtitle.enterStage")}
        </p>
        <p className="text-base-content/60 px-6 text-center text-sm leading-relaxed">
          {t("auth.director.description")}
        </p>
      </div>

      {isSent ? (
        <div className="flex flex-col gap-3 px-8 pb-8 text-center">
          <p className="text-base-content/60 text-sm">
            {t("auth.confirmation.sentTo")}
          </p>
          <p className="text-base-content bg-primary/10 border-primary rounded-2xl p-3 text-sm font-medium">
            {sentEmail}
          </p>
          <button
            type="button"
            onClick={() => form.reset()}
            className="link mt-2 text-xs opacity-50 hover:opacity-100"
          >
            {t("auth.action.tryDifferentEmail")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-8 pb-8">
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
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
                  disabled={!canSubmit || googleForm.state.isSubmitting}
                  className={cn(
                    "btn btn-primary btn-block font-display text-base tracking-[0.08em]",
                    (!canSubmit || googleForm.state.isSubmitting) &&
                      "cursor-not-allowed opacity-60",
                  )}
                >
                  {isSubmitting
                    ? t("auth.loading.sending")
                    : t("auth.director.useMagicLink")}
                </button>
              )}
            </form.Subscribe>
          </form>

          <div className="flex items-center gap-3">
            <div className="bg-base-content/10 h-px flex-1" />
            <span className="text-base-content/30 text-xs">
              {t("auth.divider.or")}
            </span>
            <div className="bg-base-content/10 h-px flex-1" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void googleForm.handleSubmit();
            }}
          >
            <googleForm.Subscribe
              selector={(state) =>
                [state.canSubmit, state.isSubmitting] as const
              }
            >
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || form.state.isSubmitting}
                  className={cn(
                    "btn btn-block bg-base-100 text-base-content border-base-content/20 hover:bg-base-200 gap-2 border",
                    (!canSubmit || form.state.isSubmitting) &&
                      "cursor-not-allowed opacity-60",
                  )}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                      />
                      <path
                        fill="#34A853"
                        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                      />
                      <path
                        fill="#EA4335"
                        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                      />
                    </svg>
                  )}
                  {isSubmitting
                    ? t("auth.loading.redirecting")
                    : t("auth.director.continueGoogle")}
                </button>
              )}
            </googleForm.Subscribe>

            <googleForm.Subscribe
              selector={(state) =>
                state.submissionAttempts > 0 &&
                !state.isSubmitting &&
                state.errorMap.onSubmit
              }
            >
              {(submitError) =>
                submitError ? (
                  <p className="text-error border-error-content bg-error/10 mt-2 rounded-2xl border p-3 text-center text-xs">
                    {`${submitError}`}
                  </p>
                ) : null
              }
            </googleForm.Subscribe>
          </form>
        </div>
      )}
    </div>
  );
}
