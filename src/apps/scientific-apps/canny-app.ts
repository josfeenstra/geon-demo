import { App, Parameter, MultiVector3, Camera, DebugRenderer, UI, MultiLine, Plane, Vector3, DrawSpeed, InputState, Scene, Mesh, Matrix4, Domain3, Domain2, Cube, loadImageFromSrc, GeonImage, ImageMesh, TransformLineShader, LineShader, ImageProcessing, HelpGl, Kernels, EnumParameter, Vector2, COLOR } from "Geon";

const PATHS_TO_TEXTURE = ["./data/eyes/eyes-1.jpeg", "./data/eyes/eyes-2.jpeg","./data/eyes/eyes-3.jpeg"];
const PATH_TO_TEXTURE =  "./data/textures/earth.png";
// PATHS_TO_TEXTURE[0]


class Settings {

    parameters: Map<string, Parameter>;

    constructor() {
        this.parameters = new Map();
    }

    get(key: string) {
        return this.parameters.get(key)!.state;
    }

    getParam(key: string) {
        return this.parameters.get(key);
    }

    add(p: Parameter) {
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
  
        this.settings.add(Parameter.new("blur-size", 3, 3, 7, 2));
        this.settings.add(Parameter.new("blur-sigma", 1.40, 0.25, 4.00, 0.01));
        this.settings.add(Parameter.new("lower", 100, 1, 255, 1));
        this.settings.add(Parameter.new("upper", 200, 1, 255, 1));
    }

    guiPublished = false;

    async start() {
        let imgData = await loadImageFromSrc(PATH_TO_TEXTURE);
        let texture = GeonImage.fromImageData(imgData);

        // this.dr.clear();
        cannyPartially(texture, this.settings, this.dr);        
        
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

function cannyPartially(original: GeonImage, settings: Settings, dr?: DebugRenderer) {

    // adding to debug Rendering
    let offset = 0;
    let addToDR = (img: GeonImage, label: string) => {
        // console.log("rendering:", label, img.width, img.height)
        let plane = Plane.WorldYZ().moveTo(Vector3.new(-offset, 0, 0));
        dr?.set(ImageMesh.new(img, plane, 1, false, true), label);
        offset += 10;
    }
     
    addToDR(original, "original");
    
    let grey = original.toGreyscale();
    addToDR(grey, "grey");

    let gauss = Kernels.generateGaussianKernel(settings.get("blur-sigma"), settings.get("blur-size"));
    let blurred = grey.applyKernel(gauss);
    addToDR(blurred, "blurred");

    let [magnitude, direction] = ImageProcessing.sobelMD(blurred);
    addToDR(magnitude, "sobel magnitude");
    addToDR(direction, "sobel direction");

    let thetaDirections = ImageProcessing.thetaMap(direction);

    let supressed = ImageProcessing.cannyNonMaximumSuppression(magnitude, thetaDirections);
    addToDR(supressed, "supressed");

    let weak = 128;
    let strong = 255;
    let thressed = ImageProcessing.cannyThreshold(supressed, settings.get("lower"), settings.get("upper"), weak, strong);
    addToDR(thressed, "threshold");

    let hysted = ImageProcessing.cannyHysteresis(thressed, weak, strong);
    addToDR(hysted, "hysteresis");


    console.log("DONE");
    return hysted;

    // console.time("filled");
    // filled.bucketFill(Vector2.new(1,1), COLOR.blue, true);
    // filled.bucketFill(Vector2.new(128,128), COLOR.blue, true);
    // console.timeEnd("filled");
    // addToDR(filled, "filled");

    return supressed;

    // let thresholded = ImageProcessing.cannyThreshold(supressed, 50, 255, 128, 255);
    // addToDR(thresholded, "thressed");

    
}