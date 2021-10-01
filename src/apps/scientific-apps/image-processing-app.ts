import { App, Parameter, MultiVector3, Camera, DebugRenderer, UI, MultiLine, Plane, Vector3, DrawSpeed, InputState, Scene, Mesh, Matrix4, Domain3, Domain2, Cube, loadImageFromSrc, GeonImage, ImageMesh, TransformLineShader, LineShader, ImageProcessing, HelpGl } from "Geon";

const PATH_TO_TEXTURE = "./data/textures/prague.png";

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

        canny(texture, this.dr);

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

function canny(original: GeonImage, dr?: DebugRenderer) {

    // for debugging
    let offset = 0;
    let printToCanvas = (img: GeonImage, label: string) => {
        console.log("rendering:", label, img.width, img.height)
        let plane = Plane.WorldYZ().moveTo(Vector3.new(-offset, 0, 0));
        dr?.set(ImageMesh.new(img, plane, 1, false, true), label);
        offset += 10;
    }
     
    printToCanvas(original, "original");
    
    let grey = original.toGreyscale();
    printToCanvas(grey, "grey");

    let blurred = ImageProcessing.gaussianBlur5(grey);
    printToCanvas(blurred, "blurred");

    let [gradient, direction] = ImageProcessing.sobel(blurred);
    printToCanvas(gradient, "sobel gradient");
    printToCanvas(direction, "sobel direction");

    let theta = ImageProcessing.thetaMap(direction);
    let thetaClamped = ImageProcessing.clampDirections(theta, 8);
    printToCanvas(theta.forEachGreyscalePixel(v => v * 1), "clamped directions");

    let thinned = ImageProcessing.thinSobelEdges(gradient, thetaClamped);
    printToCanvas(thinned, "thinned");

}