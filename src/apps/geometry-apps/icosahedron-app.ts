// name:    obj-loader-app.ts
// author:  Jos Feenstra
// purpose: test statistic functionalties

import { NormalShader } from "Engine/render/shaders-old/mesh-normals-shader";
import { ShadedMeshShader } from "Engine/render/shaders-old/shaded-mesh-shader";
import { App, Camera, Parameter, Graph, ShaderMesh, Mesh, Vector3, UI, InputState, Matrix4, DrawSpeed, Scene, PhongShader, Entity, Model, SkyBoxShader, InputHandler, Quaternion } from "Geon";


export class IcosahedronApp extends App {
    scene: Scene;
    meshRend: PhongShader;
    normalRend: NormalShader;
    skyboxShader: SkyBoxShader;

    rotate!: Parameter;
    inner!: Parameter;
    radius = 0.1; // radius!: Parameter;
    detail = 10; // detail!: Parameter;

    graph!: Graph;
    isocahedron!: Entity;

    constructor(gl: WebGLRenderingContext) {
        super(gl);
        let canvas = gl.canvas as HTMLCanvasElement;
        this.scene = new Scene(new Camera(canvas, 8, true));
        this.meshRend = new PhongShader(gl);
        this.normalRend = new NormalShader(gl);
        this.skyboxShader = new SkyBoxShader(gl);
    }

    getIcosahedron(): Graph {
        let graph = Mesh.newIcosahedron(1).toGraph();
        // let graph = Mesh.newCylinder(Vector3.new(0,0,-1), Vector3.new(0,0,1), 1, 4).toGraph();
        // let graph = Mesh.newSphere(Vector3.new(0,0,0), 1, 5, 10).toGraph().toMesh().toGraph();
        // graph.print();
        return graph;
    }

    getDemoShape(): Graph {
        let graph = Graph.new();

        function addVert(v: Vector3) {
            graph.addVert(v, v);
        }

        addVert(new Vector3(-1, 0, -1)); // 0
        addVert(new Vector3(0, 1, -1)); // 1
        addVert(new Vector3(1, 0, -1)); // 2
        addVert(new Vector3(0, -1, -1)); // 3
        addVert(new Vector3(0, 0, 1)); // 4

        addVert(new Vector3(-1, 1, 0)); // 5 (should be inserted between 0 and 1)

        graph.addEdge(4, 0);
        graph.addEdge(4, 1);
        graph.addEdge(4, 2);
        graph.addEdge(4, 3);
        // graph.addEdge(4,5);

        graph.addEdge(0, 1);
        graph.addEdge(1, 2);
        graph.addEdge(2, 3);
        graph.addEdge(3, 0);
        graph.addEdge(1, 3);

        graph.print();

        return graph;
    }

    demo(): Graph {
        let graph = new Graph();
        let normal = new Vector3(0, 0, 1);
        graph.addVert(new Vector3(0, 0, 0), normal); // 0
        graph.addVert(new Vector3(1, 0, 0), normal); // 1
        graph.addVert(new Vector3(0, 1, 0), normal); //
        graph.addVert(new Vector3(-1, 0, 0), normal); //
        graph.addVert(new Vector3(0, -1, 0), normal); //

        graph.addEdge(0, 1);
        graph.addEdge(0, 2);
        graph.addEdge(0, 3);
        graph.addEdge(0, 4);
        graph.addEdge(1, 2);

        return graph;
    }

    ui(ui: UI) {
        this.rotate = new Parameter("rotate", 1, 0, 1, 1);
        this.inner = new Parameter("inner", 1, 0, 1, 1);

        // this.radius = new Parameter("radius", 0.1, 0, 0.5, 0.01)
        // this.detail = new Parameter("detail", 6, 3, 20, 1)

        let reset = () => {
            // this.rotate.set(0);
            this.start();
        };

        ui.addBooleanParameter(this.rotate);
        ui.addBooleanParameter(this.inner, reset);
        // ui.addParameter(this.radius, reset);
        // ui.addParameter(this.detail, reset);
        // ui.addButton(() => {this.start()})
    }

    start() {
        this.graph = this.getIcosahedron();
        let mesh = graphToMultiMesh(this.graph, this.radius, this.detail, this.inner.get() == 1);
        let e = Entity.new(undefined, Model.new(mesh, undefined)); 
        this.meshRend.load(e);
        this.isocahedron = e;
        this.skyboxShader.load([
            "./data/textures/corona_ft.png", 
            "./data/textures/corona_bk.png", 
            "./data/textures/corona_up.png", 
            "./data/textures/corona_dn.png", 
            "./data/textures/corona_rt.png", 
            "./data/textures/corona_lf.png"]);
    }

    alpha = 0;

    update(input: InputHandler) {
        this.scene.camera.update(input);

        if (this.rotate.get() == 1) {
            this.alpha += 0.0002 * input.time.tick;
            // let rot = Matrix4.newXRotation(alpha).multiply(Matrix4.newYRotation(alpha));
            // this.isocahedron!.xform.rot.multiply(rot);
            this.isocahedron!.xform.rot.setEuler(this.alpha, this.alpha, 0);
            this.meshRend.loadTransform(this.isocahedron.xform);
        }
    }

    draw() {
        
        this.meshRend.draw(this.scene);
        this.skyboxShader.draw(this.scene);
    }
}

export function graphToMultiMesh(
    graph: Graph,
    radius: number,
    detail: number,
    inner: boolean,
    balls = true,
): Mesh {
    let meshes: Mesh[] = [];

    if (balls) {
        graph.allVertPositions().forEach((v) => {
            meshes.push(Mesh.newSphere(v, radius * 2, detail, detail * 2));
        });
    }

    let edges = graph.allEdgeVerts();
    for (let i = 0; i < edges.length; i += 2) {
        let from = graph.getVertexPos(edges[i]);
        let to = graph.getVertexPos(edges[i + 1]);
        let mesh = Mesh.newCylinder(from, to, radius, detail);
        meshes.push(mesh);
    }

    if (inner) {
        meshes.push(Mesh.fromGraph(graph));
    }

    let rmesh = Mesh.fromJoin(meshes);
 
    rmesh.ensureUVs();
    rmesh.calcAndSetVertexNormals();
    return rmesh;
}
