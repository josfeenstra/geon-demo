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
import { App, Camera, Plane, MultiLine, Vector3, ShaderMesh, 
    IntCube, Parameter, UI, InputState, Scene, Mesh, Ray, Matrix4, Cube, 
    Domain3, DebugRenderer, DrawSpeed, Entity, Perlin, MultiShader, 
    marchingCubes, MultiVector3, IntMatrix, getLongDefaultIndices, getDefaultIndices, SkyBoxShader, Color, COLOR, InputHandler, Key } from "Geon";

export class MarchingCubeApp extends App {

    chunkShaders: PhongShader[];
    dotsShader: DotShader;
    dr!: DebugRenderer;
    ds!: DepthMeshShader;
    skyShader: SkyBoxShader;

    scene: Scene;
    planetShader!: PhongShader;
    sunShader!: PhongShader;

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
    perlinScale = 0.1;

    terrain!: VoxelTerrain;
    chunks: Mesh[] = [];

    constructor(gl: WebGLRenderingContext) {
        // setup render env
        super(gl);
        let camera = new Camera(gl.canvas! as HTMLCanvasElement, 10, true);
        camera.zFar = 10000000;
        this.scene = new Scene(camera);
        this.chunkShaders = [];

        this.dr = DebugRenderer.new(gl);
        this.ds = new DepthMeshShader(gl);
        this.dotsShader = new DotShader(gl);
        this.skyShader = new SkyBoxShader(gl);
    }

    start() {
        this.terrain = VoxelTerrain.fromPerlin(this.size, this.cellSize, this.perlinScale);
        this.onTerrainChange();


        // create the world: skybox | sun | planet
        this.skyShader.load([
            "./data/textures/corona_ft.png", 
            "./data/textures/corona_bk.png", 
            "./data/textures/corona_up.png", 
            "./data/textures/corona_dn.png", 
            "./data/textures/corona_rt.png", 
            "./data/textures/corona_lf.png"]);
        
        
        let sunpos = Vector3.new(-1000000, -1000000, 0);
        this.scene.sun.pos.copy(sunpos);
        let sunmesh = Mesh.newSphere(sunpos, 50000, 20, 20);
        this.sunShader = PhongShader.new(this.gl);
        this.sunShader.load(Entity.new(undefined, Model.new(sunmesh, Material.neutral())));

        let planetpos = Vector3.new(-10000, 10000, 1000);
        let planetMesh = Mesh.newSphere(planetpos, 5000, 40, 40);
        planetMesh.calcAndSetVertexNormals();
        this.planetShader = PhongShader.new(this.gl);
        let planetMat = Material.default();
        planetMat.specularDampner = 0.0001;
        planetMat.specular = COLOR.black;
        this.planetShader.load(Entity.new(undefined, Model.new(planetMesh, Material.default())));
    }

    update(input: InputHandler) {
        this.scene.camera.update(input);
        this.scene.sun.pos = this.scene.camera.getActualPosition();
        this.updateCursor(input);
    }

    draw() {
        this.dr.render(this.scene);
        this.ds.draw(this.scene);
        // this.dotsShader.render(this.scene);
        this.drawChunks(this.scene);
        this.skyShader.draw(this.scene);
        this.sunShader.draw(this.scene);
        this.planetShader.draw(this.scene);
    }

    ///////////////////////////////////////////////////////////////////////////////////////////

    drawChunks(scene: Scene) {
        for (let c of this.chunkShaders) {
            c.draw(scene);
        }
    }

    onTerrainChange() {
        // let mcMesh = this.terrain.bufferToMarchingCubes();
        this.chunkShaders = [];
        this.chunks = this.terrain.bufferToMarchingCubesChunks();
        
        const lBrown = Color.fromHex("7c5835")!;
        const brown = Color.fromHex("66442c")!;
        const browner = Color.fromHex("4c2b21")!;
        const brownst = Color.fromHex("2e1915")!;
        const black = COLOR.black;
        const none = Color.fromHex("00000000")!;

        let rockMaterial = new Material(
            black,
            lBrown,
            brown,
            none,
            10,
            1,
        )
        for (let chunk of this.chunks) {
            let ps = new PhongShader(this.gl);
            let e = Entity.new(undefined, Model.new(chunk, rockMaterial))
            ps.load(e);
            this.chunkShaders.push(ps);
        }

        // this.terrainEntity.model.mesh = mcMesh;
        // this.phongShader.load(this.terrainEntity, DrawSpeed.StaticDraw);
        this.dotsShader.set(this.terrain.bufferToPoints());

        // this.dr.set(mcMesh, "mc");
    }

