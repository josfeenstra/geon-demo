// TODO
// - improve quadification: less triangles!
// - improve squarification: speed & equal sizes

import { Transform } from "Engine/math/Transform";
import { GraphDebugShader } from "Engine/render/shaders-old/graph-debug-shader";
import { MeshDebugShader } from "Engine/render/shaders-old/mesh-debug-shader";
import { ShadedMeshShader } from "Engine/render/shaders-old/shaded-mesh-shader";
import { Stopwatch } from "Engine/util/Stopwatch";
import { App, Camera, Parameter, EnumParameter, Graph, ShaderMesh, UI, Mesh, Vector3, DrawSpeed, Matrix4, InputState, Scene, InputHandler, Random, Perlin, PhongShader, Entity, Model, Material, Cube, Plane, Key } from "Geon";
import { quadification, averageEdgeLength, squarification, laPlacian } from "./spherical";

export class SphericalNoise extends App {
    
    camera: Camera;
    meshRend: ShadedMeshShader;
    debugRend: MeshDebugShader;
    graphRend: GraphDebugShader;
    phong: PhongShader;
    entityShader: PhongShader;

    rotate!: Parameter;
    inner!: Parameter;
    subCount!: Parameter;
    liftType!: EnumParameter;
    randomEdges!: Parameter;
    noiseScale!: Parameter;

    offset!: Parameter;
    amplitude!: Parameter;
    noiseOctaves!: Parameter;
    noiseOctaveBlend!: Parameter;
    noiseStride!: Parameter;

    radius = 0.1;

    graph!: Graph;
    rend!: ShaderMesh;
    average!: number;
    smooth!: Parameter;
    smoothlimit = 0;
    cca?: number;

    entity!: Entity;

    constructor(gl: WebGLRenderingContext) {
        super(
            gl,
            "setup for trying out different partitions of a sphere. Based on Oskar Stalberg's irregular quad grid",
        );
        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, 1, false, true);
        this.camera.set(-4.48, 1.24, -0.71);

        this.meshRend = new ShadedMeshShader(gl);
        this.debugRend = new MeshDebugShader(gl, [0.5, 0, 0, 1], [1, 0, 0, 1], false);
        this.graphRend = new GraphDebugShader(gl, [0.5, 0, 0, 1], [255 / 255, 69 / 255, 0, 1]);
        this.phong = new PhongShader(gl);
        this.entityShader = new PhongShader(gl);
    }

    ui(ui: UI) {
        let reset = () => {
            // this.rotate.set(0);
            this.start();
        };

        this.rotate = new Parameter("rotate", 0, 0, 1, 1);
        this.randomEdges = new Parameter("randomEdges", 1, 0, 1, 1);
        this.smooth = new Parameter("smooth", 0, 0, 1, 1);
        this.subCount = new Parameter("sub count", 5, 0, 4, 1);
        this.liftType = EnumParameter.new("lift type", 1, ["none", "sphere", "buggy"]);
        
        this.noiseScale = new Parameter("noise scale", 1, 0, 10, 0.1);
        this.offset = new Parameter("noise offset", 1, 0, 1, 0.001);  
        this.amplitude = new Parameter("noise applitude", 1, 0, 5, 0.1);  
        this.noiseOctaves = new Parameter("noise octaves", 1, 0, 10, 1);
        this.noiseOctaveBlend = new Parameter("noise octaves blend", 0.5, 0.0, 1.0, 0.01);
        this.noiseStride = new Parameter("noise stride", 0.06, 0, 1, 0.01);

        ui.addParameter(this.subCount, reset);
        ui.addParameter(this.liftType, reset);
        
        ui.addParameter(this.offset, reset);
        ui.addParameter(this.noiseScale, reset);
        ui.addParameter(this.amplitude, reset);
        ui.addParameter(this.noiseOctaves, reset);
        ui.addParameter(this.noiseOctaveBlend, reset);
        ui.addParameter(this.noiseStride, reset);

        ui.addButton("recalculate", reset);
    }

    startEntity() {

        let model = new Model(Mesh.fromCube(Cube.fromRadius(Vector3.zero(), 0.05)), Material.default())
        let e = new Entity(Transform.new(Vector3.new(0,0,1.3)), model);
        this.entity = e;
        this.entityShader.load(e);
    }

    start() {
        this.startEntity();

        this.quatTest();

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
            let noise = perlin.octaveNoise(v.x*this.noiseScale.get() + o,v.y*this.noiseScale.get() + 0,v.z*this.noiseScale.get() + o, this.noiseOctaves.get(), this.noiseOctaveBlend.get());
            let parts = 1 / this.noiseStride.get();
            let rounded = Math.round(noise * parts) / parts;   
            v.add(v.scaled(rounded * this.amplitude.get())); 
        }
        let theMesh = this.graph.meshify();
        theMesh.calcAndSetVertexNormals();
        // this.debugRend.set(theMesh, DrawSpeed.StaticDraw)
        this.phong.load(Entity.new(Transform.new(), Model.new(theMesh, Material.newPurple())))
        // console.log("edges: ", this.graph.allEdges());
        // console.log("loops: ", this.graph.allVertLoops());
    }


    quatTest() {
        let xform = this.entity.xform;
        console.log(xform);
        let m = xform.toMatrix();
        let xform2 = m.toTransform();
        console.log(xform2);
    }


    update(input: InputHandler) {
        this.camera.update(input);
        this.updateEntity(input);
    }
    
    entityVelocity = 0.01;
    entityDirection = Vector3.unitX().scale(this.entityVelocity);

    updateEntity(input: InputHandler) {
        let lockedHeight = 1.3;
        
        // update position
        let pos = this.entity.xform.pos;
        let newPos = pos.add(this.entityDirection).setLength(lockedHeight);

        // get new entityDirection
        let cross = newPos.cross(this.entityDirection);
        this.entityDirection = newPos.cross(cross).setLength(-this.entityVelocity);

        // create plane
        let plane = Plane.fromPVV(newPos, this.entityDirection.normalized(), cross.normalized());        

        // rotate based upon input
        if (input.keys?.isDown(Key.LeftArrow)) {
            this.entityDirection = this.entityDirection.rotated(newPos, 0.05);
        }
        if (input.keys?.isDown(Key.RightArrow)) {
            this.entityDirection = this.entityDirection.rotated(newPos, -0.05);
        } 

        if (input.keys?.isPressed(Key.Space)) {
            this.quatTest();
        }

        // this.entity.xform = plane.matrix;
        this.entityShader.loadTransform(this.entity.xform);
    }

    draw() {
        let c = new Scene(this.camera);
        this.meshRend.render(c);
        this.graphRend.render(c);
        this.debugRend.render(c);
        this.phong.draw(c);
        this.entityShader.draw(c);
    }
}
