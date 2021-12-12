import { LineShader } from "Engine/render/shaders-old/line-shader";
import { App, Parameter, MultiVector3, Camera, DebugRenderer, UI, MultiLine, Plane, Vector3, DrawSpeed, InputState, Scene, Microphone, Color, Circle3, InputHandler } from "Geon";

export class MicApp extends App {

    // state
    mic!: Microphone
 
    // render
    scene: Scene;
    debug: DebugRenderer;
    grid: LineShader;
    circles: LineShader[];
    

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        let camera = new Camera(canvas, -2, true);
        camera.set(-2, 1, 1);
        this.grid = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.debug = DebugRenderer.new(gl);
        this.scene = new Scene(camera);

        this.circles = [];
        for (let i = 0 ; i < 32; i++) {
            this.circles[i] = new LineShader(gl, Color.fromHSL(i / 32).data);
        }
    }

    async start() {
        this.startGrid();

        this.mic = await Microphone.new(64)

        
        // create something!


    }

    ui(ui: UI) {}

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(new Vector3(0, 0, -1)), 100, 2);
        this.grid.set(grid, DrawSpeed.StaticDraw);
    }

    update(input: InputHandler) {
        this.scene.camera.update(input);
        if (!this.mic) return;
        let samples = this.mic.getTimeDomainDelayed();

        let plane = Plane.WorldXY();

        for (let i = 0 ; i < 32; i++) {
            let value = Math.abs(samples[i]);
            plane.center = Vector3.new(0,0,value * 5);
            this.circles[i].set(Circle3.new(plane, 0.1 + (i / 32)).buffer());
        }
    }

    draw() {
        this.grid.render(this.scene);
        this.debug.render(this.scene);
        for (let i = 0 ; i < 32; i++) {
            this.circles[i].render(this.scene);
        }
    }
}
