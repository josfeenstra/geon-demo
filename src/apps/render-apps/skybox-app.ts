import { App, Camera, DrawSpeed, InputState, LineShader, MultiLine, MultiVector3, Parameter, Plane, Scene, SkyBoxShader, UI, Vector3 } from "Geon";

export class SkyboxApp extends App {
    // ui
    params: Parameter[] = [];

    // state
    points!: MultiVector3;
    Plsa!: MultiVector3;
    Pnormal!: MultiVector3;

    // render
    camera: Camera;
    skyboxShader: SkyBoxShader;
    gs: LineShader;
    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.set(-2, 1, 1);
        this.gs = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.skyboxShader = new SkyBoxShader(gl);
    }

    start() {
        this.startGrid();
        this.skyboxShader.load([
            "./data/textures/corona_ft.png", 
            "./data/textures/corona_bk.png", 
            "./data/textures/corona_up.png", 
            "./data/textures/corona_dn.png", 
            "./data/textures/corona_rt.png", 
            "./data/textures/corona_lf.png"]);
    }

    ui(ui: UI) {}

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(new Vector3(0, 0, -1)), 100, 2);
        this.gs.set(grid, DrawSpeed.StaticDraw);
    }

    update(state: InputState) {
        this.camera.update(state);
    }

    draw(gl: WebGLRenderingContext) {
        let c = new Scene(this.camera);
        this.gs.render(c);
        this.skyboxShader.draw(c);
    }
}
