import { App, Parameter, MultiVector3, Camera, DebugRenderer, UI, MultiLine, Plane, Vector3, DrawSpeed, InputState, Scene, Mesh, Matrix4, Domain3, Domain2, Cube, loadImageFromSrc, GeonImage, ImageMesh, TransformLineShader, LineShader, ImageProcessing, HelpGl, Kernels } from "Geon";

const PATH_TO_TEXTURE = "./data/eyes/eyes-3.jpeg";

export class ImageProcessingApp extends App {
    // ui
    params: Parameter[] = [];
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
    }

    async start() {

        let imgData = await loadImageFromSrc(PATH_TO_TEXTURE);
        let texture = GeonImage.fromImageData(imgData);

        cannyPartially(texture, this.dr);

        this.dr.addUi(this.gui);
    }

    ui(ui: UI) {

        this.gui = ui;
    }

    update(state: InputState) {
        this.scene.camera.update(state);
    }

    draw(gl: WebGLRenderingContext) {
        this.dr.render(this.scene);
    }
}

function cannyPartially(original: GeonImage, dr?: DebugRenderer) {

    // adding to debug Rendering
    let offset = 0;
    let addToDR = (img: GeonImage, label: string) => {
        console.log("rendering:", label, img.width, img.height)
        let plane = Plane.WorldYZ().moveTo(Vector3.new(-offset, 0, 0));
        dr?.set(ImageMesh.new(img, plane, 1, false, true), label);
        offset += 10;
    }
     
    addToDR(original, "original");
    
    let grey = original.toGreyscale();
    addToDR(grey, "grey");

    let blurred = grey.applyKernel(Kernels.generateGaussianKernel(1.4, 7));
    addToDR(blurred, "blurred");

    let [magnitude, direction] = ImageProcessing.sobelMD(blurred);
    addToDR(magnitude, "sobel magnitude");
    addToDR(direction, "sobel direction");

    let thetaDirections = ImageProcessing.thetaMap(direction);
    // addToDR(theta, "directions");
    let thetaClamped = ImageProcessing.clampGreyscale(thetaDirections, 4);
    // addToDR(thetaClamped.forEachGreyscalePixel(v => v * 64), "clamped directions");

    let supressed = ImageProcessing.cannyNonMaximumSuppression(magnitude, thetaDirections);
    addToDR(supressed, "supressed");
    return supressed;

    // let thresholded = ImageProcessing.cannyThreshold(supressed, 50, 255, 128, 255);
    // addToDR(thresholded, "thressed");

    
}