// name:    obj-loader-app.ts
// author:  Jos Feenstra
// purpose: drag an obj to the canvas, and view it on the web

import { DotShader } from "Engine/render/shaders-old/dot-shader";
import { LineShader } from "Engine/render/shaders-old/line-shader";
import { MeshDebugShader } from "Engine/render/shaders-old/mesh-debug-shader";
import { TextureMeshShader } from "Engine/render/shaders-old/texture-mesh-shader";
import { App, Camera, ShaderMesh, MultiLine, addDropFileEventListeners, InputState, Scene, MultiVector3, Vector3, loadTextFromFile, meshFromObj, Domain3, DrawSpeed, DebugRenderer, loadImageFromFile, Bitmap as Texture, InputHandler } from "Geon";

export class ObjLoaderApp extends App {
    
    dr: DebugRenderer;
    tr: TextureMeshShader;
    camera: Camera;

    constructor(gl: WebGLRenderingContext) {
        super(gl);
        let canvas = gl.canvas as HTMLCanvasElement;
        this.dr = DebugRenderer.new(gl);
        this.tr = TextureMeshShader.new(gl);
        this.camera = new Camera(canvas, undefined, true);

        addDropFileEventListeners(canvas, processFiles.bind(this));
    }

    start() {
        // nothing
    }

    update(input: InputHandler) {
        // move the camera with the mouse
        this.camera.update(input);
    }

    draw() {
        // get to-screen matrix
        let c = new Scene(this.camera);
        this.dr.render(c);
        this.tr.render(c);
        // if (this.obj == undefined)
        //     this.dotRenderer.setAndRender(
        //         MultiVector3.fromList([new Vector3(0, 0, 0), new Vector3(1, 1, 1)]),
        //         c,
        //     );
        // else {
        //     this.dotRenderer.setAndRender(this.obj!.mesh.verts, c);
        //     // this.meshRenderer.render(gl, matrix);
        //     this.lineRenderer.render(c);
        // }
    }
}

async function processFiles(this: ObjLoaderApp, files: FileList) {
    // assume its 1 file, the obj file.

    let objFile;
    let textureFile;

    for (let file of files) {
        if (file.name.includes(".obj")) {
            objFile = file;
        } else if (file.name.includes(".jpg") || file.name.includes(".png")) {
            textureFile = file;
        } else {
            console.warn(`dont know what to do with file: [${file.name}]`);
        }
    }
    if (!objFile) {
        alert("no obj found");
        return;
    }

    // see if we can build an correct obj from the files
    let objString = await loadTextFromFile(objFile);
    let model = meshFromObj(objString);
    
    // this.lines = MultiLine.fromMesh(this.obj);
    
    
    // scale the vertices
    let bounds = Domain3.fromInclude(model.mesh.verts);
    let factor = 1 / bounds.size().largestValue();
    model.mesh.verts.scale(Vector3.new(factor, factor, factor));
    
    // set

    if (textureFile) {
        console.log("flipping texture")
        let texture = await loadImageFromFile(textureFile);
        texture = Texture.fromImageData(texture).flipVer().toImageData();
        model.setTexture(texture);
        console.log("done flipping")
        this.tr.set(model, DrawSpeed.StaticDraw);
    } else {
        this.dr.set(model.mesh);
    }
    
    
    

    console.log("done!");

}
