import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
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

export interface RiveRef {
  enumValues: VMProperty[];
  boolValues: VMProperty[];
  triggerValues: VMProperty[];
  setEnum: (name: string, value: string) => void;
  setBool: (name: string, value: boolean) => void;
  fireTrigger: (name: string) => void;
}

/**
 * RiveAnimation component with implicit canvas creation.
 * Creates the canvas element via document.createElement for isolated WebGL lifecycle management.
 * Uses the vanilla @rive-app/webgl2 API for maximum stability with dynamic imports.
 */
export const RiveAnimation = forwardRef<
  RiveRef,
  {
    src?: string | null;
    buffer?: ArrayBuffer;
    className?: string;
    onPropertiesLoaded?: (props: {
      enumValues: VMProperty[];
      boolValues: VMProperty[];
      triggerValues: VMProperty[];
    }) => void;
  }
>((props, ref) => {
  // Be extremely defensive against null props
  if (!props) return null;

  const { src, buffer, className, onPropertiesLoaded } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const riveInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [enumValues, setEnumValues] = useState<VMProperty[]>([]);
  const [boolValues, setBoolValues] = useState<VMProperty[]>([]);
  const [triggerValues, setTriggerValues] = useState<VMProperty[]>([]);

  useImperativeHandle(ref, () => ({
    enumValues,
    boolValues,
    triggerValues,
    setEnum: (name, value) => {
      const vmi = riveInstanceRef.current?.viewModelInstance;
      if (vmi) {
        const p = vmi.enum(name);
        if (p) p.value = value;
      }
    },
    setBool: (name, value) => {
      const vmi = riveInstanceRef.current?.viewModelInstance;
      if (vmi) {
        const p = vmi.boolean(name);
        if (p) p.value = value;
      }
    },
    fireTrigger: (name) => {
      const vmi = riveInstanceRef.current?.viewModelInstance;
      if (vmi) vmi.trigger(name)?.trigger();
    },
  }));

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

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

        riveInstanceRef.current = new Rive({
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
              riveInstanceRef.current?.resizeDrawingSurfaceToCanvas();
            }
          },
        });

        if (riveInstanceRef.current) {
          const vmi = riveInstanceRef.current.viewModelInstance;

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

            if (onPropertiesLoaded) {
              onPropertiesLoaded({
                enumValues: enumPropMeta || [],
                boolValues: boolPropMeta || [],
                triggerValues: triggerPropMeta || [],
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
      if (riveInstanceRef.current) {
        try {
          riveInstanceRef.current.cleanup();
          riveInstanceRef.current = null;
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
});
