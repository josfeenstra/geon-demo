import { DotShader } from "Engine/render/shaders-old/dot-shader";
import { LineShader } from "Engine/render/shaders-old/line-shader";
import { MeshDebugShader } from "Engine/render/shaders-old/mesh-debug-shader";
import { App, Parameter, Vector3, MultiLine, Camera, Random, UI, Domain2, BezierSquare, Plane, DrawSpeed, InputState, Scene, InputHandler } from "Geon";

export class SurfaceApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    seed: number;
    dots: Vector3[];
    lines: MultiLine[];

    // render
    camera: Camera;
    lrGrid: LineShader;
    lrRed: LineShader;
    mr: MeshDebugShader;
    drBlue: DotShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.setState([21.926, 11.337, -10.04, -10, 1.12, 1.08]);

        this.seed = Random.randomSeed();
        this.dots = [];
        this.lines = [];

        this.drBlue = new DotShader(gl, 10, [0, 0, 1, 1], false);
        this.lrRed = new LineShader(gl, [1, 0, 0, 1]);
        this.lrGrid = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.mr = new MeshDebugShader(gl, [1, 0, 0, 0.5], [1, 1, 1, 0.5]);
    }

    ui(ui: UI) {
        this.params.push(Parameter.new("degree", 3, 2, 6, 1));
        ui.addParameter(this.params[0], this.start.bind(this));
        this.params.push(Parameter.new("displace", 4, 0, 10, 0.001));
        ui.addParameter(this.params[1], this.start.bind(this));
        this.params.push(Parameter.new("detail", 50, 2, 100, 1));
        ui.addParameter(this.params[2], this.start.bind(this));
        // this.params.push(Parameter.new("select", 0, 0, 20, 1));
        // ui.addParameter(this.params[3], this.start.bind(this));
    }

    start() {
        // create a base grid
        this.startGrid();

        // get all parameters
        let degree = this.params[0].get();
        let displace = this.params[1].get();
        let detail = this.params[2].get();
        // let select = this.params[3].get();

        // get some points
        let rng = Random.fromSeed(this.seed);
        let vecs = Domain2.fromRadius(-11) // span a (-size to size)**2 domain
            .offset([-22, 22, 0, 0]) // flip it
            .spawn(degree + 1, degree + 1) // spawn a bunch of points, the exact amound needed for the surface
            .to3D()
            .forEach((v) => {
                return v
                    .add(Vector3.fromRandomUnit(rng).scale(displace))
                    .add(Vector3.unitZ().scale(5)); // and displace them slightly
            });

        // create a surface from it
        let surface = BezierSquare.new(vecs, degree, degree)!;
        this.drBlue.set(vecs);

        // lines
        this.lines = [];
        // this.lines.push(Circle3.newPlanar(vecs.get(select), 1).buffer());

        // mesh
        // this.drBlue.set(surface.buffer(detail, detail).verts);
        this.mr.set(surface.buffer(detail, detail).ToShaderMesh());
    }

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY(), 100, 2);
        this.lrGrid.set(grid, DrawSpeed.StaticDraw);
    }

    update(input: InputHandler) {
        this.camera.update(input);
    }

    draw() {
        let c = new Scene(this.camera);

        this.lrRed.setAndRender(MultiLine.fromJoin(this.lines), c);
        this.drBlue.render(c);
        this.lrGrid.render(c);
        this.mr.render(c);
    }
}
