import { App, Scene, DebugRenderer, Camera, UI, MultiLine, Plane, Vector3, DrawSpeed, InputState, LineShader, InputHandler, ImageMesh, WebIO, Bitmap, SimpleMeshShader, COLOR, Circle3, Domain2, Vector2, Parameter } from "Geon";
import { TileTree } from "./tiletree";

export class WebMapApp extends App {

    // state
    loader = Loader.new()
    cursor?: {pos: Vector2, distance: number}
    tiletree: TileTree;

    // render
    scene: Scene;
    debug: DebugRenderer;
    grid: LineShader;
    plane = Plane.WorldXY();
    cursorShader: LineShader;    

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        this.plane.khat = this.plane.khat.scale(-1);

        let canvas = gl.canvas as HTMLCanvasElement;
        let camera = new Camera(canvas, -2, true);
        camera.setState([-139.61, 165.11, 0.0000, -571.4933778365955, 1.1197812838944499,-0.6372459341806297]);
        camera.speed = 0.2;
        camera.zoomDelta;
        this.grid = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.debug = DebugRenderer.new(gl);
        this.scene = new Scene(camera);


        this.tiletree = new TileTree(Domain2.fromWH(0,0,256, 256), 18);
        this.cursorShader = new LineShader(gl, COLOR.grey.data);
        // init some state
        canvas.addEventListener("mousedown", this.onClick.bind(this));
    }

    async start() {
        this.spawnAllOfLevel(4);
        // fill some state | fill up shaders
        
    }

    onClick() {
        console.log("click!!");
        if (!this.cursor) return;
        let tile = this.tiletree.getTile(this.cursor.distance, this.cursor.pos);
        console.log(tile);
        // this.request(tile.level, tile.x, tile.y);

        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                this.request(tile.level, tile.x + i, tile.y + j);
            }
        }
        console.log(this.scene.camera.zNear, this.scene.camera.zFar);
    }

    ui(ui: UI) {
        ui.addParameter(Parameter.new("camera.near", 0.1, 0.1, 1000, 1), (v) => {this.scene.camera.zNear = v});
        ui.addParameter(Parameter.new("camera.far", 10000, 100, 20000, 1), (v) => {this.scene.camera.zFar = v});
    }

    update(input: InputHandler) {
        const c = this.scene.camera;
        c.update(input);
        this.updateCursor(input);
        // update state | fill up shaders
    }

    updateCursor(input: InputHandler) {
        let ray = this.scene.camera.getMouseWorldRay(input.width, input.height, false);
        let cursor = ray.at(ray.xPlane(this.plane));
        let distance = ray.origin.disTo(cursor);
        this.cursorShader.set(MultiLine.fromCircle(Circle3.newPlanar(cursor, distance / 200)));

        // NOTE: i'm noticing that this 3d world does not have the right x, y and z axis...
        cursor.y *= -1;
        this.cursor = {pos: cursor.to2D(), distance};
    }

    draw() {
        // this.grid.render(this.scene);
        this.debug.render(this.scene);
        this.cursorShader.render(this.scene);
    }

    request(level: number, x: number, y: number) {
        this.loader.request(
            () => load(level, x, y), 
            (image) => addImageMesh(level, x, y, this.plane, image).then((im) => {
                if (!im) return;
                this.debug.set(im)
            })
        );
    }
    
    spawnAllOfLevel(level: number) {
        
        let counter = 0;
        let count = Math.pow(2, level);
        for (let i = 0 ; i < count; i++) {
            for (let j = 0; j < count; j++) {
                this.request(level, i, j);
                counter += 1;
            }
        }
        console.log(counter);
    }
}

function getAdress(z=0, x=0, y=0) {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}




async function addImageMesh(z: number, x: number, y: number, plane: Plane, image: HTMLImageElement) : Promise<ImageMesh | undefined> {

    if (z < 1) return undefined;

    let enlarger = 1;
    let size = 256 * enlarger;
    let count = Math.pow(2, z);
    let scale = 1 / count * enlarger;
    let posx = (x / count) * size;
    let posy = (y / count) * size; 
    let pos = Vector3.new()
        .add(plane.ihat.scaled(posx))
        .add(plane.jhat.scaled(posy));
    let tileplane = plane.clone().moveTo(pos);

    return ImageMesh.new(image, tileplane, scale, false, true, -1 -(z / 18));
}


/**
 * Something to make sure we are not loading more than X resources at a time
 */
class Loader {

    constructor(
        private requests: Map<number, Function>,
        private waitlist: number[],
        private count = 0,
        private active = 0,
        private limit = 1000,
    ) {}

    static new() {
        return new Loader(new Map(), []);
    }

    request<T>(loader: () => Promise<T | undefined>, onload: (payload: T) => void) {
        
        // use a counter to get a 'unique id'
        this.count += 1;
        let id = this.count;

        this.requests.set(id, () => {
            loader().then((data) => {
                if (data) {
                    onload(data);
                } else {
                }
            }).finally(() => {
                this.onRequestEnd(id);
            });
        })

        this.onRequestStart(id);
        
        return id;
    }

    onRequestStart(id: number) {
        if (this.active < this.limit) {
            // perform the request immediately
            this.requests.get(id)!();
            this.active += 1;
        } else {
            this.waitlist.push(id);
        }
    }

    onRequestEnd(id: number) {
        // console.log(id);
        this.requests.delete(id);
        this.active -= 1;

        // if there is a waitlist
        if (this.waitlist.length > 0) {
            let firstIn = this.waitlist.splice(0, 1)[0];
            // console.log(firstIn, this.active)
            this.onRequestStart(firstIn); /// hmmmmmm... the thing should not be popped if onRequestStart is false... 
        }
    }

    cancel(id: number) {
        // TODO
    }

    clear() {
        // TODO
    }
}


async function load(z: number, x: number, y: number) : Promise<HTMLImageElement> {
    let url = getAdress(z,x,y);
    let image = await WebIO.getImageFast(url);
    return image;
}