import { useEffect, useRef } from "react";

export function RiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function initPixi() {
      // Dynamic import prevents 'navigator is not defined' SSR errors
      const { Application, Assets } = await import("pixi.js");
      const { RiveSprite, Fit, Alignment } = await import("@qva/pixi-rive");

      const app = new Application();
      await app.init({
        canvas: canvasRef.current,
        backgroundAlpha: 0, // Transparent background for Rive animation
        resizeTo: canvasRef.current.parentElement || window,
      });

      Assets.load(
        "https://za89zydjitp7xtkq.public.blob.vercel-storage.com/props/fox.riv",
      ).then((riveFile) => {
        const riveSprite = new RiveSprite({
          asset: riveFile,
          autoPlay: true,
          debug: true,
          onReady: () => {
            console.log("Rive animation ready!");
          },
        });

        app.stage.addChild(riveSprite);
      });
    }

    initPixi();

    return () => {
      if (app) {
        app.destroy(true, { children: true, texture: true });
      }
    };
  }, []);

  // Using className or h-full / w-full logic so the element flexes with its parent correctly
  return (
    <>
      <canvas ref={canvasRef} className="h-1/4 w-1/4" />
    </>
  );
}
