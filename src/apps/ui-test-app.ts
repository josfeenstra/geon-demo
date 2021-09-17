// dot-app3.ts
//
// author : Jos Feenstra
// purpose : test with Renderers, Domains & Vectors

import {
    Domain3,
    DotShader,
    Camera,
    Vector3,
    InputState,
    Matrix4,
    App,
    UI,
    ImageRenderer,
    GeonImage,
    Context,
    Parameter,
} from "Geon";
import { DuoParameter } from "Engine/ui/duo-parameter";

export class UITestApp extends App {
    context: Context;
    images: ImageRenderer;

    param!: DuoParameter;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.context = new Context(new Camera(canvas));
        this.images = ImageRenderer.new(gl);
    }

    ui(ui: UI) {
        let canvas = ui.addElement("canvas", "duo-param-canvas") as HTMLCanvasElement;
        canvas.width = 400;
        canvas.height = 400;

        this.param = DuoParameter.new(
            canvas,
            new Parameter("x", 0, 0, 1, 0.01),
            new Parameter("y", 0, 0, 1, 0.01),
        );
    }

    start() {
        let img = new GeonImage(10, 10, 4);
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
