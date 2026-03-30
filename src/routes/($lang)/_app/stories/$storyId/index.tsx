import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getMeta } from "@/i18n/meta";
import { Theater, Layers, Drama } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStoryDetail,
  updateStoryTitle,
  addScene,
  removeScene,
  reorderScenes,
} from "@/lib/story-detail.fns";
import { StatusBadge } from "@/components/status-badge.component";
import { Breadcrumb } from "@/components/breadcrumb.component";
import { ConfirmModal } from "@/components/confirm-modal";
import { cn } from "@/lib/cn";
import { authClient } from "@/lib/auth-client";
import { StoryScenesTab } from "@/components/story-scenes-tab";

export const Route = createFileRoute("/($lang)/_app/stories/$storyId/")({
  head: ({ match }) => {
    const locale = (match.context as { locale?: string })?.locale ?? "en";
    return { meta: [{ title: getMeta(locale, "meta.storyDetail.title") }] };
  },
  component: StoryDetailPage,
});

function StoryDetailPage() {
  const { storyId } = Route.useParams();
  const { t } = useLanguage();
  const { data: session } = authClient.useSession();
  const isDirector = session?.user?.role === "director";
  const queryClient = useQueryClient();
  const router = useRouter();
  const qk = ["story", storyId];

  const { data, isLoading } = useQuery({
    queryKey: qk,
    queryFn: () => getStoryDetail({ data: { storyId } }),
  });

  const [title, setTitle] = useState("");
  const [sceneToDelete, setSceneToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (data?.story) setTitle(data.story.title);
  }, [data?.story]);

  useEffect(() => {
    if (data?.story?.title) {
      document.title = `${data.story.title} — potmagic: Live Story Theater`;
      return () => {
        document.title = "potmagic: Live Story Theater";
      };
    }
  }, [data?.story?.title]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk });

  const saveTitleMutation = useMutation({
    mutationFn: (t: string) =>
      updateStoryTitle({ data: { storyId, title: t } }),
    onSuccess: invalidate,
  });

  const addSceneMutation = useMutation({
    mutationFn: (t: string) => addScene({ data: { storyId, title: t } }),
    onSuccess: invalidate,
  });

  const removeSceneMutation = useMutation({
    mutationFn: (sceneId: string) => removeScene({ data: { sceneId } }),
    onSuccess: () => {
      invalidate();
      setSceneToDelete(null);
    },
  });

  const reorderScenesMutation = useMutation({
    mutationFn: (reordered: { id: string; order: number }[]) =>
      reorderScenes({ data: { scenes: reordered } }),
    onSuccess: invalidate,
    onError: invalidate,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl p-8">
        <div className="skeleton mb-8 h-4 w-48 rounded" />
        <div className="mb-8 flex items-center gap-3">
          <div className="skeleton h-10 flex-1 rounded" />
          <div className="skeleton h-10 w-20 rounded" />
          <div className="skeleton h-10 w-32 rounded" />
        </div>
        <div className="mb-6 flex justify-end">
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-base-content/40">{t("story.notFound")}</p>
      </div>
    );
  }

  const { story, scenes } = data;

  const isTitleDirty = title !== story.title;

  return (
    <div className="max-w-3xl p-8">
      <Breadcrumb
        crumbs={[
          { label: t("nav.stories"), to: "/stories" },
          { label: story.title, type: "story" },
        ]}
      />

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        {isDirector ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input bg-base-200 border-base-300 focus:border-primary/60 focus:ring-primary/10 flex-1 text-lg font-semibold focus:ring-2"
          />
        ) : (
          <h1 className="flex-1 text-lg font-semibold">{story.title}</h1>
        )}

        {isDirector && (
          <button
            disabled={!isTitleDirty || saveTitleMutation.isPending}
            onClick={() => saveTitleMutation.mutate(title)}
            className={cn(
              "btn btn-secondary font-display tracking-[0.05em]",
              (!isTitleDirty || saveTitleMutation.isPending) &&
                "cursor-not-allowed opacity-40",
            )}
          >
            {t("action.save")}
          </button>
        )}
        {scenes.length > 0 && (
          <button
            disabled={
              !isDirector &&
              (!story.directorOnStage ||
                (story.status !== "draft" && story.status !== "active"))
            }
            className={cn(
              "btn btn-primary font-display tracking-[0.05em]",
              !isDirector &&
                (!story.directorOnStage ||
                  (story.status !== "draft" && story.status !== "active")) &&
                "btn-disabled cursor-not-allowed opacity-50",
            )}
            onClick={() =>
              router.navigate({
                to: `/stage/${!isDirector && story.selectedSceneId ? story.selectedSceneId : scenes[0].id}` as any,
              })
            }
          >
            {t("story.enterStage")} <Theater className="size-4" />
          </button>
        )}
      </div>

      {/* Status */}
      <div className="mb-6 flex items-center justify-end">
        <StatusBadge status={story.status} />
      </div>

      <StoryScenesTab
        scenes={scenes}
        storyId={storyId}
        isDirector={isDirector}
        onAddScene={(title) => addSceneMutation.mutate(title)}
        onRemoveScene={(id, title) => setSceneToDelete({ id, title })}
        onReorderScenes={(reordered) => reorderScenesMutation.mutate(reordered)}
        isAddingScene={addSceneMutation.isPending}
        isRemovingScene={removeSceneMutation.isPending}
      />

      {/* Delete Scene Confirmation Modal */}
      <ConfirmModal
        isOpen={!!sceneToDelete}
        title={t("modal.confirmDeletion")}
        message={t("modal.deleteSceneMessage", {
          title: sceneToDelete?.title ?? "",
        })}
        confirmText={t("action.delete")}
        pendingText={t("action.deleting")}
        onConfirm={() =>
          sceneToDelete && removeSceneMutation.mutate(sceneToDelete.id)
        }
        onCancel={() => setSceneToDelete(null)}
        isPending={removeSceneMutation.isPending}
      />
    </div>
  );
}
