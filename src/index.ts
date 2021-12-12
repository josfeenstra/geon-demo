// Name:    index.ts
// Author:  Jos Feenstra
// Purpose: Entry point

import { Core, FpsCounter, HelpGl, SwapApp } from "Geon";
import { BezierApp } from "./apps/geometry-apps/bezier-app";
import { BezierCpApp } from "./apps/geometry-apps/bezier-cp-app";
import { IcosahedronApp } from "./apps/geometry-apps/icosahedron-app";
import { LoftApp } from "./apps/geometry-apps/loft-app";
import { SplineApp } from "./apps/geometry-apps/spline.app";
import { SurfaceApp } from "./apps/geometry-apps/surface-app";
import { SurfaceCpApp } from "./apps/geometry-apps/surface-cp-app";
import { LeastSquaresApp } from "./apps/math-apps/least-squares-app";
import { PerlinApp } from "./apps/math-apps/perlin-app";
import { BillboardApp } from "./apps/render-apps/billboard-app";
import { DotApp3 } from "./apps/render-apps/dot-app3";
import { GeometryApp } from "./apps/render-apps/geometry-app";
import { SphericalOneApp } from "./apps/spherical-apps/spherical-one-app";
import { SphericalThreeApp } from "./apps/spherical-apps/spherical-three-app";
import { SphericalTwoApp } from "./apps/spherical-apps/spherical-two-app";
import { MeshInspectorApp } from "./apps/render-apps/mesh-inspector-app";
import { ObjLoaderApp } from "./apps/util-apps/obj-loader-app";
import { MultiRendererApp } from "./apps/util-apps/renderer-app";
import { PhongApp } from "./apps/render-apps/phong-app";
import { CubesPhongApp } from "./apps/render-apps/cubes-phong-app";
import { ZebraApp } from "./apps/render-apps/zebra-app";
import { TorusApp } from "./apps/geometry-apps/torus-app";
import { CannyApp } from "./apps/scientific-apps/canny-app";
import { DrawTargetApp } from "./apps/render-apps/draw-target-app";
import { LeastSquaresCircleApp } from "./apps/math-apps/least-squares-circle-app";
import { SkyboxApp } from "./apps/render-apps/skybox-app";
import { SphericalApp } from "./apps/spherical-apps/spherical-app";
import { MarchingCubeApp } from "./apps/algo-apps/marching-app";
import { MicApp } from "./apps/util-apps/mic-app";
import { WaveApp } from "./apps/algo-apps/wave-app";

function main() {
    // get references of all items on the canvas
    let canvas = document.getElementById("canvas")! as HTMLCanvasElement;
    let ui = document.getElementById("interface") as HTMLDivElement;

    // init core
    let gl = HelpGl.initWebglContext(canvas)!;
    let core = new Core(canvas, gl, ui);
    HelpGl.resizeViewportToCanvas(gl);

    //@ts-ignore
    window.core = core;

    // init swap app
    let appCollection = [
        WaveApp,
        MicApp,
        MarchingCubeApp,
        SkyboxApp,
        LeastSquaresCircleApp,
        DrawTargetApp,
        CannyApp,
        TorusApp,
        ZebraApp,
        CubesPhongApp,
        PhongApp,
        MultiRendererApp,
        BillboardApp,
        PerlinApp,
        SurfaceApp,
        BezierApp,
        BezierCpApp,
        SurfaceCpApp,
        SplineApp,
        LoftApp,
        SphericalApp,
        SphericalThreeApp,
        // SphericalTwoApp, // I broke this...
        SphericalOneApp,
        IcosahedronApp,
        DotApp3,
        LeastSquaresApp,
        MeshInspectorApp,
        ObjLoaderApp,
    ];

    let swapApp = new SwapApp(gl, core, appCollection);
    core.addApp(swapApp);

    // check if the hash matches one of the app names, if so, switch to that app. if not, goto the default start app.
    let defaultIndex = 0;
    swapApp.swapFromUrl(location.hash, defaultIndex);

    // time
    let accumulated = 0;
    let counter = FpsCounter.new();

    // infinite loop
    function loop(elapsed: number) {
        let dt = elapsed - accumulated;
        accumulated = elapsed;

        counter._update(dt);
        document.title = "fps: " + counter.getFps();

        core.update(dt);
        core.draw();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

window.addEventListener("load", main, false);
