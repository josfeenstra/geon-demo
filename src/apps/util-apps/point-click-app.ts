
// good sites explaining the power of least squares
// https://courses.physics.illinois.edu/cs357/sp2020/notes/ref-17-least-squares.html
// http://textbooks.math.gatech.edu/ila/least-squares.html
// https://www.cc.gatech.edu/classes/AY2016/cs4476_fall/results/proj3/html/cpaulus3/index.html

import { DotShader } from "Engine/render/shaders-old/dot-shader";
import { LineShader } from "Engine/render/shaders-old/line-shader";
import { App, Parameter, Random, MultiVector3, Camera, UI, MultiLine, Plane, Vector3, DrawSpeed, Matrix4, InputState, Scene, Domain3, FloatMatrix, Stat, DebugRenderer, MultiVector2, InputHandler } from "Geon";

export class PointClickApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    rng: Random;
    points: Vector3[];

    // render
    scene: Scene;
    omni: DebugRenderer;
    ds: DotShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        this.rng = Random.fromSeed(1234);
        this.points = [];

        let canvas = gl.canvas as HTMLCanvasElement;
        let camera = new Camera(canvas, 10, true);
        this.scene = new Scene(camera);
        this.omni = DebugRenderer.new(gl);
        this.ds = new DotShader(gl)
    }

    ui(ui: UI) {

    }

    resetCamera() {
        this.scene.camera.zoom = -10;
        this.scene.camera.angleAlpha = Math.PI * 0.25;
        this.scene.camera.angleBeta = Math.PI * 0.25;
    }

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY(), 100, 2);
        this.omni.set(grid, "grid", [0.3,0.3,0.3,1]);
        
    }

    start() {
        this.startGrid();
    }

    update(input: InputHandler) {
        // move the camera with the mouse
        this.scene.camera.update(input);

        if (input.mouse?.leftPressed) {
            let ray = this.scene.camera.getMouseWorldRay(this.gl.canvas.width, this.gl.canvas.height, true);
            let point = ray.at(ray.xPlane(Plane.WorldXY()));
            this.points.push(point);
            this.ds.set(this.points, DrawSpeed.DynamicDraw);
        }
        
    }

    draw() {
        this.omni.render(this.scene);
        this.ds.render(this.scene);
    }
}
