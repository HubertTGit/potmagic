import { cn } from "@/lib/cn";
import { Music } from "lucide-react";
import { RiveAnimation } from "../rive-animation.component";

export interface MediaPreviewProps {
  src?: string | null;
  buffer?: ArrayBuffer;
  name?: string;
  className?: string;
  isRive?: boolean;
  isSound?: boolean;
  isInteractive?: boolean;
}

export const MediaPreview = ({
  src,
  buffer,
  name,
  className,
  isRive,
  isSound,
  isInteractive,
}: MediaPreviewProps) => {
  if (isSound) {
    return (
      <div
        className={cn(
          "bg-base-300 flex flex-col items-center justify-center gap-4 p-6",
          className,
        )}
      >
        <Music className="text-base-content/40 size-8" />
        {/* audio preview — captions not required for a short preview clip */}
        {src && (
          <audio
            controls
            src={src}
            className="w-50"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    );
  }

  if (isRive) {
    return (
      <RiveAnimation
        src={src}
        buffer={buffer}
        className={className}
        isInteractive={isInteractive}
      />
    );
  }

  return src ? (
    <img src={src} alt={name} className={className} />
  ) : (
    <div className={className} />
  );
};
