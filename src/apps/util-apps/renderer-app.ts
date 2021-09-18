// purpose: demonstrate new renderer capabilities

import { LineShader } from "Engine/render/shaders-old/line-shader";
import { TextureMeshShader } from "Engine/render/shaders-old/texture-mesh-shader";
import { App, Parameter, UI, MultiVector3, Random, Camera, DebugRenderer, Domain3, Vector3, GeonImage, ImageMesh, Polyline, Plane, MultiLine, DrawSpeed, InputState, Scene } from "Geon";

export class MultiRendererApp extends App {
    
    // ui
    params: Parameter[] = [];
    interface?: UI;

    // state
    points!: MultiVector3;
    rng!: Random;

    // render
    camera: Camera;
    mr: DebugRenderer;
    gs: LineShader; 
    tms: TextureMeshShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        // setup the render environment 
        let canvas = gl.canvas as HTMLCanvasElement;
        this.camera = new Camera(canvas, -2, true);
        this.camera.set(-2, 1, 1);
        this.gs = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.mr = DebugRenderer.new(gl);
        this.tms = TextureMeshShader.new(gl);
    }

    start() {
        this.startGrid();
        this.rng = Random.fromSeed(10394);

        // render a bunch of dots
        this.points = Domain3.fromRadius(10).populate(100, this.rng);
        this.mr.set(Domain3.fromRadius(10).populate(100, this.rng), "dots2")
        this.mr.set(this.points, "dots");

        // render vectors 
        this.points.forEach(v => v.add(Vector3.fromRandomUnit(this.rng)))   

        // three images
        let w = 8;
        let h = 8;
        let img = GeonImage.new(w, h);
        img.forEach((x, y) => {return [Math.random() * 255, y, 255, 1];});
        this.mr.set(ImageMesh.new(img, Vector3.new(4,0,0), Vector3.new(1,0,0), 1), "image1");
        img.forEach((x, y) => {return [255, Math.random() * 255, 255, 1];});
        this.mr.set(ImageMesh.new(img, Vector3.new(0,4,0), Vector3.new(0,1,0), 1), "image2");
        img.forEach((x, y) => {return [255, 255, Math.random() * 255, 1];});
        this.mr.set(ImageMesh.new(img, Vector3.new(0,0,4), Vector3.new(0,0,1), 1), "image3");
        img.forEach((x, y) => {return [Math.random() * 255, y, 255, 1];});
        this.mr.set(ImageMesh.new(img, Vector3.new(-4,0,0), Vector3.new(1,0,0), 1), "image4");
        img.forEach((x, y) => {return [255, Math.random() * 255, 255, 1];});
        this.mr.set(ImageMesh.new(img, Vector3.new(0,-4,0), Vector3.new(0,1,0), 1), "image5");
        img.forEach((x, y) => {return [255, 255, Math.random() * 255, 1];});
        this.mr.set(ImageMesh.new(img, Vector3.new(0,0,-4), Vector3.new(0,0,1), 1), "image6");


        // render a line
        this.mr.set(Polyline.new(this.points));
        this.mr.set(Plane.WorldXZ().moveTo(this.points.get(0)), "plane");
        // render a plane at each point
        // this.points.forEach(v => this.mr.set(Plane.WorldXZ().moveTo(v)));
        this.mr.addUi(this.interface!);
    }

    ui(ui: UI) {
        this.interface = ui; 
    }

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(new Vector3(0, 0, -1)), 100, 2);
        this.gs.set(grid, DrawSpeed.StaticDraw);
    }

    update(state: InputState) {
        this.camera.update(state);
        this.points.forEach(v => v.add(Vector3.fromRandomUnit(this.rng)))        
        this.mr.set(this.points, "dots");
    }

    draw(gl: WebGLRenderingContext) {
        const canvas = gl.canvas as HTMLCanvasElement;
        let matrix = this.camera.totalMatrix;
        let scene = new Scene(this.camera);
        this.gs.render(scene);
        this.mr.render(scene);
    }
}
