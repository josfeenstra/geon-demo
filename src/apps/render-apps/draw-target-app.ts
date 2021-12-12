import { Material } from "Engine/render/basics/Material";
import { Model } from "Engine/render/basics/Model";
import { LineShader } from "Engine/render/shaders-old/line-shader";
import { PhongShader } from "Engine/render/shaders/PhongShader";
import { App, Parameter, MultiVector3, Camera, DebugRenderer, UI, MultiLine, Plane, Vector3, DrawSpeed, InputState, Scene, Mesh, Matrix4, Domain3, Domain2, Cube, Entity, DrawTarget, TextureMeshShader, TexturedMeshShader, ShaderMesh, Rectangle3, InputHandler } from "Geon";

export class DrawTargetApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    entity: Entity;
    scene: Scene;

    // render
    ts: TexturedMeshShader;
    ps: PhongShader;
    gs: LineShader;
    drawTarget: DrawTarget;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;

        this.gs = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.ts = new TexturedMeshShader(gl);
        this.ps = PhongShader.new(gl);
        this.entity = Entity.new();

        this.drawTarget = DrawTarget.createAndBind(gl, canvas.width, canvas.height);
        // this.drawTarget.unbind(gl);

        let camera = new Camera(canvas, -2, true);
        camera.set(-50, 1, 1);
        this.scene = new Scene(camera);
    }

    start() {
        this.startGrid();
        this.entity.model.mesh = this.entity.model.mesh.toLinearMesh();
        let m = this.entity.model.mesh;
        m.calcAndSetVertexNormals();
        m.ensureUVs();
        this.ps.load(this.entity, DrawSpeed.StaticDraw);
    }

    ui(ui: UI) {
        ui.add3DParameter("sun", Domain3.fromRadius(5), 0.01, this.scene.sun.pos);
    }

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(new Vector3(0, 0, -1)), 100, 2);
        this.gs.set(grid, DrawSpeed.StaticDraw);
        this.ts.load(Mesh.fromRectDoubleSided(Rectangle3.new(Plane.WorldYZ().moveTo(Vector3.new(3,0,3)), Domain2.fromRadius(4))))
    }

    update(input: InputHandler) {
        this.scene.camera.update(input);
        let r = 0.0005 * input.time.tick;
        this.entity.position.multiply(Matrix4.newYRotation(r));
        this.entity.position.multiply(Matrix4.newZRotation(-r));
        this.entity.position.multiply(Matrix4.newXRotation(r));
        this.ps.loadPosition(this.entity.position);
    }

    draw() {
        
        // unload to prevent a cyclical pattern
        this.ts.loadTexture(this.drawTarget.width, this.drawTarget.height, null);

        // set a texture
        this.drawTarget.bind(this.gl);

        this.gs.render(this.scene);
        this.ts.draw(this.scene);
        this.ps.draw(this.scene);

        this.drawTarget.unbind(this.gl);

        this.ts.loadTexture(this.drawTarget.width, this.drawTarget.height, this.drawTarget.texture);

        this.gs.render(this.scene);
        this.ts.draw(this.scene);
        this.ps.draw(this.scene);
    }
}
