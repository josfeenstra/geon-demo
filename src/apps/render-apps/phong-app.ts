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
import { App, Camera, Plane, MultiLine, ShaderMesh, Parameter, EnumParameter, UI, Vector3, Mesh, InputState, Scene, DrawSpeed, Matrix4, Domain3, Entity, InputHandler, Key } from "Geon";


export class PhongApp extends App {
    // renderinfo
    camera: Camera;
    lineRenderer: LineShader;
    // phong: PhongShader;
    phong: PhongShader;

    material = Material.default();

    // geo data
    plane: Plane = Plane.WorldXY();
    grid?: MultiLine;
    geo: ShaderMesh[] = [];
    scene: Scene;

    // logic data
    size = 10;
    cellSize = 0.5;

    somePos = Vector3.zero();

    distance = new Parameter("distance", 3.0, 0, 4.0, 0.01);
    radius = new Parameter("radius", 1.0, 0, 4.0, 0.01);
    detail = new Parameter("detail", 5, 0, 100, 1);
    shademethod = EnumParameter.new("render method", 3, ["debug", "vertex shaded", "face shaded", "ambient only", "phong"]);

    constructor(gl: WebGLRenderingContext) {
        // setup render env
        super(gl);
        let canvas = gl.canvas as HTMLCanvasElement;

        // TODO abstract this to scene
        this.camera = new Camera(canvas, undefined, true);
        this.camera.zoom = -10;
        this.camera.angleAlpha = 0.4;
        this.camera.angleBeta = 0.5;
        this.scene = new Scene(this.camera);

        this.lineRenderer = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        // this.phong = new PhongShader(gl);
        this.phong = new PhongShader(gl);
    }

    ui(ui: UI) {
        // TODO : think of a system that ties parameter & slider together fully

        ui.addParameter(this.detail, () => { this.start()})
        ui.add3DParameter("sun", Domain3.fromRadius(50), 1, this.scene.sun.pos);
        ui.add3DParameter("position", Domain3.fromRadius(3), 0.01, this.somePos, () => {
            this.start();
        });

        ui.addParameter(Parameter.new("specular-dampner", 0.2, 0, 10, 0.001), (v) => { 
            this.material.specularDampner = v;
            this.start()
        })

        ui.addColorParameter("ambient", this.material.ambient.toHex6(), (hex) => {
            console.log(hex);
            let color = Color.fromHex(hex);
            if (color) {
                this.material.ambient = color;
                this.phong.loadMaterial(this.material);
            }
        });

        ui.addColorParameter("diffuse", this.material.diffuse.toHex6(), (hex) => {
            console.log(hex);
            let color = Color.fromHex(hex);
            if (color) {
                this.material.diffuse = color;
                this.phong.loadMaterial(this.material);
            }
        });

        ui.addColorParameter("specular", this.material.specular.toHex6(), (hex) => {
            console.log(hex);
            let color = Color.fromHex(hex);
            if (color) {
                this.material.specular = color;
                this.phong.loadMaterial(this.material);
            }
        });

        ui.addColorParameter("occluded", this.material.occluded.toHex6(), (hex) => {
            console.log(hex);
            let color = Color.fromHex(hex);
            if (color) {
                this.material.occluded = color;
                this.phong.loadMaterial(this.material);
            }
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
        mesh.ensureUVs();
        mesh.calcAndSetVertexNormals();
        this.calcAmbientOcclusion(mesh, this.plane);

        // let model = new Model(Matrix4.newIdentity(), rend.mesh, this.material);
        let model = Model.new(mesh, this.material);
        let e = Entity.new(Matrix4.newTranslate(this.somePos), model);
        // this.phong.load(model, DrawSpeed.StaticDraw);
        this.phong.load(e, DrawSpeed.StaticDraw);
        this.lineRenderer.set(grid);
    }

    /**
     * A very dumb version of ambient occlusion 
     */
    calcAmbientOcclusion(mesh: Mesh, plane: Plane) {
        let count = mesh.verts.count
        let data = new Float32Array(count);

        let maxDistance = 0.5;
        for (let i = 0 ; i < count; i++) {
            
            // the closer to the base plane, the more ambient occlusion
            let v = mesh.verts.get(i).added(this.somePos);
            let distance = plane.distanceTo(v);
            data[i] = Math.max(Math.min(maxDistance - (distance / maxDistance), 0.5), 0.0);
        }

        this.phong.loadOcclusion(data, DrawSpeed.StaticDraw);
    }

    update(input: InputHandler) {
        // move the camera with the mouse
        this.camera.update(input);

        if (input.keys?.isPressed(Key.K)){
            console.log(this.camera.worldMatrix.inverse().multiplyVector(Vector3.new()));
            
            console.log(this.camera.pos);
            console.log(this.camera.getState())
            console.log(this.camera.offset);
            
            this.camera.worldMatrix.print();
            this.camera.worldMatrix.inverse().print();
        }
    }

    draw() {
        // this.phong.draw(this.scene);
        this.phong.draw(this.scene);
        this.lineRenderer.render(this.scene);
    }
}
