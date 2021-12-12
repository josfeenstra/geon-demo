import { LineShader } from "Engine/render/shaders-old/line-shader";
import { App, Parameter, MultiVector3, Camera, DebugRenderer, ImageRenderer, BillboardShader, loadImageFromSrc, Bitmap as Texture, Domain2, Vector2, MultiVector2, BillboardPayload, DrawSpeed, UI, MultiLine, Plane, Vector3, InputState, Scene, InputHandler } from "Geon";

export class BillboardApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    points!: MultiVector3;
 
    // render
    camera: Camera;
    mr: DebugRenderer;
    gs: LineShader;
    ir: ImageRenderer;
    br: BillboardShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.set(-2, 1, 1);
        this.gs = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.mr = DebugRenderer.new(gl);
        this.ir = ImageRenderer.new(gl);
        this.ir.scale = 0.2;
        this.br = new BillboardShader(gl);
    }

    async start() {
        this.startGrid();

        let imgData = await loadImageFromSrc("./data/textures/minecraft.png");
        let texture = Texture.fromImageData(imgData);
        // img = img.trim(16,16,32,32);
        this.ir.add(texture);
        this.ir.buffer();

        let xcount = 16;
        let ycount = 16;

        let spriteWidth = texture.width / xcount;
        let spriteHeight = texture.height / ycount;
        // console.log(spriteWidth, spriteHeight);


        let positions = Domain2.fromRadius(10).spawn(xcount, ycount).to3D();
        
        let uvs = Domain2.fromBounds(0,texture.width-spriteWidth, 0,texture.height-spriteHeight).spawn(xcount, ycount);
        // console.log(uvs);
        let sizes = [];
        for(let i = 0 ; i < uvs.count; i++) {
            sizes.push(Vector2.new(spriteWidth, spriteHeight));
        }
        let uvSizes = MultiVector2.fromList(sizes);
        // console.log(sizes);
        let payload: BillboardPayload = {positions, uvs, uvSizes, texture};
        this.br.load(payload, DrawSpeed.StaticDraw);
    }

    ui(ui: UI) {}

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(Vector3.new(0, 0, -1)), 100, 2);
        this.gs.set(grid, DrawSpeed.StaticDraw);
    }

    update(input: InputHandler) {
        this.camera.update(input);
    }

    draw() {
        let c = new Scene(this.camera);
        this.gs.render(c);
        this.mr.render(c);
        this.ir.render(c);
        this.br.draw(c);
    }
}
