import { Rive, ViewModelInstance } from "@rive-app/webgl2";
import { useEffect, useRef } from "react";

export function RiveCanvas({ src }: { src: string }) {
  const pixiRef = useRef<HTMLCanvasElement>(null);
  const riveAppRef = useRef<any>(null);
  const vmiRef = useRef<ViewModelInstance>(null);

  useEffect(() => {
    let app: any;
    let riveInstance: Rive | null = null;
    let isCancelled = false;
    let riveCanvas: HTMLCanvasElement | null = null;

    async function init() {
      if (!pixiRef.current) return;

      const [{ Application, Sprite, Texture }, { Rive }] = await Promise.all([
        import("pixi.js"),
        import("@rive-app/webgl2"),
      ]);

      if (isCancelled) return;

      const newApp = new Application();
      await newApp.init({
        canvas: pixiRef.current,
        backgroundAlpha: 0,
      });

      if (isCancelled) {
        newApp.destroy(false, { children: true, texture: true });
        return;
      }

      app = newApp;

      riveCanvas = document.createElement("canvas");
      // Required for WebGL internal buffering and offscreen frame tracking limits
      riveCanvas.style.position = "absolute";
      riveCanvas.style.visibility = "hidden";
      riveCanvas.style.pointerEvents = "none";
      document.body.appendChild(riveCanvas);

      await new Promise<void>((resolve) => {
        riveInstance = new Rive({
          src,
          canvas: riveCanvas!,
          autoplay: true,
          autoBind: true,
          stateMachines: "pmStateMachine",
          onLoad: () => resolve(),
        });
      });

      riveAppRef.current = riveInstance;

      if (riveInstance) {
        const vmi = (riveInstance as any).viewModelInstance;
        if (vmi) {
          vmiRef.current = vmi;
          const enumProp = vmi.enum("enumProperty");
          if (enumProp) enumProp.value = "talk";

          const singBool = vmi.boolean("singBool");
          if (singBool) singBool.value = true;
          console.log("Found VMI through viewModelInstance property:", vmi);
        } else {
          // Fallback to manual lookup if property getter fails
          const vm = (riveInstance as any).viewModelByIndex?.(0);
          const vmiFallback = vm?.instance();
          if (vmiFallback) {
            vmiRef.current = vmiFallback;
            const enumProp = vmiFallback.enum("enumProperty");
            if (enumProp) enumProp.value = "talk";

            const singBool = vmiFallback.boolean("singBool");
            if (singBool) singBool.value = true;
            console.log("Found VMI through fallback manual lookup:", vmiFallback);
          }
        }
      }

      let riveWidth = 0;
      let riveHeight = 0;

      if (riveInstance && riveInstance.bounds) {
        const bounds = riveInstance.bounds;
        riveWidth = bounds.maxX - bounds.minX;
        riveHeight = bounds.maxY - bounds.minY;

        riveCanvas.width = riveWidth;
        riveCanvas.height = riveHeight;
        riveCanvas.style.width = `${riveWidth}px`;
        riveCanvas.style.height = `${riveHeight}px`;
        riveInstance.resizeDrawingSurfaceToCanvas();
        riveInstance.startRendering();

        app.renderer.resize(500, 500);
      }

      if (isCancelled) return;

      const texture = Texture.from(riveCanvas);
      const sprite = new Sprite(texture);

      if (riveWidth && riveHeight) {
        sprite.width = riveWidth;
        sprite.height = riveHeight;
      }

      sprite.anchor.set(0.5);
      sprite.x = app.screen.width / 2;
      sprite.y = app.screen.height / 2;

      app.stage.addChild(sprite);

      app.ticker.add(() => {
        if (riveCanvas && riveCanvas.width > 0 && riveCanvas.height > 0) {
          texture.source.update();
        }
      });
    }

    init();

    return () => {
      isCancelled = true;
      if (app) {
        app.destroy(false, { children: true, texture: true });
      }
      if (riveInstance) {
        riveInstance.cleanup();
      }
      if (riveCanvas && riveCanvas.parentNode) {
        document.body.removeChild(riveCanvas);
      }
    };
  }, [src]);

  // Using className or h-full / w-full logic so the element flexes with its parent correctly
  return (
    <div className="flex flex-col items-center justify-center">
      <canvas ref={pixiRef} />
      <div>
        <button
          className="btn btn-primary mr-2"
          onClick={() => {
            const prop = vmiRef.current?.enum("enumProperty");
            if (prop) prop.value = "talk";
          }}
        >
          Talk
        </button>
        <button
          className="btn btn-primary mr-2"
          onClick={() => {
            const prop = vmiRef.current?.enum("enumProperty");
            if (prop) prop.value = "laugh";
          }}
        >
          Laugh
        </button>
        <button
          className="btn btn-primary mr-2"
          onClick={() => {
            const prop = vmiRef.current?.enum("enumProperty");
            if (prop) prop.value = "blink";
          }}
        >
          Blink
        </button>
        <button
          className="btn btn-primary mr-2"
          onClick={() => {
            const prop = vmiRef.current?.enum("enumProperty");
            if (prop) prop.value = "normal";
          }}
        >
          Idle
        </button>
        <label className="mt-4 flex cursor-pointer items-center gap-2">
          <span className="label-text">Dance</span>
          <input
            type="checkbox"
            className="toggle"
            onChange={(e) => {
              const boolProp = vmiRef.current?.boolean("singBool");
              if (boolProp) boolProp.value = e.target.checked;
            }}
          />
        </label>
      </div>
    </div>
  );
}
