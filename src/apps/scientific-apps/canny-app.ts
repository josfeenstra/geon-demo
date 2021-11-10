import { App, Parameter, MultiVector3, Camera, DebugRenderer, UI, MultiLine, Plane, Vector3, DrawSpeed, InputState, Scene, Mesh, Matrix4, Domain3, Domain2, Cube, loadImageFromSrc, Bitmap as Texture, ImageMesh, TransformLineShader, LineShader, ImageProcessing, HelpGl, Kernels, EnumParameter, Vector2, COLOR } from "Geon";

// const PATHS_TO_TEXTURE = ["./data/eyes/eyes-1.jpeg", "./data/eyes/eyes-2.jpeg","./data/eyes/eyes-3.jpeg"];

const PATHS_TO_TEXTURE = [
    "./data/textures/prague-darker.png",
    "./data/textures/prague.png",
    "./data/textures/prague-lighter.png"
];

class Settings {

    parameters: Map<string, Parameter | EnumParameter>;

    constructor() {
        this.parameters = new Map();
    }

    get(key: string) {
        return this.parameters.get(key)!.state;
    }

    getParam(key: string) {
        return this.parameters.get(key);
    }

    add(p: Parameter | EnumParameter) {
        this.parameters.set(p.name, p);
    }

    publish(gui: UI, onTrigger: Function) {

        for (let param of this.parameters.values()) {
            gui.addParameter(param, (v) => onTrigger());
        }

    }
}

export class CannyApp extends App {
    
    // ui
    settings: Settings;
    gui!: UI;
    guiPublished = false;

    // state
    points!: MultiVector3;
    Plsa!: MultiVector3;
    Pnormal!: MultiVector3;
    
    // render
    dr: DebugRenderer;
    scene: Scene;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        this.dr = DebugRenderer.new(gl);

        let camera = new Camera(canvas, -2, true);
        camera.setState([493.30, -156.98, 135.77, -50, 1.5999999999999928,1.5707963267948966]);
        this.scene = new Scene(camera);

        this.settings = new Settings();
  
        this.settings.add(EnumParameter.new("choose-image", 0, PATHS_TO_TEXTURE));
        this.settings.add(Parameter.new("blur-size", 3, 3, 7, 2));
        this.settings.add(Parameter.new("blur-sigma", 1.40, 0.25, 4.00, 0.01));
        this.settings.add(Parameter.new("lower", 130, 1, 255, 1));
        this.settings.add(Parameter.new("upper", 246, 1, 255, 1));
        
        this.settings.add(Parameter.newBoolean("equalize-histogram", true));
        this.settings.add(Parameter.newBoolean("dynamic-threshold", true));
    }

    async start() {
        let settings = this.settings;
        let imgData = await loadImageFromSrc(PATHS_TO_TEXTURE[settings.get("choose-image")]);
        let texture = Texture.fromImageData(imgData);

        // this.dr.clear();

        // this.dr.set(ImageMesh.new(texture, Plane.WorldYZ().moveTo(Vector3.new(0, 0, 0)), 1, false, true), "original");
        // let grey = ImageProcessing.trueGreyscale(texture);
        
        // this.dr.set(ImageMesh.new(grey, Plane.WorldYZ().moveTo(Vector3.new(0, 0, 0)), 1, false, true), "grey");
        ImageProcessing.canny(texture, settings.get("blur-sigma"), settings.get("blur-size"), settings.get("lower"), settings.get("upper"), settings.get("equalize-histogram") === 1, settings.get("dynamic-threshold") === 1, this.dr);        
        
        if (this.guiPublished) return;
        this.gui.setContext("image-toggles-wrapper");
        this.dr.addUi(this.gui);
        this.guiPublished = true;
    } 

    ui(ui: UI) {
        this.gui = ui;

        this.gui.addDiv("image-toggles-wrapper");

        this.settings.publish(this.gui, () => {
            if (this.settings.get("auto-recalc") == 1) {
                this.start();
            }
        });

        // published the auto-recalc differently
        let bool = Parameter.newBoolean("auto-recalc", true)
        this.settings.add(bool);
        this.gui.addBooleanParameter(bool);
        this.gui.addButton("recalc", () => {
            this.start();
        })
    }

    update(state: InputState) {
        this.scene.camera.update(state);
    }

    draw(gl: WebGLRenderingContext) {
        this.dr.render(this.scene);
    }
}