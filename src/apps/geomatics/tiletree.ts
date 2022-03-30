import { Domain, Domain2, Vector2, Vector3 } from "Geon";

export class TileTree {

    constructor(
        public bounds: Domain2,
        public maxlevel: number
        ) {}

    get topleft() {
        return Vector2.new(this.bounds.x.t0, this.bounds.y.t0);
    }

    get width() {
        return this.bounds.x.size;
    }

    get height() {
        return this.bounds.x.size;
    }

    getTile(scale: number, worldPos: Vector2) : Tile {
        console.log(worldPos)
        const norm = this.bounds.normalize(worldPos);
        console.log(norm);
        const level = this.getLevel(scale);
        const count = Math.pow(2, level);
        const tilepos = norm.scale(count).floor();
        const {x, y} = tilepos;
        return new Tile(x, y, level);
    }

    private getLevel(scale: number, factor=3) {
        
        let someWidth = this.width * factor;
        for (let level = 0; level < this.maxlevel; level++) {
            if (scale > someWidth)
                return level;
            else 
                someWidth = someWidth / 2
        }

        return this.maxlevel;
    }

}

// class TileLevel {

//     minX: number,


// 	constructor(
//         public level: number, 
//         public matrixHeight: number, 
//         public matrixWidth: number, 
//         public scaleDenominator: number, 
//         public tileHeight: number, 
//         public tileWidth: number, 
//         public topLeftCorner: number ) {

// 		const pixelSpan = scaleDenominator * 0.00028;
// 		const tileSpanX = tileWidth * pixelSpan;
// 		const tileSpanY = tileHeight * pixelSpan;

// 		this.level = level;

// 		this.minX = topLeftCorner.x;
// 		this.maxY = topLeftCorner.y;

// 		this.maxX = this.minX + tileSpanX * matrixWidth;
// 		this.minY = this.maxY - tileSpanY * matrixHeight;

// 		this.tileWidth = tileWidth;
// 		this.tileHeight = tileHeight;
// 		this.pixelSpan = pixelSpan;
// 		this.tileSpanX = tileSpanX;
// 		this.tileSpanY = tileSpanY;
// 		this.matrixWidth = matrixWidth;
// 		this.matrixHeight = matrixHeight;
// 		this.scaleDenominator = scaleDenominator;

// 	}

// 	getTileAt( position ) {

// 		const col = Math.floor( ( position.x - this.minX ) / this.tileSpanX );
// 		const row = Math.floor( this.matrixHeight - ( position.y - this.minY ) / this.tileSpanX );

// 		return new Tile( this, col, row );

// 	}

// }

export class Tile {

    constructor(
        public x: number,
        public y: number,
        public level: number,
    ) {

    }

}