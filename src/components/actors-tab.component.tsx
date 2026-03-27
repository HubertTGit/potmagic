import { useState } from "react";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { ConfirmModal } from "@/components/confirm-modal";
import { useLanguage } from "@/hooks/useLanguage";

interface Actor {
  id: string;
  email: string;
  accepted: boolean;
  createdAt: Date;
}

interface ActorsTabProps {
  actors: Actor[];
  isLoading: boolean;
  onInvite: (email: string) => void;
  onRemove: (id: string) => void;
  isInviting: boolean;
}

export function ActorsTab({
  actors,
  isLoading,
  onInvite,
  onRemove,
  isInviting,
}: ActorsTabProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!email.trim()) return;
    onInvite(email.trim());
    setEmail("");
  };

  return (
    <div>
      <p className="text-base-content/40 mb-6 text-sm">
        {t('actors.inviteDescription')}
      </p>

      {/* Invite form */}
      <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('actors.emailPlaceholder')}
          required
          className="input bg-base-200 border-base-300 focus:border-primary/60 focus:ring-primary/10 flex-1 text-sm focus:ring-2"
        />
        <button
          type="submit"
          disabled={isInviting || !email.trim()}
          className={cn(
            "btn btn-primary font-display tracking-[0.05em]",
            (isInviting || !email.trim()) && "opacity-50",
          )}
        >
          {isInviting ? t('action.inviting') : t('action.invite')}
        </button>
      </form>

      {/* Actors list */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="skeleton h-4 flex-1 rounded" />
              <div className="skeleton h-4 w-16 rounded" />
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-6 w-6 rounded" />
            </div>
          ))}
        </div>
      ) : actors.length === 0 ? (
        <p className="text-base-content/30 py-8 text-center text-sm">
          {t('actors.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-sm table w-full">
            <thead>
              <tr className="text-base-content/50 text-xs tracking-wider uppercase">
                <th>{t('table.email')}</th>
                <th>{t('table.status')}</th>
                <th>{t('table.added')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {actors.map((actor) => (
                <tr
                  key={actor.id}
                  className="hover:bg-base-200 transition-colors"
                >
                  <td className="font-medium">{actor.email}</td>
                  <td>
                    <span
                      className={cn(
                        "text-xs font-medium tracking-wider uppercase",
                        actor.accepted
                          ? "text-success"
                          : "text-base-content/40",
                      )}
                    >
                      {actor.accepted ? t('status.accepted') : t('status.pending')}
                    </span>
                  </td>
                  <td className="text-base-content/40 text-xs">
                    {new Date(actor.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => setConfirmingId(actor.id)}
                      className="btn btn-ghost btn-xs text-base-content/40 hover:text-error"
                    >
                      <X className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmingId}
        title={t('modal.removeActor')}
        message={t('modal.removeActorMessage', { name: actors.find((a) => a.id === confirmingId)?.email ?? '' })}
        confirmText={t('action.remove')}
        confirmButtonClass="btn-error"
        onConfirm={() => {
          if (confirmingId) onRemove(confirmingId);
          setConfirmingId(null);
        }}
        onCancel={() => setConfirmingId(null)}
      />
    </div>
  );
}
