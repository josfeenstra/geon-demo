import { App, Scene, DebugRenderer, Camera, UI, MultiLine, Plane, Vector3, DrawSpeed, InputState, LineShader, Bitmap, Color, COLOR, ImageMesh, Vector2, Util, Time, InputHandler } from "Geon";
import { TileSolver } from "Engine/algorithms/TileSolver";
import { TileAtlas } from "Engine/algorithms/TileAtlas";

export class WaveApp extends App {

    // render
    scene: Scene;
    debug: DebugRenderer;
    grid: LineShader;

    constructor(gl: WebGLRenderingContext) {
        super(gl);

        let canvas = gl.canvas as HTMLCanvasElement;
        let camera = new Camera(canvas, -2, true);
        camera.setState([-25.673, -0.51242, -6.2000, -2, 1.4800000000000004,4.699999999999986]);
        this.grid = new LineShader(gl, [0.3, 0.3, 0.3, 1]);
        this.debug = DebugRenderer.new(gl);
        this.scene = new Scene(camera);

        // init some state
    }

    customTiles() {
        
        // console.log(atlas);
        // let tileData = [
        //     [
        //         _, _, _,
        //         B, B, B,
        //         _, _, _,
        //     ],
        //     [
        //         B, B, B,
        //         _, _, _,
        //         B, B, B,
        //     ],
        //     [
        //         B, _, B,
        //         _, _, _,
        //         B, _, B,
        //     ],
        //     [
        //         B, _, B,
        //         B, _, B,
        //         _, _, _,
        //     ],
        //     [
        //         _, _, _,
        //         B, _, B,
        //         B, _, B,
        //     ],
        //     [
        //         _, B, B,
        //         _, _, _,
        //         _, B, B,
        //     ],
        //     [
        //         B, B, _,
        //         _, _, _,
        //         B, B, _,
        //     ],
        // ];

        // let tiles: Bitmap[] = [];
        // for (let td of tileData) {
        //     let tile = Bitmap.new(3,3);
        //     tile.fillWithColors(td);
        //     tiles.push(tile);
        // }
    }

    async start() {
        this.startGrid();
        let plane = Plane.WorldYZ().moveTo(Vector3.new(-10,0,4));

        // fill some state | fill up shaders
        let _ = COLOR.white.toInt();
        let B = COLOR.black.toInt();
        let U = COLOR.blue.toInt();
        // let sample = Bitmap.new(9,9);
        // sample.fillWithColors([
        //    B, B, B, B, _, B, B, B, B,
        //    B, B, B, B, _, B, B, B, B,
        //    B, B, _, _, _, _, _, B, B,
        //    B, B, _, _, _, _, _, B, B,
        //    _, _, _, _, _, _, _, _, _,
        //    B, B, _, _, _, _, _, B, B,
        //    B, B, _, _, _, _, _, B, B,
        //    B, B, B, B, _, B, B, B, B,
        //    B, B, B, B, _, B, B, B, B,
        // ])

        let sample = Bitmap.new(4,4);
        sample.fillWithColors([
            _, B, B, B,
            _, B, U, B,
            _, B, B, B,
            _, _, _, _,
         ])
        // this.debug.set(ImageMesh.new(sample, Plane.WorldXY(), 1, false, true), "sample");
        this.debug.set(ImageMesh.new(sample, Plane.WorldXY().moveTo(Vector3.new(1,0,0)), 1, false, true), "sample2");

        sample.fillWithColors([
            _, U, B, U,
            _, B, _, B,
            _, U, B, U,
            _, _, _, _,
         ])

        // let sample = Bitmap.new(3,3);
        // sample.fillWithColors([
        //     B, B, B,
        //     _, _, _,
        //     B, B, B,
        //  ])

        

        // create atlas 
        let atlas = TileAtlas.fromPeriodicSourceImage(sample, 2);
        // TileAtlas.fromSourceImageBetter(sample2, 3);
        console.log(atlas.prototypes);
        // atlas.printAllConnections();
        // console.log(atlas.canBeConnected(0, 1, D8.Right))

        // create wave
        let solver = TileSolver.new(atlas, 32, 32);
        
        // let wave = WFC.new(sample, 3, 15, 15);
        // console.log("done!");
        // solver.solve();

        while (!solver.isCollapsed()) {
            solver.solveStep()
            this.debug.set(ImageMesh.new(solver.renderResult(), plane), "result");
            await Time.sleep(10);
        }
        // this.debug.set(ImageMesh.new(solver.renderResult(), plane), "result");
        // let index = 50
        // wave.setOption(index, 0);
        // wave.removeInvalidOptions(index);
        // for (let i = 0 ; i < 1; i++) {
        //     wave.collapseStep();
        // }
        // wave.isCollapsed(true);

        
        // console.log("is collapsed?", wave.isCollapsed());
        // // console.log(doImagesOverlap(sample2, sample, Vector2.new(-1,-1)));
        
        for (let i = 0; i < solver.atlas.tiles.length; i++) {
            let plane = Plane.WorldXY().moveTo(Vector3.new(i*3,5,0));
            this.debug.set(ImageMesh.new(solver.atlas.tiles[i], plane));
        }

    }

    ui(ui: UI) {}

    startGrid() {
        let grid = MultiLine.fromGrid(Plane.WorldXY().moveTo(new Vector3(0, 0, -1)), 100, 2);
        this.grid.set(grid, DrawSpeed.StaticDraw);
    }

    update(state: InputHandler) {
        this.scene.camera.update(state);
        // update state | fill up shaders
    }

    draw() {
        this.grid.render(this.scene);
        this.debug.render(this.scene);
    }
}
