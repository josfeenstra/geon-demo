// name:    geometry-app.ts
// author:  Jos Feenstra
// purpose: a 3d voxel environment to toy around in. Uses several features of geon

import { Material } from "Engine/render/basics/Material";
import { Model } from "Engine/render/basics/Model";
import { DotShader } from "Engine/render/shaders-old/dot-shader";
import { LineShader } from "Engine/render/shaders-old/line-shader";
import { MeshDebugShader } from "Engine/render/shaders-old/mesh-debug-shader";
import { ShadedMeshShader } from "Engine/render/shaders-old/shaded-mesh-shader";
import { PhongShader } from "Engine/render/shaders/PhongShader";
import { DepthMeshShader } from "Engine/render/shaders/DepthMeshShader"
import { App, Camera, Plane, MultiLine, Vector3, ShaderMesh, IntCube, Parameter, UI, InputState, Scene, Mesh, Ray, Matrix4, Cube, Domain3, DebugRenderer, DrawSpeed, Entity, InputHandler, Key } from "Geon";

export class CubesPhongApp extends App {
    // renderinfo
    phongShader!: PhongShader;
    dr!: DebugRenderer;
    ds!: DepthMeshShader;

    scene: Scene;

    // geo data
    plane: Plane = Plane.WorldXY();
    gridLarge!: MultiLine;
    gridSmall!: MultiLine;
    dots: Vector3[] = [];
    geo: ShaderMesh[] = [];
    mapGeo: ShaderMesh[] = [];
    cursorVisual?: MultiLine;

    // logic data
    size = 50;
    cellSize = 1;
    map!: IntCube;

    fov = new Parameter("fov", 80, 10, 100, 1);

    constructor(gl: WebGLRenderingContext) {
        // setup render env
        super(gl);
        let camera = new Camera(gl.canvas! as HTMLCanvasElement, 10, true);
        this.scene = new Scene(camera);
        this.phongShader = new PhongShader(gl);
        this.dr = DebugRenderer.new(gl);
        this.ds = new DepthMeshShader(gl);
    }

    // called after init
    start() {
        this.map = new IntCube(this.size, this.size, this.size);
        this.map.fill(0);

        // add random blocks in the world
        this.map.map((value, index) => {
            if (Math.random() > 0.99) {
                return 1;
            } else {
                return value;
            }
        });

        // let perlin = new Perlin();
        // this.map.map((value, i) => {

        //     let c = this.map.getCoords(i);

        //     let scale = 0.05;
        //     let noise = perlin.noise(c.x * scale, c.y * scale, c.z * scale);

        //     if (i < 10) {
        //         console.log(c);
        //         console.log(noise);
        //     }

        //     if (noise > 0.60) {
        //         return 1;
        //     } else {
        //         return value;
        //     }
        // })

        // console.log("done setting")

        // after change, buffer
        this.bufferMap();

        // console.log("done")

        this.gridLarge = MultiLine.fromGrid(this.plane, this.size, this.cellSize);
        this.gridSmall = MultiLine.fromGrid(this.plane, this.size * 10 - 1, this.cellSize / 10);

        // this.whiteLineRenderer.set(this.gl, this.gridLarge, DrawSpeed.StaticDraw);
        // this.greyLineRenderer.set(this.gl, this.gridSmall, DrawSpeed.StaticDraw);
    }

    ui(ui: UI) {
        ui.addParameter(this.fov, (v) => {
            this.scene.camera.fov = v;
        });
    }

    update(input: InputHandler) {
        // move the camera with the mouse
        this.scene.camera.update(input);
        this.scene.sun.pos = this.scene.camera.getActualPosition();
        this.updateCursor(input);
    }

    draw() {

        // render the grid
        // this.greyLineRenderer.render(gl, matrix);
        // this.whiteLineRenderer.render(gl, matrix);

        // this.redLineRenderer.setAndRender(gl, matrix, this.cursorVisual!);

        // render the map
        // TODO create MeshArray
        this.phongShader.draw(this.scene);
        this.dr.render(this.scene);
        this.ds.draw(this.scene);
    }

    addPreviewCube(point: Vector3) {
        let cubeCenter = this.mapToWorld(point);
        let cube = this.createCube(cubeCenter);
        let m = Mesh.fromCube(cube).ToShaderMesh();
        m.calculateFaceNormals();
        this.dr.set(m, "preview-cube");
    }

    flushPreviewCubes() {
        this.geo = [];
    }

    updateCursor(input: InputHandler) {
        // render mouse to world line
        let mouseRay = this.scene.camera.getMouseWorldRay(input.width, input.height);

        // snap to world
        // let cursor = mouseRay.at(mouseRay.xPlane(this.plane));
        // let mapCursor = this.worldToMap(cursor);
        // let coord = this.mapToWorld(mapCursor);

        // place circle at cursor
        // let plane = this.plane.clone();
        // plane.matrix = plane.matrix.multiply(Matrix4.newTranslation(cursor.x, cursor.y, cursor.z));
        // this.cursorVisual = LineArray.fromCircle(new Circle3(plane, 0.1));

        // figure out which cube we are pointing to
        this.flushPreviewCubes();
        let [cubeID, cubeIDprevious] = this.voxelRaycast(mouseRay, 40);
        if (cubeID == -1) {
            // nothing else to do
            return;
        }

        let cubeCursor = this.map.getCoord(cubeIDprevious);
        this.addPreviewCube(cubeCursor);

        // render cube at this position

        // this.geo.push(Mesh.fromCube(cube));

        // click
        if (input.mouse?.leftPressed || input.touch?.tab) {
            console.log("click");
            if (input.keys?.isDown(Key.Space)) {
                if (this.map.data[cubeID] == 0) return;
                this.map.data[cubeID] = 0;
                this.bufferMap();
            } else if (this.map.data[cubeIDprevious] != 1) {
                this.map.data[cubeIDprevious] = 1;
                this.bufferMap();
            }
        }
    }

