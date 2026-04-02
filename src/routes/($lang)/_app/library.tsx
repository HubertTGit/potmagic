import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LibraryBig,
  Users,
  Image as ImageIcon,
  Music,
  Film,
  Plus,
  Drama,
  PersonStanding,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { listAllProps, uploadProp, deleteProp } from "@/lib/props.fns";
import { LibrarySection } from "@/components/library/library-section.component";
import { LibraryCard } from "@/components/library/library-card.component";
import { requireDirector } from "@/lib/auth-guard";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/lib/toast";
import type { PropType } from "@/db/schema";

export const Route = createFileRoute("/($lang)/_app/library")({
  beforeLoad: () => requireDirector(),
  component: LibraryPage,
});

function LibraryPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<PropType>("character");

  const { data: allProps, isLoading } = useQuery({
    queryKey: ["props"],
    queryFn: () => listAllProps(),
  });

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

  const sections = [
    {
      id: "character" as PropType,
      title: t("director.library.characters"),
      icon: Users,
      count: allProps?.character?.length ?? 0,
      color: "text-blue-500",
    },
    {
      id: "background" as PropType,
      title: t("director.library.backgrounds"),
      icon: ImageIcon,
      count: allProps?.background?.length ?? 0,
      color: "text-green-500",
    },
    {
      id: "sound" as PropType,
      title: t("director.library.sounds"),
      icon: Music,
      count: allProps?.sound?.length ?? 0,
      color: "text-purple-500",
    },
    {
      id: "rive" as PropType,
      title: "Rive Animations",
      icon: Film,
      count: allProps?.rive?.length ?? 0,
      color: "text-orange-500",
    },
    {
      id: "composite" as PropType,
      title: t("director.library.publishedCharacters"),
      icon: PersonStanding,
      count: allProps?.composite?.length ?? 0,
      color: "text-primary",
    },
  ];

  const activeLabel = sections.find((s) => s.id === activeSection)?.title ?? "";

  return (
    <div className="max-w-5xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <LibraryBig className="text-primary size-8" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">
              {t("director.tab.library")}
            </h1>
            <p className="text-base-content/60">
              {t("director.library.description")}
            </p>
          </div>
        </div>
      </header>

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <LibraryCard
            key={section.id}
            title={section.title}
            icon={section.icon}
            count={section.count}
            color={section.color}
            isActive={activeSection === section.id}
            isLoading={isLoading}
            onClick={() => setActiveSection(section.id)}
          />
        ))}
      </div>

      <div className="bg-base-200 border-base-300 min-h-[400px] rounded-2xl border p-5">
        <LibrarySection
          label={activeLabel}
          type={activeSection}
          items={
            (activeSection === "composite"
              ? allProps?.composite
              : activeSection === "rive"
                ? allProps?.rive
                : activeSection === "character"
                  ? allProps?.character
                  : activeSection === "background"
                    ? allProps?.background
                    : activeSection === "sound"
                      ? allProps?.sound
                      : []) ?? []
          }
          isLoading={isLoading}
          onAdd={(file, name) => handleAddProp(activeSection, file, name)}
          onRemove={(id) => handleRemoveProp(activeSection, id)}
          readOnly={activeSection === "composite"}
        />
      </div>
    </div>
  );
}
