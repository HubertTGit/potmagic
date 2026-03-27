import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LiveKitRoom } from "@livekit/components-react";

import { useLanguage } from "@/hooks/useLanguage";
import { useTheme, Theme } from "@/hooks/useTheme";
import { getPublicStory, getViewerToken } from "@/lib/show.fns";

import { ShowLiveContent } from "./show-live-content.component";

export function ShowLivePage({ storyId }: { storyId: string }) {
  const { t, langPrefix } = useLanguage();
  const [forcedOffline, setForcedOffline] = useState(false);
  const { theme } = useTheme();

  const { data: story, isPending: storyPending } = useQuery({
    queryKey: ["public-story", storyId],
    queryFn: () => getPublicStory({ data: { storyId } }),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (story?.title) {
      document.title = `${story.title} — potmagic: Live Story Theater`;
      return () => {
        document.title = "potmagic: Live Story Theater";
      };
    }
  }, [story?.title]);

  const isActive = !forcedOffline && story?.status === "active";

  const { data: livekitData } = useQuery({
    queryKey: ["viewer-token", storyId],
    queryFn: () => getViewerToken({ data: { storyId } }),
    enabled: isActive,
    staleTime: Infinity,
  });

  if (storyPending) {
    return (
      <div className="bg-base-100 fixed inset-0 flex items-center justify-center">
        <img
          src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
          alt="potmagic"
          className="size-12 animate-bounce"
        />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="bg-base-100 fixed inset-0 flex flex-col items-center justify-center gap-3">
        <img
          src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
          alt="potmagic"
        />
        <p className="font-display text-base-content/60 text-2xl">
          {t("show.notFound")}
        </p>
        <Link
          to={`${langPrefix}/show` as any}
          className="btn btn-accent btn-sm mt-2"
        >
          {t("show.backToEntry")}
        </Link>
      </div>
    );
  }

  if (forcedOffline || story.status === "ended") {
    return (
      <div className="bg-base-100 fixed inset-0 flex flex-col items-center justify-center gap-3">
        <img
          src={theme === Theme.dark ? "/icon-white.svg" : "/icon-red.svg"}
          alt="potmagic"
        />
        <p className="font-display text-base-content text-2xl">{story.title}</p>
        <p className="text-base-content/50 text-sm">{t("show.ended")}</p>
        <Link
          to={`${langPrefix}/show` as any}
          className="btn btn-accent btn-sm mt-2"
        >
          {t("show.backToEntry")}
        </Link>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="bg-base-100 fixed inset-0 flex flex-col items-center justify-center gap-3">
        <span className="text-4xl">🎭</span>
        <p className="font-display text-base-content/60 text-2xl">
          {t("show.notLiveYet")}
        </p>
        <p className="text-base-content/40 text-sm">
          {t("show.checkBackSoon", { title: story.title })}
        </p>
      </div>
    );
  }

  return livekitData ? (
    <LiveKitRoom
      key={storyId}
      serverUrl={livekitData.serverUrl}
      token={livekitData.token}
      audio={true}
      video={false}
      connect={true}
    >
      <ShowLiveContent
        storyTitle={story.title}
        directorSubscription={story.directorSubscription as any}
        initialSceneId={story.firstSceneId}
        onShowEnded={() => setForcedOffline(true)}
      />
    </LiveKitRoom>
  ) : (
    <div className="bg-base-100 fixed inset-0 flex items-center justify-center">
      <span className="loading loading-dots loading-md text-primary" />
    </div>
  );
}
