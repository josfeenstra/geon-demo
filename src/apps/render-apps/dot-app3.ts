// dot-app3.ts
//
// author : Jos Feenstra
// purpose : test with Renderers, Domains & Vectors

import { DotShader } from "Engine/render/shaders-old/dot-shader";
import { App, Vector3, Domain3, Camera, Random, InputState, Scene, Matrix4, InputHandler } from "Geon";

export class DotApp3 extends App {
    dots: Vector3[] = [];
    dirs: Vector3[] = [];

    bounds: Domain3;
    whiteDotRend: DotShader;
    redDotRend: DotShader;
    camera: Camera;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        let n = 1;
        this.bounds = Domain3.fromBounds(-n, n, -n, n, -n, n);
        this.whiteDotRend = new DotShader(gl, 10, [1, 1, 1, 1], false);
        this.redDotRend = new DotShader(gl, 10, [1, 0, 0, 1], false);
        this.camera = new Camera(canvas);
    }

    start() {
        this.spawnSome(100, 0.001);
    }

    spawnSome(count: number, normrange: number) {
        const normSpace = Domain3.fromBounds(
            -normrange,
            normrange,
            -normrange,
            normrange,
            -normrange,
            normrange,
        );

        let rng = Random.fromRandom();
        for (let i = 0; i < count; i++) {
            this.dots.push(this.bounds.elevate(Vector3.fromRandom(rng)));
            this.dirs.push(normSpace.elevate(Vector3.fromRandom(rng)));
        }
    }

    update(input: InputHandler) {
        // move the camera with the mouse
        this.camera.update(input);

        if (input.mouse?.leftPressed || input.touch?.tab) {
            this.spawnSome(100, 0.001);
        }

        // update the position of all dots
        for (let i = 0; i < this.dots.length; i++) {
            // this gives us a pointer apparantly
            let dot = this.dots[i];
            let dir = this.dirs[i];

            // bounce of the edges
            if (!this.bounds.x.includes(dot.x)) dir.x = -dir.x;
            if (!this.bounds.y.includes(dot.y)) dir.y = -dir.y;
            if (!this.bounds.z.includes(dot.z)) dir.z = -dir.z;

            // update position
            dot.add(dir);
        }
    }

    draw() {
        // get to-screen matrix
        let c = new Scene(this.camera);

        // render the corners of the box with the red renderer,
        // and the dots themselves with the white renderer
        this.redDotRend.setAndRender(this.bounds.corners(Matrix4.newIdentity()), c);
        this.whiteDotRend.setAndRender(this.dots, c);
    }
}
