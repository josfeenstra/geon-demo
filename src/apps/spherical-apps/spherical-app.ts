// TODO
// - improve quadification: less triangles!
// - improve squarification: speed & equal sizes
// - Make big sphere and funky texture dancing around on it

import { GraphDebugShader } from "Engine/render/shaders-old/graph-debug-shader";
import { MeshDebugShader } from "Engine/render/shaders-old/mesh-debug-shader";
import { ShadedMeshShader } from "Engine/render/shaders-old/shaded-mesh-shader";
import { App, Parameter, Graph, ShaderMesh, Camera, IntMatrix, UI, InputState, Matrix4, Vector3, Scene, DrawSpeed, SkyBoxShader, PhongShader, Entity, Model, Material, InputHandler, Random } from "Geon";
import { createGraph, createTileWorld, averageEdgeLength, meshifyTileWorld, meshifyGraphSurface, squarification, laPlacian } from "./spherical";

//
//
//
export class SphericalApp extends App {
    // ui
    randomEdges!: Parameter;
    smooth!: Parameter;
    subCount!: Parameter;
    quadSubCount!: Parameter;
    rotate!: Parameter;

    // state
    radius = 1.0;
    graph!: Graph;
    avEdgeLength!: number;
    smoothlimit = 0;
    cca?: number;
    world!: ShaderMesh;
    worldFloor!: ShaderMesh;

    // render data
    camera: Camera;
    meshRend: ShadedMeshShader;
    floorRend: ShadedMeshShader;

    debugRend: MeshDebugShader;
    graphRend: GraphDebugShader;

    tiles!: IntMatrix;
    scene: Scene;
    newMeshShader: PhongShader;
    skyboxShader: SkyBoxShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl, "Multiple Layers of spherical geometry");

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, 1, true);
        this.camera.set(-2, 1.24, -0.71);

        this.meshRend = new ShadedMeshShader(gl);
        this.floorRend = new ShadedMeshShader(gl);
        // this.meshRend = new MeshDebugRenderer(gl, [0, 0, 0, 1], [0.3, 0.3, 0.3, 1], false);
        this.debugRend = new MeshDebugShader(gl, [0.5, 0, 0, 1], [0, 0, 0, 1], false);
        this.graphRend = new GraphDebugShader(gl, [0.5, 0.5, 0.5, 1], [1, 1, 1, 1]);
        this.scene =  new Scene(this.camera);

        this.newMeshShader = new PhongShader(gl);
        this.skyboxShader = new SkyBoxShader(gl);
    }

    ui(ui: UI) {
        let reset = () => {
            // this.rotate.set(0);
            this.start();
        };

        this.rotate = Parameter.newBoolean("rotate", false);
        this.randomEdges = new Parameter("randomEdges", 1, 0, 1, 1);
        this.smooth = new Parameter("smooth", 0, 0, 1, 1);
        this.subCount = new Parameter("sub count", 2, 0, 4, 1);
        this.quadSubCount = new Parameter("sub count quad", 1, 0, 2, 1);

        ui.addBooleanParameter(this.rotate);
        ui.addBooleanParameter(this.randomEdges, reset);
        ui.addBooleanParameter(this.smooth);
        ui.addParameter(this.subCount, reset);
        ui.addParameter(this.quadSubCount, reset);
        ui.addButton("recalculate", reset);
    }

    start() {
        // set some values
        this.radius = 1;
        this.smoothlimit = 0;

        // create the graph
        let random = Random.fromSeed(13894);
        this.graph = createGraph(
            1,
            this.subCount.get(),
            this.quadSubCount.get(),
            this.randomEdges.get(),
            random
        );

        // create the tile data
        this.tiles = createTileWorld(this.graph.allVertLoopsAsInts().length, 1);

        // set renderers
        // this.graphRend.set(this.graph, DrawSpeed.DynamicDraw);
        this.avEdgeLength = averageEdgeLength(this.graph);

        // this.skybox.load([
        //     "./data/textures/corona_ft.png", 
        //     "./data/textures/corona_bk.png", 
        //     "./data/textures/corona_up.png", 
        //     "./data/textures/corona_dn.png", 
        //     "./data/textures/corona_rt.png", 
        //     "./data/textures/corona_lf.png"]);

        // buffer
        this.bufferWorld();


        this.skyboxShader.load([
            "./data/textures/ducks/links.png", 
            "./data/textures/ducks/rechts.png", 
            "./data/textures/ducks/midden-1.png", 
            "./data/textures/ducks/midden-3.png", 
            "./data/textures/ducks/midden-2.png", 
            "./data/textures/ducks/midden-4.png"]);
    }

    update(input: InputHandler) {
        this.camera.update(input);
        this.scene.sun.pos = this.scene.camera.getActualPosition();
        let pulse = Math.sin(input.time.newTime);

        // rotate
        if (this.rotate.get() == 1) {
            let rot = Matrix4.newAxisRotation(Vector3.unitZ(), input.time.tick * 0.0001);
            this.world.position.multiply(rot);
            this.worldFloor.position.multiply(rot);
            // this.meshRend.setShallow(this.gl, this.world);
            this.floorRend.setShallow(this.gl, this.worldFloor);

            this.newMeshShader.loadPosition(this.world.position);
        }

        this.smoothWorld();
    }

    draw() {
        this.skyboxShader.draw(this.scene);
        this.floorRend.render(this.scene);
        this.newMeshShader.draw(this.scene);
    }

    bufferWorld() {
        this.world = meshifyTileWorld(this.graph, this.tiles, this.radius, 0.1);
        // this.world.calculateFaceNormals();
        
        let mesh = this.world.mesh;
        mesh = mesh.toLinearMesh();
        mesh.ensureMultiFaceNormals();
        mesh.ensureUVs();
        let m = Model.new(mesh, Material.newPurple());
        this.newMeshShader.load(m.spawn());

        this.world.color = [0.9, 0.9, 0.9, 1];
        this.meshRend.set(this.world, DrawSpeed.StaticDraw);

        this.worldFloor = meshifyGraphSurface(this.graph);
        this.worldFloor.calculateFaceNormals();
        this.worldFloor.color = [0.3, 0.3, 0.3, 1];
        this.floorRend.set(this.worldFloor, DrawSpeed.StaticDraw);
    }

    smoothWorld() {
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

                // this.graphRend.set(this.graph, DrawSpeed.DynamicDraw);
                this.bufferWorld();
            }
        } else {
            this.smoothlimit = 0;
        }
    }
}
