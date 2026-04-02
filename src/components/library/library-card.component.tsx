import { cn } from "@/lib/cn";
import { type LucideIcon } from "lucide-react";

export interface LibraryCardProps {
  title: string;
  icon: LucideIcon;
  count: number;
  color: string;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function LibraryCard({
  title,
  icon: Icon,
  count,
  color,
  isActive,
  isLoading,
  onClick,
}: LibraryCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card bg-base-200 border-base-300 hover:border-primary/50 group cursor-pointer border transition-all",
        isActive && "border-primary bg-primary/5 ring-primary/20 ring-1",
      )}
    >
      <div className="card-body p-6">
        <div
          className={cn(
            "bg-base-100 mb-4 w-fit rounded-lg p-3 transition-transform group-hover:scale-110",
            color,
          )}
        >
          <Icon className="size-6" />
        </div>
        <h2 className="card-title mb-1 text-xl">{title}</h2>
        <p className="text-base-content/60 text-sm">
          {isLoading ? (
            <span className="skeleton inline-block h-4 w-12 rounded" />
          ) : (
            count
          )}{" "}
          items in collection
        </p>
      </div>
    </div>
  );
}
