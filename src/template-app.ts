import { App, Scene, DebugRenderer, Camera, UI, MultiLine, Plane, Vector3, DrawSpeed, InputState, LineShader } from "Geon";

export class TemplateApp extends App {

    // render
    scene: Scene;
    debug: DebugRenderer;
    grid: LineShader;
    

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        let camera = new Camera(canvas, -2, true);
        camera.set(-2, 1, 1);
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
        let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(new Vector3(0, 0, -1)), 100, 2);
        this.grid.set(grid, DrawSpeed.StaticDraw);
    }

    update(state: InputState) {
        this.scene.camera.update(state);
        // update state | fill up shaders
    }

    draw(gl: WebGLRenderingContext) {
        this.grid.render(this.scene);
        this.debug.render(this.scene);
    }
}