    addPreviewCube(point: Vector3) {
        let cubeCenter = this.terrain.mapToWorld(point);
        let cube = Cube.fromRadius(cubeCenter, this.terrain.cellSize / 2);
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
        let [cubeID, cubeIDprevious] = this.terrain.raycast(mouseRay, 40);
        if (cubeID == -1) {
            // this.dr.set(Mesh.zero(), "preview-cube");
            return;
        }

        let cubeCursor = this.terrain.intCube.getCoord(cubeIDprevious);
        this.addPreviewCube(cubeCursor);

        // render cube at this position
        // this.geo.push(Mesh.fromCube(cube));

        // click
        if (input.mouse!.leftPressed) {
            if (input.keys?.isDown(Key.Space)) {
                if (this.terrain.intCube.data[cubeID] == 0) return;
                this.terrain.intCube.data[cubeID] = 0;
                this.onTerrainChange();
            } else if (this.terrain.intCube.data[cubeIDprevious] != 1) {
                this.terrain.intCube.data[cubeIDprevious] = 1;
                this.onTerrainChange();
            }
        }
    }
}

/**
 * Represents a 3D interactible terrain, minecraft style.
 */
class VoxelTerrain {
    
    private constructor(
        public intCube: IntCube,
        public size: number,
        public cellSize: number,
        public halfSize: number,
        public halfSizePlus: number,
    ) {}

    static new(size: number, cellSize: number) {

        let intCube = IntCube.new(size, size, size);
        // let dimentions = Vector3.new(size, size, size);
        let halfSize = size / 2;
        let halfSizePlus = halfSize + cellSize / 2;

        return new VoxelTerrain(intCube, size, cellSize, halfSize, halfSizePlus);
    }

    static fromPerlin(size: number, cellSize: number, scale=0.20, offset=Vector3.zero()) {
        let terrain = VoxelTerrain.new(size, cellSize);
        let perlin = new Perlin();
        terrain.intCube.map((value, i) => {
    
            let c = terrain.intCube.getCoord(i);
            if (terrain.intCube.isOnEdge(c.x, c.y, c.z)) {
                return 0;
            }


            let noise = perlin.noise(offset.x + c.x * scale, offset.y + c.y * scale, offset.z + c.z * scale);
    
            if (i < 10) {
                // console.log(c);
                // console.log(noise);
            }
    
            if (noise > 0.60) {
                return 1;
            } else {
                return value;
            }
        })
    
        return terrain;
    }

    worldToMap(coord: Vector3): Vector3 {
        return coord.clone().addN(this.halfSizePlus).floored();
    }

    mapToWorld(point: Vector3): Vector3 {
        return point.clone().addN(-this.halfSize);
    }

    bufferToPoints() {
        let centers:Vector3[] = [];
        this.intCube.iter((value, index) => {
            if (value == 1) {
                let mapCoord = this.intCube.getCoord(index);
                let coord = this.mapToWorld(mapCoord);
                centers.push(coord);
            }
        });
        return centers;
    }

    bufferToVoxels() : Mesh {
        let mapGeo: Mesh[] = [];
        this.intCube.iter((entry, index) => {
            if (entry == 1) {
                let mapCoord = this.intCube.getCoord(index);
                let coord = this.mapToWorld(mapCoord);

                let cube = Cube.fromRadius(coord, this.cellSize / 2);
                mapGeo.push(Mesh.fromCube(cube));
            }
        });

        let mesh = Mesh.fromJoin(mapGeo);
        mesh = mesh.toLinearMesh();
        mesh.ensureMultiFaceNormals();
        mesh.ensureUVs();
        return mesh;
    }

