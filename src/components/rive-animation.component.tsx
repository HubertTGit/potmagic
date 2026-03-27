import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * RiveAnimation component with dynamic import and SSR guard.
 * Uses the vanilla @rive-app/webgl2 API for maximum stability with dynamic imports.
 */
export function RiveAnimation(props: any) {
  // Be extremely defensive against null props
  if (!props) return null;

  const { src, buffer, className } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let riveInstance: any = null;
    let isCancelled = false;

    async function init() {
      if (!canvasRef.current) return;

      try {
        const { Rive, Layout, Fit } = await import("@rive-app/webgl2");
        if (isCancelled || !canvasRef.current) return;

        const isCover = className?.includes("object-cover");
        const fit = isCover ? Fit.Cover : Fit.Contain;

        riveInstance = new Rive({
          src: src || undefined,
          buffer: buffer || undefined,
          canvas: canvasRef.current,
          autoplay: true,
          layout: new Layout({ fit }),
          onLoad: () => {
            if (!isCancelled) setIsLoaded(true);
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
          riveInstance.cleanup();
        } catch (e) {
          // Ignore cleanup errors on destroy (e.g. WebGL context already lost)
          console.warn("Rive cleanup error:", e);
        }
      }
    };
  }, [src, buffer, className]);

  return (
    <div className={cn(className, "relative overflow-hidden")}>
      {!isLoaded && <div className="absolute inset-0 bg-base-300 animate-pulse" />}
      <canvas
        ref={canvasRef}
        className={cn("h-full w-full", !isLoaded && "opacity-0")}
      />
    </div>
  );
}
