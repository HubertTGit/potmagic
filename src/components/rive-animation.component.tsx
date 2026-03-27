import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { ViewModelProperty } from "@rive-app/webgl2/rive_advanced.mjs";

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
  const [enumValues, setEnumValues] = useState<VMProperty[]>([]);
  const [boolValues, setBoolValues] = useState<VMProperty[]>([]);
  const [triggerValues, setTriggerValues] = useState<VMProperty[]>([]);

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
          autoBind: true,
          stateMachines: "pmStateMachine",
          layout: new Layout({ fit }),
          onLoad: () => {
            if (!isCancelled) {
              setIsLoaded(true);
              // Ensure drawing surface matches initial size
              riveInstance?.resizeDrawingSurfaceToCanvas();
            }
          },
        });

        if (riveInstance) {
          const vmi = riveInstance.viewModelInstance;

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

              setEnumValues(enumPropMeta);
            }

            if (boolPropMeta) {
              setBoolValues(boolPropMeta);
            }

            if (triggerPropMeta) {
              setTriggerValues(triggerPropMeta);
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
