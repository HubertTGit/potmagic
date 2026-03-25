import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { lookupStoryByPin } from "@/lib/stories.fns";
import { cn } from "@/lib/cn";

function validatePin(value: string): string | undefined {
  if (!value) return "PIN is required";
  if (value.length !== 6) return "PIN must be exactly 6 characters";
  if (!/^[A-Z0-9]+$/.test(value))
    return "PIN must contain only letters and numbers";
  return undefined;
}

interface ShowPinFormProps {
  onSuccess: (storyId: string) => void;
}

export function ShowPinForm({ onSuccess }: ShowPinFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { pin: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const result = await lookupStoryByPin({ data: { pin: value.pin } });
        onSuccess(result.storyId);
      } catch (e) {
        setServerError(
          e instanceof Error ? e.message : "PIN incorrect, can not find story",
        );
      }
    },
  });

  return (
    <div className="card bg-base-100 border-base-300 w-full max-w-sm border shadow-lg">
      <div className="card-body items-center gap-6 text-center">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-semibold tracking-wide">
            Enter your show PIN
          </h1>
          <p className="text-base-content/50 text-sm">
            You should have a 6-character PIN from the show host in your email
            inbox.
          </p>
        </div>

        {serverError && (
          <p
            role="alert"
            className="text-error border-error/30 bg-error/10 w-full rounded-xl border px-3 py-2 text-center text-xs"
          >
            {serverError}
          </p>
        )}

        <form
          className="flex w-full flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="pin"
            validators={{
              onChange: ({ value }) => validatePin(value),
              onBlur: ({ value }) => validatePin(value),
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={6}
                  placeholder="A1B2C3"
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(e.target.value.toUpperCase())
                  }
                  onBlur={field.handleBlur}
                  className={cn(
                    "input w-full text-center font-mono text-xl tracking-[0.4em] uppercase",
                    field.state.meta.isTouched &&
                      !field.state.meta.isValid &&
                      "input-error",
                  )}
                />
                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <p role="alert" className="text-error text-center text-xs">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
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
                disabled={!canSubmit}
                className={cn(
                  "btn btn-primary btn-block font-display tracking-wide",
                  !canSubmit && "cursor-not-allowed opacity-60",
                )}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Join Show"
                )}
              </button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  );
}
