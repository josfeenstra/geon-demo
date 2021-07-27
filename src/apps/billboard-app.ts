import {
    App,
    DotShader,
    LineShader,
    Camera,
    Vector3,
    MultiLine,
    InputState,
    Parameter,
    MultiVector3,
    DrawSpeed,
    Context,
    UI,
    Plane,
    MultiRenderer,
    loadImageFromFile,
    loadImageFromSrc,
    ImageCombi,
    GeonImage,
    BillboardShader,
    Domain3,
    Domain2,
} from "Geon";

export class BillboardApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    points!: MultiVector3;
 
    // render
    camera: Camera;
    mr: MultiRenderer;
    gs: LineShader;
    ir: ImageCombi;
    br: BillboardShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.set(-2, 1, 1);
        this.gs = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.mr = MultiRenderer.new(gl);
        this.ir = ImageCombi.new(gl);
        this.br = new BillboardShader(gl);
    }

    async start() {
        this.startGrid();

        let imgData = await loadImageFromSrc("./data/textures/minecraft.png");
        let texture = GeonImage.fromImageData(imgData);
        // img = img.trim(16,16,32,32);
        this.ir.state.push(texture);
        this.ir.buffer();


        let positions = Domain2.fromRadius(10).spawn(16, 16).to3D();
        let uvs = Domain2.fromBounds(0,16, 0,16).spawn(16,16);
        let uvSizes = Domain2.fromRadius(10).spawn(10,10);

        this.br.set({positions, uvs, uvSizes, texture}, DrawSpeed.StaticDraw);
        // create something!
    }

    ui(ui: UI) {}

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(Vector3.new(0, 0, -1)), 100, 2);
        this.gs.set(grid, DrawSpeed.StaticDraw);
    }

    update(state: InputState) {
        this.camera.update(state);
    }

    draw(gl: WebGLRenderingContext) {
        const canvas = gl.canvas as HTMLCanvasElement;
        let matrix = this.camera.totalMatrix;
        let c = new Context(this.camera);
        this.gs.render(c);
        this.mr.render(c);
        this.ir.render(c);
        this.br.render(c);
    }
}
