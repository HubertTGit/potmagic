import { Rive } from "@rive-app/webgl2";
import { useEffect, useRef } from "react";

export function RiveCanvas() {
  const pixiRef = useRef<HTMLCanvasElement>(null);
  const riveRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let app: any;
    let riveInstance: Rive | null = null;
    let isCancelled = false;

    async function init() {
      if (!pixiRef.current || !riveRef.current) return;

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
        newApp.destroy(true, { children: true, texture: true });
        return;
      }

      app = newApp;

      await new Promise<void>((resolve) => {
        riveInstance = new Rive({
          src: "/fox.riv",
          canvas: riveRef.current!,
          autoplay: true,
          onLoad: () => resolve(),
        });
      });

      let riveWidth = 0;
      let riveHeight = 0;

      if (riveInstance && riveInstance.bounds) {
        const bounds = riveInstance.bounds;
        riveWidth = bounds.maxX - bounds.minX;
        riveHeight = bounds.maxY - bounds.minY;

        riveRef.current!.width = riveWidth;
        riveRef.current!.height = riveHeight;
        riveRef.current!.style.width = `${riveWidth}px`;
        riveRef.current!.style.height = `${riveHeight}px`;
        riveInstance.resizeDrawingSurfaceToCanvas();

        app.renderer.resize(500, 500);
      }

      if (isCancelled) return;

      const texture = Texture.from(riveRef.current);
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
        texture.source.update();
      });
    }

    init();

    return () => {
      isCancelled = true;
      if (app) {
        app.destroy(true, { children: true, texture: true });
      }
      if (riveInstance) {
        riveInstance.cleanup();
      }
    };
  }, []);

  // Using className or h-full / w-full logic so the element flexes with its parent correctly
  return (
    <>
      <canvas ref={pixiRef} />
      <canvas ref={riveRef} className="invisible" />
    </>
  );
}
