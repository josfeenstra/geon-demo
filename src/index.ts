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
import { MeshInspectorApp } from "./apps/util-apps/mesh-inspector-app";
import { ObjLoaderApp } from "./apps/util-apps/obj-loader-app";
import { MultiRendererApp } from "./template-app";


var core: Core;

function main() {
    // get references of all items on the canvas
    let canvas = document.getElementById("canvas")! as HTMLCanvasElement;
    let ui = document.getElementById("interface") as HTMLDivElement;

    // init core
    let gl = HelpGl.initWebglContext(canvas);
    core = new Core(canvas, gl, ui);

    // init swap app
    let appCollection = [
        MultiRendererApp,
        BillboardApp,
        PerlinApp,
        SurfaceApp,
        BezierApp,
        BezierCpApp,
        SurfaceCpApp,
        SplineApp,
        LoftApp,
        SphericalOneApp,
        SphericalTwoApp,
        SphericalThreeApp,
        GeometryApp,
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
