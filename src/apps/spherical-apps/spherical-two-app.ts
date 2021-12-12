// landing page

import { MeshDebugShader } from "Engine/render/shaders-old/mesh-debug-shader";
import { GraphDebugShader } from "Engine/render/shaders-old/graph-debug-shader";
import { App, Parameter, EnumParameter, Graph, ShaderMesh, Scene, Camera, UI, Mesh, Vector3, DrawSpeed, InputState, Matrix4, InputHandler } from "Geon";
import { quadification, averageEdgeLength, constructMeshFromSphereGraph, squarification, laPlacian } from "./spherical";


export class SphericalTwoApp extends App {
    c: Scene;
    meshRend: MeshDebugShader;
    debugRend: MeshDebugShader;
    graphRend: GraphDebugShader;

    rotate!: Parameter;
    inner!: Parameter;
    subCount!: Parameter;
    quadSubCount!: Parameter;
    liftType!: EnumParameter;
    randomEdges!: Parameter;

    radius = 0.1;

    graph!: Graph;
    rend!: ShaderMesh;
    average!: number;
    smooth!: Parameter;
    smoothlimit = 0;
    cca?: number;

    world!: ShaderMesh;
    world2!: ShaderMesh;
    world3!: ShaderMesh;

    constructor(gl: WebGLRenderingContext) {
        super(gl, "Multiple Layers of spherical geometry");

        let canvas = gl.canvas as HTMLCanvasElement;
        this.c = new Scene(new Camera(canvas, 1, true));
        this.c.camera.set(-4.08, 1.24, -0.71);
        // this.meshRend = new ShadedMeshRenderer(gl);
        this.meshRend = new MeshDebugShader(gl, [0, 0, 0, 1], [0.3, 0.3, 0.3, 1], false);
        this.debugRend = new MeshDebugShader(gl, [0.5, 0, 0, 1], [0, 0, 0, 1], false);
        this.graphRend = new GraphDebugShader(gl, [0.5, 0.5, 0.5, 1], [1, 1, 1, 1]);
    }

    ui(ui: UI) {
        let reset = () => {
            // this.rotate.set(0);
            this.start();
        };

        this.rotate = new Parameter("rotate", 1, 0, 1, 1);
        this.randomEdges = new Parameter("delete edges", 1, 0, 1, 1);
        this.smooth = new Parameter("smooth", 0, 0, 1, 1);
        this.subCount = new Parameter("sub count", 2, 0, 4, 1);
        this.quadSubCount = new Parameter("sub count quad", 1, 0, 2, 1);
        this.liftType = EnumParameter.new("lift type", 1, ["none", "sphere", "buggy"]);

        ui.addBooleanParameter(this.rotate);
        ui.addBooleanParameter(this.randomEdges, reset);
        ui.addBooleanParameter(this.smooth);
        ui.addParameter(this.subCount, reset);
        ui.addParameter(this.quadSubCount, reset);
        ui.addParameter(this.liftType, reset);
        ui.addButton("recalculate", reset);
    }

    start() {
        let liftType = this.liftType.get();

        // 0 | setup
        const mesh = Mesh.newIcosahedron(0.5);
        let graph = mesh.toGraph();
        let center = new Vector3(0, 0, 0);
        this.smoothlimit = 0;

        if (liftType == 2) {
            this.radius = 1;
        } else {
            this.radius = graph.getVertexPos(0).disTo(center);
        }

        // 1 | subdivide
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

        // 2 | remove random edges
        if (this.randomEdges.get() == 1) {
            quadification(graph);
        }

        // 3 | subdivide quad
        for (let i = 0; i < this.quadSubCount.get(); i++) {
            graph.subdivideQuad();
        }

        // lift to sphere after every subdivision
        if (liftType > 0) {
            let count = graph.getVertexCount();
            for (let i = 0; i < count; i++) {
                let pos = graph.getVertexPos(i);
                let normal = graph.getVertexNormal(i);

                let dis = center.disTo(pos);
                let lift = this.radius - dis;
                if (liftType > 1) {
                    pos.add(normal.scaled(lift));
                } else {
                    pos.add(normal.normalized().scaled(lift));
                }
            }
        }

        // 4 | quad relaxation
        this.graph = graph;

        // 5 | convert
        this.graphRend.set(this.graph, DrawSpeed.DynamicDraw);
        this.average = averageEdgeLength(this.graph);

        this.bufferWorld();
    }

    bufferWorld() {
        this.world = constructMeshFromSphereGraph(
            this.graph,
            this.radius,
            0,
            0.1,
            0.6,
        ).ToShaderMesh();
        this.world2 = constructMeshFromSphereGraph(
            this.graph,
            this.radius,
            0.1,
            0.2,
            0.4,
        ).ToShaderMesh();
        this.world3 = constructMeshFromSphereGraph(
            this.graph,
            this.radius,
            0.2,
            0.3,
            0.2,
        ).ToShaderMesh();
    }

    update(input: InputHandler) {
        this.c.camera.update(input);

        let pulse = Math.sin(input.time.newTime);

        // rotate mesh
        if (this.rotate.get() == 1) {
            // rotate
            let alpha = 0.0001 * input.time.tick;
            let rotx = Matrix4.newXRotation(alpha);
            let roty = Matrix4.newYRotation(alpha);
            let rot = rotx.multiply(roty);
            this.graph.transform(rot);
            this.world.transform(rot);
            this.world2.transform(Matrix4.newXRotation(-alpha));
            this.world3.transform(Matrix4.newZRotation(-alpha));
        }

        // sucessive over relaxation
        if (this.smooth.get() == 1) {
            if (this.smoothlimit < 1000) {
                // squarification smoother

                this.cca = squarification(this.graph, this.cca);
                // this.cca = this.squarification(this.graph);
                // console.log(this.cca);
                laPlacian(this.graph);

                // project back to sphere
                this.graph.verts.forEach((v) => {
                    let normal = v.pos;
                    let lift = this.radius - v.pos.length();
                    v.pos.add(normal.normalized().scaled(lift));
                });
                this.smoothlimit += 1;
                this.bufferWorld();
            }
        } else {
            this.smoothlimit = 0;
        }

        // this.graphRend.set(this.graph, DrawSpeed.DynamicDraw);
    }

    draw() {
        for (let world of [this.world, this.world2, this.world3]) {
            this.meshRend.setAndRender(world, this.c);
        }

        // this.graphRend.render(gl, this.camera);
    }
}
