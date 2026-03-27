import { createFileRoute } from "@tanstack/react-router";
import {
  LibraryBig,
  Users,
  Image as ImageIcon,
  Music,
  Film,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";

import { requireDirector } from "@/lib/auth-guard";

export const Route = createFileRoute("/($lang)/_app/library")({
  beforeLoad: () => requireDirector(),
  component: LibraryPage,
});

function LibraryPage() {
  const sections = [
    { title: "Characters", icon: Users, count: 12, color: "text-blue-500" },
    {
      title: "Backgrounds",
      icon: ImageIcon,
      count: 8,
      color: "text-green-500",
    },
    { title: "Sounds", icon: Music, count: 24, color: "text-purple-500" },
    {
      title: "Rive Animations",
      icon: Film,
      count: 6,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <LibraryBig className="text-primary size-8" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Library</h1>
            <p className="text-base-content/60">
              Manage your story assets and collections
            </p>
          </div>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus className="size-4" />
          Add Asset
        </button>
      </header>

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <div
            key={section.title}
            className="card bg-base-200 border-base-300 hover:border-primary/50 group cursor-pointer border transition-all"
          >
            <div className="card-body p-6">
              <div
                className={cn(
                  "bg-base-100 mb-4 w-fit rounded-lg p-3 transition-transform group-hover:scale-110",
                  section.color,
                )}
              >
                <section.icon className="size-6" />
              </div>
              <h2 className="card-title mb-1 text-xl">{section.title}</h2>
              <p className="text-base-content/60 text-sm">
                {section.count} items in collection
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-base-200 border-base-300 rounded-2xl border p-12 text-center">
        <div className="bg-base-100/50 mx-auto mb-6 flex size-20 items-center justify-center rounded-full">
          <LibraryBig className="text-base-content/20 size-10" />
        </div>
        <h3 className="font-display mb-2 text-xl font-semibold">
          No collection selected
        </h3>
        <p className="text-base-content/50 mx-auto max-w-md">
          Select a collection above to view and manage your assets, or upload
          new files to get started.
        </p>
      </div>
    </div>
  );
}
