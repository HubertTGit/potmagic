import { useState, useEffect, useRef } from "react";
import { useSetAtom } from "jotai";
import { cn } from "@/lib/cn";
import { ViewModelProperty } from "@rive-app/webgl2/rive_advanced.mjs";
import { riveApiAtom } from "@/lib/rive.atoms";
import { Rive } from "@rive-app/webgl2";

export enum DataType {
  boolean = "boolean",
  enumType = "enumType",
  trigger = "trigger",
}

export interface VMProperty extends ViewModelProperty {
  enums?: string[];
}

/**
 * RiveAnimation component with implicit canvas creation.
 * Creates the canvas element via document.createElement for isolated WebGL lifecycle management.
 * Uses the vanilla @rive-app/webgl2 API for maximum stability with dynamic imports.
 */
export const RiveAnimation = ({
  src,
  buffer,
  className,
  isInteractive,
}: {
  src?: string | null;
  buffer?: ArrayBuffer;
  className?: string;
  isInteractive?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setRiveApi = useSetAtom(riveApiAtom);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let isCancelled = false;
    let riveInstance: Rive | null = null;

    // Create canvas implicitly
    const canvas = document.createElement("canvas");

    canvas.className = "pointer-events-none";
    containerRef.current.appendChild(canvas);

    async function init() {
      try {
        const { Rive, Layout, Fit } = await import("@rive-app/webgl2");
        if (isCancelled || !containerRef.current) return;

        const isCover = className?.includes("object-cover");
        const fit = isCover ? Fit.Cover : Fit.Contain;

        await new Promise<void>((resolve) => {
          riveInstance = new Rive({
            src: src || undefined,
            buffer: buffer || undefined,
            canvas: canvas,
            autoplay: true,
            autoBind: true,
            stateMachines: "pmStateMachine",
            layout: new Layout({ fit }),
            onLoad: () => {
              if (!isCancelled) {
                resolve();
                setIsLoaded(true);
                // Ensure drawing surface matches initial size
                riveInstance?.resizeDrawingSurfaceToCanvas();
              }
            },
          });
        });

        if (riveInstance) {
          const vmi = riveInstance.viewModelInstance;
          const artboardHeight = riveInstance.artboardHeight;
          const artboardWidth = riveInstance.artboardWidth;

          canvas.width = artboardWidth;
          canvas.height = artboardHeight;
          canvas.style.width = `${artboardWidth}px`;
          canvas.style.height = `${artboardHeight}px`;
          riveInstance.resizeDrawingSurfaceToCanvas();
          riveInstance.layout = new Layout({ fit });

          if (vmi) {
            // Dynamic discovery
            const props = vmi.properties || [];
            const enumPropMeta = props.filter(
              (p: VMProperty) =>
                (p.type as unknown as DataType) === DataType.enumType,
            );
            const boolPropMeta = props.filter(
              (p: VMProperty) =>
                (p.type as unknown as DataType) === DataType.boolean,
            );
            const triggerPropMeta = props.filter(
              (p: VMProperty) =>
                (p.type as unknown as DataType) === DataType.trigger,
            );

            if (enumPropMeta) {
              enumPropMeta.forEach((p: VMProperty) => {
                p.enums = vmi.enum(p.name)?.values;
              });
            }

            const currentEnumMeta = enumPropMeta || [];
            const currentBoolMeta = boolPropMeta || [];
            const currentTriggerMeta = triggerPropMeta || [];

            // Expose API via Jotai if interactive
            if (isInteractive) {
              setRiveApi({
                enumValues: currentEnumMeta,
                boolValues: currentBoolMeta,
                triggerValues: currentTriggerMeta,
                setEnum: (name, value) => {
                  const p = riveInstance?.viewModelInstance?.enum(name);
                  if (p) p.value = value;
                },
                setBool: (name, value) => {
                  const p = riveInstance?.viewModelInstance?.boolean(name);
                  if (p) p.value = value;
                },
                fireTrigger: (name) => {
                  riveInstance?.viewModelInstance?.trigger(name)?.trigger();
                },
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to load Rive:", error);
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (isInteractive) {
        setRiveApi(null);
      }
      if (riveInstance) {
        try {
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
  }, [src, buffer, className, isInteractive, setRiveApi]);

  return (
    <div
      ref={containerRef}
      className={cn(className, "relative overflow-hidden flex items-center justify-center")}
    >
      {!isLoaded && (
        <div className="bg-base-300 absolute inset-0 animate-pulse" />
      )}
    </div>
  );
};
