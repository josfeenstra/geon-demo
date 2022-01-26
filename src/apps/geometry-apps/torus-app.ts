import { Material } from "Engine/render/basics/Material";
import { Model } from "Engine/render/basics/Model";
import { LineShader } from "Engine/render/shaders-old/line-shader";
import { PhongShader } from "Engine/render/shaders/PhongShader";
import { App, Parameter, MultiVector3, Camera, DebugRenderer, UI, MultiLine, Plane, Vector3, DrawSpeed, InputState, Scene, Mesh, Matrix4, Domain3, Domain2, Cube, Entity, InputHandler, Quaternion } from "Geon";

export class TorusApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    points!: MultiVector3;
    Plsa!: MultiVector3;
    Pnormal!: MultiVector3;

    // render
    dr: DebugRenderer;
    ps: PhongShader;
    gs: LineShader;
    entity: Entity;
    scene: Scene;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;

        this.gs = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.dr = DebugRenderer.new(gl);
        this.ps = PhongShader.new(gl);
        this.entity = Entity.new(undefined, Model.new(undefined, Material.newPurple()));

        let camera = new Camera(canvas, -2, true);
        camera.set(-50, 1, 1);
        this.scene = new Scene(camera);
    }

    start() {
        this.startGrid();
        let mesh = Mesh.newTorus(5, 1, 30, 20);

        mesh.ensureUVs();

        this.entity.model.mesh = mesh;
        this.ps.load(this.entity, DrawSpeed.StaticDraw);
        // create something!
    }

    ui(ui: UI) {
        ui.add3DParameter("sun", Domain3.fromRadius(5), 0.01, this.scene.sun.pos);
    }

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(new Vector3(0, 0, -1)), 100, 2);
        this.gs.set(grid, DrawSpeed.StaticDraw);
    }

    r = 0;

    update(input: InputHandler) {
        this.scene.camera.update(input);
        this.r += 0.0005 * input.time.tick;
        this.entity.xform.rot.setEuler(this.r, -this.r, this.r);
        this.ps.loadTransform(this.entity.xform);
    }

    draw() {
        
        this.gs.render(this.scene);
        this.dr.render(this.scene);
        this.ps.draw(this.scene);
    }
}
