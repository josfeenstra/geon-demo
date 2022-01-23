// TODO
// - improve quadification: less triangles!
// - improve squarification: speed & equal sizes

import { GraphDebugShader } from "Engine/render/shaders-old/graph-debug-shader";
import { MeshDebugShader } from "Engine/render/shaders-old/mesh-debug-shader";
import { ShadedMeshShader } from "Engine/render/shaders-old/shaded-mesh-shader";
import { Stopwatch } from "Engine/util/Stopwatch";
import { App, Camera, Parameter, EnumParameter, Graph, ShaderMesh, UI, Mesh, Vector3, DrawSpeed, Matrix4, InputState, Scene, InputHandler, Random, Perlin, PhongShader, Entity, Model, Material } from "Geon";
import { quadification, averageEdgeLength, squarification, laPlacian } from "./spherical";

export class SphericalNoise extends App {
    camera: Camera;
    meshRend: ShadedMeshShader;
    debugRend: MeshDebugShader;
    graphRend: GraphDebugShader;
    phong: PhongShader;

    rotate!: Parameter;
    inner!: Parameter;
    subCount!: Parameter;
    liftType!: EnumParameter;
    randomEdges!: Parameter;
    noise!: Parameter;

    offset!: Parameter;
    tinus!: Parameter;
    sjakie!: Parameter;
    jaapiejo!: Parameter;
    kaasheer!: Parameter;

    radius = 0.1;

    graph!: Graph;
    rend!: ShaderMesh;
    average!: number;
    smooth!: Parameter;
    smoothlimit = 0;
    cca?: number;

    constructor(gl: WebGLRenderingContext) {
        super(
            gl,
            "setup for trying out different partitions of a sphere. Based on Oskar Stalberg's irregular quad grid",
        );
        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, 1, true);
        this.camera.set(-4.48, 1.24, -0.71);

        this.meshRend = new ShadedMeshShader(gl);
        this.debugRend = new MeshDebugShader(gl, [0.5, 0, 0, 1], [1, 0, 0, 1], false);
        this.graphRend = new GraphDebugShader(gl, [0.5, 0, 0, 1], [255 / 255, 69 / 255, 0, 1]);
        this.phong = new PhongShader(gl);
    }

    ui(ui: UI) {
        let reset = () => {
            // this.rotate.set(0);
            this.start();
        };

        this.rotate = new Parameter("rotate", 0, 0, 1, 1);
        this.randomEdges = new Parameter("randomEdges", 1, 0, 1, 1);
        this.smooth = new Parameter("smooth", 0, 0, 1, 1);
        this.subCount = new Parameter("sub count", 5, 0, 5, 1);
        this.liftType = EnumParameter.new("lift type", 1, ["none", "sphere", "buggy"]);
        
        this.noise = new Parameter("noise", 1, 0, 10, 0.1);
        
        this.offset = new Parameter("offset", 1, 0, 1, 0.001);  
        this.tinus = new Parameter("tinus", 1, 0, 5, 0.1);  
        this.sjakie = new Parameter("sjakie", 1, 0, 10, 1);
        this.jaapiejo = new Parameter("jaapiejo", 0.5, 0.0, 1.0, 0.01);
        this.kaasheer = new Parameter("kaasheer", 0.06, 0, 1, 0.01);

        ui.addBooleanParameter(this.rotate);
        ui.addBooleanParameter(this.randomEdges, reset);
        ui.addBooleanParameter(this.smooth);
        ui.addParameter(this.subCount, reset);
        ui.addParameter(this.liftType, reset);
        
        ui.addParameter(this.offset, reset);
        ui.addParameter(this.noise, reset);
        ui.addParameter(this.tinus, reset);
        ui.addParameter(this.sjakie, reset);
        ui.addParameter(this.jaapiejo, reset);
        ui.addParameter(this.kaasheer, reset);

        ui.addButton("recalculate", reset);
    }

    start() {
        let liftType = this.liftType.get();

        // 0 | setup
        let perlin = Perlin.new();

        const mesh = Mesh.newIcosahedron(0.5);
        let graph = mesh.toGraph();
        let center = new Vector3(0, 0, 0);
        this.smoothlimit = 0;

        if (liftType == 2) {
            this.radius = 1;
        } else {
            this.radius = graph.getVertexPos(0).disTo(center);
        }

        // lift to sphere after every subdivision
        for (let i = 0; i < this.subCount.get(); i++) {
            graph.subdivide();

            // lift to sphere after every subdivision
            if (liftType > 0) {
                let count = graph.getVertexCount();
                for (let i = 0; i < count; i++) {
                    let pos = graph.getVertexPos(i);
                    let normal = pos;

                    let dis = center.disTo(pos);
                    let lift = this.radius - dis;
                    if (liftType > 1) {
                        pos.add(normal.scaled(lift));
                    } else {
                        pos.add(normal.normalized().scaled(lift));
                    }
                }
            }
        }

        // 4 | quad relaxation
        this.graph = graph;

        // NOISE
        for (let i = 0 ; i < this.graph.verts.length; i++) {
            let v = this.graph.verts[i].pos;
            let o = this.offset.get();
            let noise = perlin.octaveNoise(v.x*this.noise.get() + o,v.y*this.noise.get() + 0,v.z*this.noise.get() + o, this.sjakie.get(), this.jaapiejo.get());
            let parts = 1 / this.kaasheer.get();
            let rounded = Math.round(noise * parts) / parts;   
            v.add(v.scaled(rounded * this.tinus.get())); 
        }
        let theMesh = this.graph.meshify();
        theMesh.calcAndSetVertexNormals();
        // this.debugRend.set(theMesh, DrawSpeed.StaticDraw)
        this.phong.load(Entity.new(Matrix4.new(), Model.new(theMesh, Material.newPurple())))
        // console.log("edges: ", this.graph.allEdges());
        // console.log("loops: ", this.graph.allVertLoops());
    }

    update(input: InputHandler) {
        this.camera.update(input);
    }

    draw() {
        let c = new Scene(this.camera);
        this.meshRend.render(c);
        this.graphRend.render(c);
        this.debugRend.render(c);
        this.phong.draw(c);
    }
}
