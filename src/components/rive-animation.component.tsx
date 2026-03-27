import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * RiveAnimation component with implicit canvas creation.
 * Creates the canvas element via document.createElement for isolated WebGL lifecycle management.
 * Uses the vanilla @rive-app/webgl2 API for maximum stability with dynamic imports.
 */
export function RiveAnimation(props: {
  src?: string | null;
  buffer?: ArrayBuffer;
  className?: string;
}) {
  // Be extremely defensive against null props
  if (!props) return null;

  const { src, buffer, className } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let riveInstance: any = null;
    let isCancelled = false;

    // Create canvas implicitly
    const canvas = document.createElement("canvas");
    canvas.className = "h-full w-full pointer-events-none"; // Isolated styling
    containerRef.current.appendChild(canvas);

    async function init() {
      try {
        const { Rive, Layout, Fit } = await import("@rive-app/webgl2");
        if (isCancelled || !containerRef.current) return;

        const isCover = className?.includes("object-cover");
        const fit = isCover ? Fit.Cover : Fit.Contain;

        riveInstance = new Rive({
          src: src || undefined,
          buffer: buffer || undefined,
          canvas: canvas,
          autoplay: true,
          layout: new Layout({ fit }),
          onLoad: () => {
            if (!isCancelled) {
              setIsLoaded(true);
              // Ensure drawing surface matches initial size
              riveInstance?.resizeDrawingSurfaceToCanvas();
            }
          },
        });
      } catch (error) {
        console.error("Failed to load Rive:", error);
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (riveInstance) {
        try {
          riveInstance.stopRendering();
          riveInstance.cleanup();
          riveInstance = null;
        } catch (e) {
          // Ignore cleanup errors on destroy
        }
      }
      if (canvas.parentNode) {
        canvas.remove();
      }
    };
  }, [src, buffer, className]);

  return (
    <div
      ref={containerRef}
      className={cn(className, "relative overflow-hidden")}
    >
      {!isLoaded && (
        <div className="bg-base-300 absolute inset-0 animate-pulse" />
      )}
    </div>
  );
}
