// dot-app3.ts
//
// author : Jos Feenstra
// purpose : test with Renderers, Domains & Vectors

import { App, ImageRenderer, Camera, UI, Texture, InputState, Scene } from "Geon";

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
        let img = new Texture(10, 10, 4);
        img.fill([255, 255, 255, 255]);
        this.images.add(img);
        this.images.buffer();
    }

    update(state: InputState) {
        // move the camera with the mouse
        this.context.camera.update(state);

        if (state.mouseLeftPressed) {
        }
    }

    draw(gl: WebGLRenderingContext) {
        this.images.render(this.context);
    }
}
