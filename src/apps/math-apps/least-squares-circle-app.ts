
// good sites explaining the power of least squares
// https://courses.physics.illinois.edu/cs357/sp2020/notes/ref-17-least-squares.html
// http://textbooks.math.gatech.edu/ila/least-squares.html
// https://www.cc.gatech.edu/classes/AY2016/cs4476_fall/results/proj3/html/cpaulus3/index.html

import { LSA } from "Engine/math/LSA";
import { DotShader } from "Engine/render/shaders-old/dot-shader";
import { LineShader } from "Engine/render/shaders-old/line-shader";
import { App, Parameter, Random, MultiVector3, Camera, UI, MultiLine, Plane, Vector3, DrawSpeed, Matrix4, InputState, Scene, Domain3, FloatMatrix, Stat, DebugRenderer, MultiVector2, Circle2, Vector2, Circle3, Domain2, InputHandler } from "Geon";

export class LeastSquaresCircleApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    points: Vector3[];

    // render
    scene: Scene;
    omni: DebugRenderer;
    ds: DotShader;
    dsYellow: DotShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        this.points = [];

        let canvas = gl.canvas as HTMLCanvasElement;
        let camera = new Camera(canvas, 10, true);
        this.scene = new Scene(camera);
        this.omni = DebugRenderer.new(gl);
        this.ds = new DotShader(gl)
        this.dsYellow = new DotShader(gl, 10, [0,1,1,1], false);
    }

    ui(ui: UI) {
        let button = Parameter.newBoolean("remove outliers", false);
        let error = Parameter.new("max allowed error", 10, 0.5, 100);
        // ui.addBooleanParameter(button);
        // ui.addParameter(error);
        this.params.push(button, error);
    }

    resetCamera() {
        this.scene.camera.zoom = -10;
        this.scene.camera.angleAlpha = Math.PI * 0.25;
        this.scene.camera.angleBeta = Math.PI * 0.25;
    }

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY(), 100, 1);
        this.omni.set(grid, "grid", [0.3,0.3,0.3,1]);
        
    }

    start() {
        this.startGrid();
        let seed = Math.random() * 100000;
        let someSeed = 49289.2005200531;
        let rng = Random.fromSeed(seed);
        console.log(seed);

        // this.points = Domain2.fromRadius(2).populate(10, rng).to3D().toList();
        let useOutlierRemoval = this.params[0].get() == 1;
        let maxError = this.params[1].get();
        this.lsa(useOutlierRemoval, maxError);
    }

    update(input: InputHandler) {
        // move the camera with the mouse
        this.scene.camera.update(input);

        if (input.mouse?.leftDown || (input.touch && input.touch.down > 0)) {
            let ray = this.scene.camera.getMouseWorldRay(this.gl.canvas.width, this.gl.canvas.height, true);
            let point = ray.at(ray.xPlane(Plane.WorldXY()));
            this.points.push(point);
            this.lsa();
        }
        
    }

    draw() {
        this.omni.render(this.scene);
        this.ds.render(this.scene);
        this.dsYellow.render(this.scene);
    }

    lsa(progressive=false, maxError=5) {
        this.ds.set(this.points, DrawSpeed.StaticDraw);
        if (this.points.length < 5) {
            return;
        }

        let plane = Plane.WorldXY();
        let points2d = MultiVector2.fromList(this.points.map((p) => plane.pullToPlane(p).to2D()));

        if (progressive) {
            let results = LSA.circle2Progressive(points2d, maxError);
            if (!results) {
                return;
            }
            let {circle, included, excluded} = results;

            this.omni.set(MultiLine.fromCircle(Circle3.fromCircle2(circle)), "circle", [1,0,1,1]);
            this.dsYellow.set(included, DrawSpeed.StaticDraw)
            this.ds.set(excluded, DrawSpeed.StaticDraw);
        } else {
            let circle = Circle2.fromLSA(points2d);
            this.omni.set(MultiLine.fromCircle(Circle3.fromCircle2(circle, )), "circle", [1,0,1,1]);
        }
    }
}




function test() {



    // matrix.print();
    // A.intb().mul(inv.mul(matrix)).print();

    // inv.mul(matrix).print();
    // inv2.mul(matrix).print();

    // let vec = FloatMatrix.fromNative([[1,0],[0,1]]);
    // vec.print();
    // matrix.mul(vec).print();
    

    // let pinv = matrix.inv();
    // console.log(pinv);
    // pinv.print();

    // let result = matrix.mul(pinv);
    // result.print();

}