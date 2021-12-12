// author : Jos Feenstra
// purpose : test with Renderers, Domains & Vectors

import { DotShader } from "Engine/render/shaders-old/dot-shader";
import { App, Vector2, Domain2, Scene, Camera, Random, InputState, InputHandler } from "Geon";


export class DotApp2 extends App {
    dots: Vector2[] = [];
    dirs: Vector2[] = [];

    bounds: Domain2;
    renderer: DotShader;
    context: Scene;

    // unique constructors
    constructor(gl: WebGLRenderingContext) {
        super(gl);
        let canvas = gl.canvas as HTMLCanvasElement;
        this.bounds = Domain2.fromBounds(0, 500, 0, 500);
        this.renderer = new DotShader(gl, 5, [1, 1, 1, 1], true);
        this.context = new Scene(new Camera(canvas, 1, false));
    }

    start() {
        // additional setup of state
        let normrange = 5;
        let count = 10;
        let rng = Random.fromSeed(1234);
        const normSpace = Domain2.fromBounds(-normrange, normrange, -normrange, normrange);

        for (let i = 0; i < count; i++) {
            this.dots.push(this.bounds.elevate(Vector2.fromRandom(rng)));
            this.dirs.push(normSpace.elevate(Vector2.fromRandom(rng)));
        }
    }

    update(input: InputHandler) {
        for (let i = 0; i < this.dots.length; i++) {
            // these 'should' be pointers, but check this
            let dot = this.dots[i];
            let dir = this.dirs[i];

            // bounce of the edges
            if (!this.bounds.x.includes(dot.x)) dir.x = -dir.x;
            if (!this.bounds.y.includes(dot.y)) dir.y = -dir.y;

            dot.add(dir);
        }
    }

    draw() {
        this.renderer.render(this.context);
    }
}
