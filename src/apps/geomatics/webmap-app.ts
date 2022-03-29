import { App, Scene, DebugRenderer, Camera, UI, MultiLine, Plane, Vector3, DrawSpeed, InputState, LineShader, InputHandler, ImageMesh, WebIO, Bitmap } from "Geon";

export class WebMapApp extends App {

    // render
    scene: Scene;
    debug: DebugRenderer;
    grid: LineShader;
    

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        let camera = new Camera(canvas, -2, true);
        camera.setState([-5.6589, 293.12, -126.30, -2, 0.9580000000000057,0.5530000000000058]);
        this.grid = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.debug = DebugRenderer.new(gl);
        this.scene = new Scene(camera);

        // init some state
    }

    async start() {
        this.startGrid();

        // fill some state | fill up shaders
    
    }

    ui(ui: UI) {}

    startGrid() {
        // let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(new Vector3(0, 0, -1)), 100, 2);
        // this.grid.set(grid, DrawSpeed.StaticDraw);

        spawnAllOfLevel(6, this.debug);
    }

    update(input: InputHandler) {
        this.scene.camera.update(input);
        // update state | fill up shaders
    }

    draw() {
        // this.grid.render(this.scene);
        this.debug.render(this.scene);
    }
}

function getAdress(z=0, x=0, y=0) {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}



function spawnAllOfLevel(level: number, renderer: DebugRenderer) {
    let loader = Loader.new();
    let counter = 0;
    let count = Math.pow(2, level);
    for (let i = 0 ; i < count; i++) {
        for (let j = 0; j < count; j++) {
            // load(level, i, j)
            //     .then(img => addImageMesh(level, i, j, img)
            //     .then(im => renderer.set(im)))
            //     .catch(e => console.log(e));

            loader.request(
                () => load(level, i, j), 
                (image) => addImageMesh(level, i, j, image).then((im) => {
                    renderer.set(im)
                })
            );
            counter += 1;
        }
    }
    console.log(counter);
}

async function addImageMesh(z: number, x: number, y: number, image: HTMLImageElement) : Promise<ImageMesh> {

    let size = 256;
    let count = Math.pow(2, z);
    let posx = (x / count) * size;
    let posy = (y / count) * size; 

    return ImageMesh.new(image, Plane.WorldXY().moveTo(Vector3.new(posx, -posy)), 1 / count, false);
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
        console.log(id);
        this.requests.delete(id);
        this.active -= 1;

        if (this.waitlist.length > 0) {
            let firstIn = this.waitlist.splice(0, 1)[0];
            console.log(firstIn, this.active)
            this.onRequestStart(firstIn);
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