// dot-app3.ts
//
// author : Jos Feenstra
// purpose : test with Renderers, Domains & Vectors

import { App, ImageRenderer, Camera, UI, Bitmap, InputState, Scene, InputHandler } from "Geon";

export class UITestApp extends App {
    context: Scene;
    images: ImageRenderer;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.context = new Scene(new Camera(canvas));
        this.images = ImageRenderer.new(gl);
    }

    ui(ui: UI) {
        let canvas = ui.addElement("canvas", "duo-param-canvas") as HTMLCanvasElement;
        canvas.width = 400;
        canvas.height = 400;
    }

    start() {
        let img = new Bitmap(10, 10, 4);
        img.fill([255, 255, 255, 255]);
        this.images.add(img);
        this.images.buffer();
    }

    update(input: InputHandler) {
        // move the camera with the mouse
        this.context.camera.update(input);
    }

    draw() {
        this.images.render(this.context);
    }
}
