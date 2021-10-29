
// good sites explaining the power of least squares
// https://courses.physics.illinois.edu/cs357/sp2020/notes/ref-17-least-squares.html
// http://textbooks.math.gatech.edu/ila/least-squares.html
// https://www.cc.gatech.edu/classes/AY2016/cs4476_fall/results/proj3/html/cpaulus3/index.html

import { DotShader } from "Engine/render/shaders-old/dot-shader";
import { LineShader } from "Engine/render/shaders-old/line-shader";
import { App, Parameter, Random, MultiVector3, Camera, UI, MultiLine, Plane, Vector3, DrawSpeed, Matrix4, InputState, Scene, Domain3, FloatMatrix, Stat, DebugRenderer, MultiVector2, Circle2, Vector2, Circle3, Domain2 } from "Geon";

export class LeastSquaresCircleApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    points: Vector3[];

    // render
    scene: Scene;
    omni: DebugRenderer;
    ds: DotShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

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
        this.scene.camera.z_offset = -10;
        this.scene.camera.angleAlpha = Math.PI * 0.25;
        this.scene.camera.angleBeta = Math.PI * 0.25;
    }

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY(), 100, 2);
        this.omni.set(grid, "grid", [0.3,0.3,0.3,1]);
        
    }

    start() {
        this.startGrid();
        let seed = Math.random() * 100000;
        let someSeed = 49289.2005200531;
        let rng = Random.fromSeed(seed);
        console.log(seed);

        // this.points = Domain2.fromRadius(2).populate(10, rng).to3D().toList();
        this.lsa();
    }

    update(state: InputState) {
        // move the camera with the mouse
        this.scene.camera.update(state);

        if (state.mouseLeftPressed) {
            let ray = this.scene.camera.getMouseWorldRay(this.gl.canvas.width, this.gl.canvas.height, true);
            let point = ray.at(ray.xPlane(Plane.WorldXY()));
            this.points.push(point);
            this.lsa();
        }
        
    }

    draw(gl: WebGLRenderingContext) {
        this.omni.render(this.scene);
        this.ds.render(this.scene);
    }

    lsa() {
        this.ds.set(this.points, DrawSpeed.DynamicDraw);
        if (this.points.length < 5) {
            return;
        }

        // get MultiVector2
        let points2d = MultiVector2.new(this.points.length);
        for (let i = 0; i < this.points.length; i++) {
            points2d.set(i, this.points[i].toVector2());
        }

        // debug
        // let A = FloatMatrix.fromNative([[2, -1, 0],[4,3,-2], [1,3,4], [6,-1,4]]);
        let A = points2d.matrix;

        //

        // 
        // let inv = A.inv();
        // inv.print();

        // inv.mul(A).print();
        // let inv2 = matrix.inv2();
        
        
        
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


        // get a lsa circle
        let circle = Circle2.fromLSA(points2d);

        // fill the shaders with this new data
        
        this.omni.set(MultiLine.fromCircle(Circle3.fromCircle2(circle)), "circle", [1,0,1,1]);
    }
}
