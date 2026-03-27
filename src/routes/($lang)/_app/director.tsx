import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listStories } from "@/lib/stories.fns";
import { uploadProp, listAllProps, deleteProp } from "@/lib/props.fns";
import {
  listInvitedActors,
  addInvitedActor,
  removeInvitedActor,
} from "@/lib/actor-auth.fns";
import { StatusBadge } from "@/components/status-badge.component";
import { cn } from "@/lib/cn";
import { LibrarySection } from "@/components/library-section.component";
import { ActorsTab } from "@/components/actors-tab.component";
import { updateStoryStatus } from "@/lib/story-detail.fns";
import type { PropType } from "@/db/schema";
import { toast } from "@/lib/toast";
import { getMeta } from "@/i18n/meta";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/($lang)/_app/director")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return { meta: [{ title: getMeta(locale, "meta.director.title") }] };
  },
  component: DirectorPage,
});

type Tab = "dashboard" | "library" | "actors";

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

  const { data: allProps, isLoading: loadingProps } = useQuery({
    queryKey: ["props"],
    queryFn: () => listAllProps(),
    enabled: tab === "library",
  });

  const characters = allProps?.character ?? [];
  const backgrounds = allProps?.background ?? [];
  const sounds = allProps?.sound ?? [];
  const animations = allProps?.rive ?? [];
  const loadingChars = loadingProps;
  const loadingBgs = loadingProps;
  const loadingSounds = loadingProps;
  const loadingAnims = loadingProps;

  const { data: invitedActors = [], isLoading: loadingActors } = useQuery({
    queryKey: ["invitedActors"],
    queryFn: () => listInvitedActors(),
  });

  const acceptedCount = invitedActors.filter((a) => a.accepted).length;

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

  const handleAddProp = async (type: PropType, file: File, name: string) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const CHUNK = 8192;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const base64 = btoa(binary);

      await uploadProp({
        data: {
          name,
          type,
          fileName: file.name,
          contentType:
            file.type ||
            (file.name.endsWith(".riv") ? "application/octet-stream" : ""),
          base64,
          size: file.size,
        },
      });

      queryClient.invalidateQueries({ queryKey: ["props"] });
    } catch (error: any) {
      toast.error(error.message ?? "Upload failed");
      throw error;
    }
  };

  const handleRemoveProp = async (_type: PropType, id: string) => {
    await deleteProp({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["props"] });
  };

  return (
    <div className="max-w-3xl p-8">
      <h1 className="mb-2 text-2xl font-semibold">{t("director.heading")}</h1>
      <p className="text-base-content/40 mb-6 text-sm">
        {t("director.subtitle")}
      </p>

      {/* Tabs */}
      <div
        role="tablist"
        className="tabs tabs-border border-base-300 mb-8 border-b [--tab-color:var(--color-primary)]"
      >
        {[
          { id: "dashboard" as Tab, label: t("director.tab.dashboard") },
          { id: "library" as Tab, label: t("director.tab.library") },
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

      {tab === "library" && (
        <>
          <p className="text-base-content/40 mb-6 text-sm">
            {t("director.library.description")}
          </p>
          <div className="flex flex-col gap-8">
            <LibrarySection
              label={t("director.library.characters")}
              type="character"
              items={characters}
              isLoading={loadingChars}
              onAdd={(file, name) => handleAddProp("character", file, name)}
              onRemove={(id) => handleRemoveProp("character", id)}
            />
            <LibrarySection
              label={t("director.library.backgrounds")}
              type="background"
              items={backgrounds}
              isLoading={loadingBgs}
              onAdd={(file, name) => handleAddProp("background", file, name)}
              onRemove={(id) => handleRemoveProp("background", id)}
            />
            <LibrarySection
              label={t("director.library.sounds")}
              type="sound"
              items={sounds}
              isLoading={loadingSounds}
              onAdd={(file, name) => handleAddProp("sound", file, name)}
              onRemove={(id) => handleRemoveProp("sound", id)}
            />
            {/* Animations section hidden until feature is ready */}
            <LibrarySection
              label="Rive Animation"
              type="rive"
              items={animations}
              isLoading={loadingAnims}
              onAdd={(file, name) => handleAddProp("rive", file, name)}
              onRemove={(id) => handleRemoveProp("rive", id)}
            />
          </div>
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