    // return the ID of the
    // A Fast Voxel Traversal Algorithm for Ray Tracing
    // Amanatides, Woo
    // Dept. of Computer Science
    voxelRaycast(ray: Ray, range: number): [number, number] {
        let startPoint = this.worldToMap(ray.origin);
        let voxelCenter = this.mapToWorld(startPoint);

        // integers
        let x = startPoint.x;
        let y = startPoint.y;
        let z = startPoint.z;

        let xprev = x;
        let yprev = y;
        let zprev = z;

        let stepX = ray.normal.x > 0 ? 1 : -1;
        let stepY = ray.normal.y > 0 ? 1 : -1;
        let stepZ = ray.normal.z > 0 ? 1 : -1;

        // floats
        let voxelsize = this.cellSize;
        let deltax = voxelsize / Math.abs(ray.normal.x);
        let deltay = voxelsize / Math.abs(ray.normal.y);
        let deltaz = voxelsize / Math.abs(ray.normal.z);

        // intit tx, ty, and tz, at their first intersection with corresponding plane
        voxelCenter.add(
            new Vector3((voxelsize / 2) * stepX, (voxelsize / 2) * stepY, (voxelsize / 2) * stepZ),
        );

        let move = Matrix4.newTranslation(voxelCenter.x, voxelCenter.y, voxelCenter.z);
        let xy = Plane.WorldXY();
        xy._matrix.multiply(move);
        let yz = Plane.WorldYZ();
        yz._matrix.multiply(move);
        let xz = Plane.WorldXZ();
        xz._matrix.multiply(move);

        let tx = ray.xPlane(yz);
        let ty = ray.xPlane(xz);
        let tz = ray.xPlane(xy);

        if (tx < 0 || ty < 0 || tz < 0) {
            console.log("something critical went wrong!");
            return [-1, -1];
        }

        // debug ray
        // let lineSets: LineArray[] = [ray.toLine(100), LineArray.fromPlane(xy), LineArray.fromPlane(yz), LineArray.fromPlane(xz)];
        // this.whiteLineRenderer.set(this.gl, LineArray.fromJoin(lineSets), DrawSpeed.StaticDraw);

        // console.log("voxel raycast initialized with:");
        // console.log("deltas: ", deltax, deltay, deltaz);
        // console.log("t's: ", tx, ty, tz);

        // start iterating
        // console.log("cast away!");
        // this.addPreviewCube(new Vector3(x,y,z));
        // console.log(x,y,z);
        for (let i = 0; i < range; i++) {
            // this.addPreviewCube(new Vector3(xprev,yprev,zprev));

            // if hit, return previous
            let value = this.map.tryGet(x, y, z, -1);
            if (value == 1) {
                // console.log("found a cube after " + i + "steps...");
                // this.addPreviewCube(new Vector3(xprev,yprev,zprev));
                return [this.map.getIndex(x, y, z), this.map.getIndex(xprev, yprev, zprev)];
            } else {
                xprev = x;
                yprev = y;
                zprev = z;
            }

            // to the next cube!
            if (tx < ty && tx < tz) {
                // x
                tx += deltax;
                x += stepX;
            } else if (ty < tz) {
                // y
                ty += deltay;
                y += stepY;
            } else {
                // z
                tz += deltaz;
                z += stepZ;
            }
        }
        return [-1, -1];
    }

    // flush this.meshRenderer
    // turn this.map into this.mapGeo
    bufferMap() {
        let mapGeo: Mesh[] = [];
        this.map.iter((entry, index) => {
            if (entry == 1) {
                let mapCoord = this.map.getCoord(index);
                let coord = this.mapToWorld(mapCoord);
                let cube = this.createCube(coord);
                mapGeo.push(Mesh.fromCube(cube));
            }
        });

        let mesh = Mesh.fromJoin(mapGeo);
        mesh = mesh.toLinearMesh();
        mesh.ensureMultiFaceNormals();
        mesh.ensureUVs();
        let e = Entity.new(undefined, Model.new(mesh, Material.newPurple()))
        e.model.material.specularDampner = 2
        e.model.mesh = mesh;
        this.phongShader.load(e, DrawSpeed.StaticDraw);
    }

    worldToMap(coord: Vector3): Vector3 {
        let halfsize = this.size / 2 + this.cellSize / 2;
        return coord.added(new Vector3(halfsize, halfsize, halfsize)).floored();
    }

    mapToWorld(point: Vector3): Vector3 {
        let halfsize = this.size / 2;
        return point.added(new Vector3(-halfsize, -halfsize, -halfsize));
    }

    createCube(center: Vector3) {
        let hs = this.cellSize / 2;
        let move = Matrix4.newTranslation(center.x, center.y, center.z);
        let cube = new Cube(
            Plane.WorldXY().transform(move),
            Domain3.fromBounds(-hs, hs, -hs, hs, -hs, hs),
        );
        return cube;
    }
}
