// name:    shapes-app.ts
// author:  Jos Feenstra
// purpose: test creation of basic mesh shapes. Test UI

import { Color } from "Engine/image/Color";
import { Material } from "Engine/render/basics/Material";
import { Model } from "Engine/render/basics/Model";
import { DotShader } from "Engine/render/shaders-old/dot-shader";
import { LineShader } from "Engine/render/shaders-old/line-shader";
import { MeshDebugShader } from "Engine/render/shaders-old/mesh-debug-shader";
import { ShadedMeshShader } from "Engine/render/shaders-old/shaded-mesh-shader";
import { AmbientMeshShader } from "Engine/render/shaders/AmbientMeshShader";
import { PhongShader } from "Engine/render/shaders/PhongShader";
import { App, Camera, Plane, MultiLine, ShaderMesh, Parameter, EnumParameter, UI, Vector3, Mesh, Scene, DrawSpeed, Matrix4, Entity, InputHandler } from "Geon";


export class MeshInspectorApp extends App {
    // renderinfo
    camera: Camera;
    dotRenderer: DotShader;
    lineRenderer: LineShader;
    meshRenderer: MeshDebugShader;
    shadedMeshRenderer: ShadedMeshShader;
    ams: AmbientMeshShader;

    // geo data
    plane: Plane = Plane.WorldXY();
    grid?: MultiLine;
    geo: ShaderMesh[] = [];

    // logic data
    size = 10;
    cellSize = 0.5;

    distance = new Parameter("distance", 3.0, 0, 4.0, 0.01);
    radius = new Parameter("radius", 1.0, 0, 4.0, 0.01);
    detail = new Parameter("detail", 5, 0, 100, 1);
    shademethod = EnumParameter.new("render method", 3, ["debug", "vertex shaded", "face shaded", "ambient only"]);

    constructor(gl: WebGLRenderingContext) {
        // setup render env
        super(gl);
        let canvas = gl.canvas as HTMLCanvasElement;

        // TODO abstract this to scene
        this.camera = new Camera(canvas, undefined, true);
        this.camera.zoom = -10;
        this.camera.angleAlpha = 0.4;
        this.camera.angleBeta = 0.5;

        this.dotRenderer = new DotShader(gl, 4, [0, 1, 0, 1]);
        this.meshRenderer = new MeshDebugShader(gl, [0.6, 0, 0, 1], [1, 0, 0, 1]);
        this.lineRenderer = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.shadedMeshRenderer = new ShadedMeshShader(gl);
        this.ams = new AmbientMeshShader(gl);

    }

    ui(ui: UI) {
        // TODO : think of a system that ties parameter & slider together fully

        ui.addParameter(this.radius, (value) => {
            this.start();
        });

        ui.addParameter(this.distance, (value) => {
            this.start();
        });

        ui.addParameter(this.detail, (value) => {
            this.start();
        });

        // render methods
        ui.addParameter(this.shademethod, (val) => {
            this.start();
        });
    }

    start() {
        let grid = MultiLine.fromGrid(
            this.plane.clone().moveTo(new Vector3(0, 0, -this.radius.get())),
            100,
            2,
        );
        let spherePerRing = this.detail.get() * 2;

        let rad = this.radius.get();
        let dis = this.distance.get();
        let det = this.detail.get();

        let mesh = Mesh.fromJoin([
            Mesh.newSphere(
                new Vector3(dis, 0, 0),
                this.radius.get(),
                this.detail.get(),
                spherePerRing,
            ),
            // PureMesh.fromCube(new Cube(this.plane, Domain3.fromRadius(this.radius.get()))),
            Mesh.newCone(
                new Vector3(-dis, 0, -this.radius.get()),
                this.radius.get(),
                this.radius.get() * 2,
                spherePerRing,
            ),
            Mesh.newCylinder(new Vector3(0, 0, -rad), new Vector3(0, 0, rad), rad, det),
        ]);
        let rend = mesh.ToShaderMesh();
        rend.calculateVertexNormals();

        // TODO abstract this to scene
        console.log("normal type", rend.getNormalType());

        switch(this.shademethod.get()) {
            case 0:
                this.meshRenderer.set(rend);
                break;
            case 1:
                this.shadedMeshRenderer.set(rend);
                break;
            case 2:
                rend.calculateFaceNormals();
                this.shadedMeshRenderer.set(rend);
                break;
            case 3:
                this.ams.load(rend.mesh, DrawSpeed.StaticDraw);
                break;
            case 4:
                let model = Model.new(rend.mesh, Material.default()).spawn();
                break;
            default:
                break;
        }

        this.lineRenderer.set(grid);
        // this.dotRenderer.set(mesh.verts, DrawSpeed.StaticDraw);
    }

    update(input: InputHandler) {
        // move the camera with the mouse
        this.camera.update(input);
    }

    draw() {
        // TODO abstract this to 'scene'
        let c = new Scene(this.camera);
        this.dotRenderer.render(c);

        switch (this.shademethod.get()) {
            case 0:
                this.meshRenderer.render(c);
                break;
            case 1:
            case 2:
                this.shadedMeshRenderer.render(c);
                break;
            case 3:
                this.ams.draw(c);
                break;
            default:
                break;
        }
        this.lineRenderer.render(c);
    }
}
