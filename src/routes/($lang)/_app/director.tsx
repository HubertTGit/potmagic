import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listStories } from "@/lib/stories.fns";
import {
  listInvitedActors,
  addInvitedActor,
  removeInvitedActor,
} from "@/lib/actor-auth.fns";
import { StatusBadge } from "@/components/status-badge.component";
import { cn } from "@/lib/cn";
import { ActorsTab } from "@/components/actors-tab.component";
import { updateStoryStatus } from "@/lib/story-detail.fns";
import { toast } from "@/lib/toast";
import { requireDirector } from "@/lib/auth-guard";
import { getMeta } from "@/i18n/meta";
import { useLanguage } from "@/hooks/useLanguage";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/($lang)/_app/director")({
  beforeLoad: () => requireDirector(),
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return { meta: [{ title: getMeta(locale, "meta.director.title") }] };
  },
  component: DirectorPage,
});

type Tab = "dashboard" | "actors";

function DirectorPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("dashboard");

  const queryClient = useQueryClient();
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => listStories(),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      storyId,
      status,
    }: {
      storyId: string;
      status: "draft" | "active" | "ended";
    }) => updateStoryStatus({ data: { storyId, status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stories"] }),
  });

  const { data: invitedActors = [], isLoading: loadingActors } = useQuery({
    queryKey: ["invitedActors"],
    queryFn: () => listInvitedActors(),
  });

  const acceptedCount = invitedActors.filter((a: any) => a.accepted).length;

  const addActorMutation = useMutation({
    mutationFn: (email: string) => addInvitedActor({ data: { email } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["invitedActors"] }),
    onError: (err: any) =>
      toast.error(err?.message ?? t("director.error.failedInvite")),
  });

  const removeActorMutation = useMutation({
    mutationFn: (id: string) => removeInvitedActor({ data: { id } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["invitedActors"] }),
  });

  const active = stories.filter((s) => s.status === "active");
  const draft = stories.filter((s) => s.status === "draft");
  const ended = stories.filter((s) => s.status === "ended");

  return (
    <div className="max-w-5xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <Megaphone className="text-primary size-8" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">
              {t("director.heading")}
            </h1>
            <p className="text-base-content/60">
              {t("director.subtitle")}
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div
        role="tablist"
        className="tabs tabs-border border-base-300 mb-8 border-b [--tab-color:var(--color-primary)]"
      >
        {[
          { id: "dashboard" as Tab, label: t("director.tab.dashboard") },
          { id: "actors" as Tab, label: t("director.tab.actors") },
        ].map(({ id: tabId, label }) => (
          <button
            key={tabId}
            role="tab"
            onClick={() => setTab(tabId)}
            className={cn("tab", tab === tabId && "tab-active text-primary")}
          >
            {label}
            {tabId === "actors" && acceptedCount > 0 && (
              <span className="badge badge-sm badge-primary ml-1.5">
                {acceptedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <>
          {/* Stats row */}
          <div className="mb-10 grid grid-cols-3 gap-4">
            {[
              {
                label: t("director.stat.active"),
                count: active.length,
                color: "text-success",
              },
              {
                label: t("status.draft"),
                count: draft.length,
                color: "text-base-content/60",
              },
              {
                label: t("status.ended"),
                count: ended.length,
                color: "text-base-content/30",
              },
            ].map(({ label, count, color }) => (
              <div
                key={label}
                className="bg-base-200 border-base-300 rounded-xl border px-5 py-4"
              >
                <p className={cn("font-display text-3xl font-bold", color)}>
                  {count}
                </p>
                <p className="text-base-content/40 mt-1 text-xs tracking-widest uppercase">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Stories table */}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <div className="skeleton h-4 flex-1 rounded" />
                  <div className="skeleton h-4 w-8 rounded" />
                  <div className="skeleton h-4 w-16 rounded font-mono" />
                  <div className="skeleton h-5 w-16 rounded-full" />
                  <div className="skeleton h-7 w-24 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-sm table w-full">
                <thead>
                  <tr className="text-base-content/50 text-xs tracking-wider uppercase">
                    <th>{t("director.table.story")}</th>
                    <th>{t("director.table.cast")}</th>
                    <th>{t("director.table.pin")}</th>
                    <th>{t("table.status")}</th>
                    <th>{t("director.table.session")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <tr
                      key={story.id}
                      className="hover:bg-base-200 transition-colors"
                    >
                      <td>
                        <Link
                          to={`/stories/${story.id}` as any}
                          className="hover:text-primary font-medium transition-colors"
                        >
                          {story.title}
                        </Link>
                      </td>
                      <td className="text-base-content/50">
                        {story.castCount}
                      </td>
                      <td>
                        <code className="bg-base-300 rounded px-1.5 py-0.5 text-xs font-mono">
                          {story.accessPin}
                        </code>
                      </td>
                      <td>
                        <StatusBadge status={story.status} />
                      </td>
                      <td>
                        <SessionControls
                          story={story}
                          onSetStatus={(id, status) =>
                            statusMutation.mutate({ storyId: id, status })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "actors" && (
        <ActorsTab
          actors={invitedActors}
          isLoading={loadingActors}
          onInvite={(email) => addActorMutation.mutate(email)}
          onRemove={(id) => removeActorMutation.mutate(id)}
          isInviting={addActorMutation.isPending}
        />
      )}
    </div>
  );
}

function SessionControls({
  story,
  onSetStatus,
}: {
  story: { id: string; status: "draft" | "active" | "ended" };
  onSetStatus: (id: string, status: "draft" | "active" | "ended") => void;
}) {
  const { t } = useLanguage();
  if (story.status === "draft") {
    return (
      <button
        onClick={() => onSetStatus(story.id, "active")}
        className="btn btn-xs btn-success font-display tracking-wide"
      >
        {t("director.session.start")}
      </button>
    );
  }
  if (story.status === "active") {
    return (
      <button
        onClick={() => onSetStatus(story.id, "ended")}
        className="btn btn-xs btn-error btn-outline font-display tracking-wide"
      >
        {t("director.session.end")}
      </button>
    );
  }
  return (
    <button
      onClick={() => onSetStatus(story.id, "draft")}
      className="btn btn-xs btn-outline font-display tracking-wide"
    >
      {t("director.session.setToDraft")}
    </button>
  );
}
