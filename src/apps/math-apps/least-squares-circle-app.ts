
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
        this.dsYellow.render(this.scene);
    }

    lsa() {
        this.ds.set(this.points, DrawSpeed.StaticDraw);
        if (this.points.length < 5) {
            return;
        }

        // get MultiVector2

        let points2d = this.points.map((p) => p.toVector2());


        // get a lsa circle
        let results = progLSACircle(points2d, 4);
        if (!results) {
            return;
        }
        let {circle, included, excluded} = results;
        // fill the shaders with this new data
        
        this.omni.set(MultiLine.fromCircle(Circle3.fromCircle2(circle)), "circle", [1,0,1,1]);
        // this.dsYellow.set(included, DrawSpeed.StaticDraw)
        // this.ds.set(included, DrawSpeed.StaticDraw);
    }




}


function progLSACircle(included: Vector2[], maxDeviation: number, maxIterations=1000) : {circle: Circle2, included: Vector2[], excluded: Vector2[]} | undefined {
    
    let getIdWithLargestError = (circle: Circle2, points2d: MultiVector2) => {
        
        let highscore = 0;
        let highscoreId = -1;
        for (let i = 0 ; i < points2d.count; i++) {
            let p = points2d.get(i);
            let score = Math.abs(circle.distanceSquared(p));
            if (score > highscore) {
                highscore = score;
                highscoreId = i;
            }
        }
        return [highscore, highscoreId];
    }

    let excluded: Vector2[] = [];
    let points2d = MultiVector2.fromList(included);

    for (let i = 0; i < maxIterations; i++) {
        
        // console.log(included);
        let stop = true;

        // get a circle using all `points`
        
        let circle = Circle2.fromLSA(points2d);
        // empty `points, and fill it with only the points kept in range`
        let [largestError, largestID] = getIdWithLargestError(circle, points2d);
        if (largestError > maxDeviation) {
            excluded.push(points2d.get(largestID));
            points2d = points2d.remove([largestID]);
            stop = false;
            continue;
        }

        // if we arrive here, all errors are smaller than the max-deviation. We are done!
        return {circle, included, excluded};
        
    }
    console.error("MAX CIRCLE ITERATIONS REACHED!");
    return undefined;
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