    bufferToMarchingCubes(level = 0.5) : Mesh {

        // get the marching cubes function
        let mc = marchingCubes;
        let vertices: Vector3[] = [];

        this.intCube.iter((value, index) => {
            let coord = this.intCube.getCoord(index)
            
            // stay away from the last ones 
            if (coord.x > this.intCube._width - 2  ||
                coord.y > this.intCube._height - 2 ||
                coord.z > this.intCube._depth - 2) {
                return;
            };

            // gather a 2x2x2 cube of values
            
            let coords = [
                Vector3.new(coord.x, coord.y, coord.z),
                Vector3.new(coord.x+1, coord.y, coord.z),
                Vector3.new(coord.x+1, coord.y+1, coord.z),
                Vector3.new(coord.x, coord.y+1, coord.z),
                Vector3.new(coord.x, coord.y,     coord.z + 1),
                Vector3.new(coord.x+1, coord.y,   coord.z + 1),
                Vector3.new(coord.x+1, coord.y+1, coord.z + 1),
                Vector3.new(coord.x, coord.y+1,   coord.z + 1),
            ];
            let values = coords.map((v) => this.intCube.tryGet(v.x,v.y,v.z, 0));
            let corners = coords.map((v) => this.mapToWorld(Vector3.new(v.x,v.y,v.z)));

            vertices.push(...mc(corners, values, level));
        });

        let intMatrix = IntMatrix.new(vertices.length / 3, 3, getLongDefaultIndices(vertices.length))
        let mesh = Mesh.new(MultiVector3.fromList(vertices), intMatrix);
        mesh = mesh.toLinearMesh();
        mesh.ensureMultiFaceNormals();
        mesh.ensureUVs();
        return mesh;


    }


    bufferToMarchingCubesChunks(level = 0.5) : Mesh[] {

        // get the marching cubes function
        let mc = marchingCubes;
        let vertices: Vector3[] = [];
        let chunks: Mesh[] = [];

        let createChunk = () => {
            let intMatrix = IntMatrix.new(vertices.length / 3, 3, getDefaultIndices(vertices.length))
            let chunk = Mesh.new(MultiVector3.fromList(vertices), intMatrix);
            chunk.calcAndSetFaceNormals();
            chunk = chunk.toLinearMesh();
            // chunk.ensureMultiFaceNormals();
            chunk.ensureUVs();
            chunks.push(chunk);
        };

        this.intCube.iter((value, index) => {
            if (vertices.length > 60000) {
                createChunk();
                // flush vertices, to create a new chunk
                vertices = [];
            }
            let coord = this.intCube.getCoord(index)
            
            // stay away from the last ones 
            if (coord.x > this.intCube._width - 2  ||
                coord.y > this.intCube._height - 2 ||
                coord.z > this.intCube._depth - 2) {
                return;
            };

            // gather a 2x2x2 cube of values
            
            let coords = [
                Vector3.new(coord.x, coord.y, coord.z),
                Vector3.new(coord.x+1, coord.y, coord.z),
                Vector3.new(coord.x+1, coord.y+1, coord.z),
                Vector3.new(coord.x, coord.y+1, coord.z),
                Vector3.new(coord.x, coord.y,     coord.z + 1),
                Vector3.new(coord.x+1, coord.y,   coord.z + 1),
                Vector3.new(coord.x+1, coord.y+1, coord.z + 1),
                Vector3.new(coord.x, coord.y+1,   coord.z + 1),
            ];
            let values = coords.map((v) => this.intCube.tryGet(v.x,v.y,v.z, 0));
            let corners = coords.map((v) => this.mapToWorld(Vector3.new(v.x,v.y,v.z)));

            vertices.push(...mc(corners, values, level));
        });

        createChunk();
        return chunks;
    }


    /**
     * return the ID of the
     * A Fast Voxel Traversal Algorithm for Ray Tracing
     * Amanatides, Woo
     * Dept. of Computer Science
     */
    raycast(ray: Ray, range: number): [number, number] {
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
        // let lineSets: MultiLine[] = [ray.toLine(100), MultiLine.fromPlane(xy), MultiLine.fromPlane(yz), MultiLine.fromPlane(xz)];
        // this.whiteLineRenderer.set(this.gl, LineArray.fromJoin(lineSets), DrawSpeed.StaticDraw);

        // console.log("voxel raycast initialized with:");
        // console.log("deltas: ", deltax, deltay, deltaz);
        // console.log("t's: ", tx, ty, tz);

        // start iterating
        // console.log("cast away!");
        // this.addPreviewCube(new Vector3(x,y,z));
        // console.log(x,y,z);
        let intCube = this.intCube;
        for (let i = 0; i < range; i++) {
            // this.addPreviewCube(new Vector3(xprev,yprev,zprev));

            // if hit, return previous
            let value = intCube.tryGet(x, y, z, -1);
            if (value == 1) {
                // console.log("found a cube after " + i + "steps...");
                // this.addPreviewCube(new Vector3(xprev,yprev,zprev));
                return [intCube.getIndex(x, y, z), intCube.getIndex(xprev, yprev, zprev)];
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
}

