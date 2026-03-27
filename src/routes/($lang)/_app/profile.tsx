import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { uploadAvatar } from "@/lib/avatar.fns";
import { Camera } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { SubscriptionType } from "@/db/schema";

export const Route = createFileRoute("/($lang)/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useLanguage();
  const { data: session, refetch } = authClient.useSession();
  const user = session?.user;
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDirty = name !== (user?.name ?? "");

  async function handleSave() {
    setSaving(true);
    await authClient.updateUser({ name });
    await refetch();
    setSaving(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++)
        binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      await uploadAvatar({
        data: {
          base64,
          mimeType: file.type as
            | "image/jpeg"
            | "image/png"
            | "image/webp"
            | "image/gif",
          fileName: file.name,
        },
      });
      await refetch();
    } finally {
      setUploading(false);
      // reset so the same file can be re-picked
      e.target.value = "";
    }
  }

  const initials = (user?.name || user?.email || "?")[0].toUpperCase();
  const sub = user?.subscription as SubscriptionType | undefined;
  const showSubDot = sub === "pro" || sub === "advance";

  return (
    <div className="max-w-lg p-8">
      <h1 className="mb-6 text-2xl font-semibold">{t("profile.heading")}</h1>

      {/* Avatar */}
      <div className="mb-8 flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleAvatarChange}
        />

        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="group relative cursor-pointer"
          title={t("profile.uploadAvatar")}
        >
          <div className="indicator">
            {showSubDot && (
              <span className="indicator-item badge badge-accent badge-xs capitalize">
                {sub}
              </span>
            )}
            <div className="avatar">
              <div
                className={cn(
                  "bg-base-300 size-16 overflow-hidden rounded-full",
                  user?.role === "director" &&
                    "ring-primary ring-offset-base-100 ring-2 ring-offset-2",
                )}
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name ?? ""}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="text-base-content/60 flex size-full items-center justify-center text-2xl font-semibold select-none">
                    {initials}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overlay */}
          <div
            className={cn(
              "bg-base-content/40 absolute inset-0 flex items-center justify-center rounded-full transition-opacity",
              uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            {uploading ? (
              <span className="loading loading-spinner loading-sm text-base-100" />
            ) : (
              <Camera className="text-base-100 size-5" />
            )}
          </div>
        </button>

        <div className="flex flex-col gap-0.5">
          <p className="font-medium">{user?.name ?? "—"}</p>
          <p className="text-base-content/50 text-sm">{user?.email}</p>
          {user?.role === "director" ? (
            (sub === "standard" || sub === "pro") ? (
              <button className="btn btn-xs btn-outline btn-accent mt-1 w-fit font-display tracking-wide">
                {t("profile.upgrade")}
              </button>
            ) : (
              <span className="badge badge-accent badge-xs mt-1 w-fit capitalize">
                {sub}
              </span>
            )
          ) : (
            <span className="badge badge-xs badge-outline badge-secondary mt-1 w-fit">
              actor
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <fieldset className="fieldset gap-1">
          <legend className="fieldset-legend text-base-content/40 text-xs tracking-widest">
            {t("profile.displayName")}
          </legend>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("profile.namePlaceholder")}
            className="input bg-base-200 border-base-300 focus:border-primary/60 focus:ring-primary/10 w-full text-sm focus:ring-2"
          />
        </fieldset>

        <fieldset className="fieldset gap-1">
          <legend className="fieldset-legend text-base-content/40 text-xs tracking-widest">
            {t("common.email")}
          </legend>
          <input
            type="email"
            value={user?.email ?? ""}
            readOnly
            className="input bg-base-200 border-base-300 w-full cursor-not-allowed text-sm opacity-50"
          />
        </fieldset>

        <button
          disabled={!isDirty || saving}
          onClick={handleSave}
          className={cn(
            "btn btn-primary font-display mt-2 w-fit tracking-[0.08em]",
            (!isDirty || saving) && "cursor-not-allowed opacity-40",
          )}
        >
          {saving ? t("profile.saving") : t("profile.saveChanges")}
        </button>
      </div>
    </div>
  );
}
