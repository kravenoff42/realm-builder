'use strict';

/**
 * Wrapper function for the grid cells
 * @class {type} CellsObj
 * 
 * 
 * @property {int} currentCell Currently selected cell
 * @property {int} currentLayer Current layer within the current cell
 * 
 */
function CellsObj(gridSize, pxSize, gridLineWidth) {
    this.gridSize = gridSize;
    this.gridLineWidth = gridLineWidth;
    this.gridCellsArr = [];
    this.pxSize = pxSize;
    this.initialize();
}


CellsObj.prototype.currentCell = null;
CellsObj.prototype.currentLayer = null;

/**
 * Initialize the gridCellsArr with all the grid cells
 * Creating an array based on the center of the cell.
 * Purpose it to be able to rotate the image from the center
 * @method initialize
 */
CellsObj.prototype.initialize = function () {
    var cord = { x: 0, y: 0 };
    //
    // Initializing to our margins (grid)
    // giving space to the first line to our left and top if its set
    //
    cord.x = this.gridLineWidth;
    cord.y = this.gridLineWidth;

    //
    // Building the Cells array and
    // Storing the center coordinate of the cell 
    //
    for (var y = 0; y < this.gridSize.y; y++) {
        for (var x = 0; x < this.gridSize.x; x++) {
            this.gridCellsArr.push(new MainObj({ x: cord.x + (this.pxSize / 2), y: cord.y + (this.pxSize / 2) }, this.pxSize, this.pxSize));
            cord.x += this.pxSize + this.gridLineWidth;
        }
        cord.x = this.gridLineWidth;
        cord.y += this.pxSize + this.gridLineWidth;
    }
}

/**
 * Update the grid and pixel size.
 * Update the grid line width
 * @method update
 */

CellsObj.prototype.update = function (gridSize, pxSize, gridLineWidth) {
    this.gridSize = gridSize;
    this.pxSize = pxSize;
    this.gridLineWidth = gridLineWidth;
}

/**
 * Recalculating the coordinates of the cells
 * @method updateCellsCords
 */
CellsObj.prototype.updateCellsCords = function (maxCol) {
    var cord = { x: 0, y: 0 };
    var maxCol = maxCol;
    var col = 0;

    //
    // Initializing to our margins (grid)
    // giving space to the first line to our left and top if its set
    //
    cord.x = this.gridLineWidth;
    cord.y = this.gridLineWidth;

    //
    // Looping on the Cells array and updating the cords
    //
    for (var x = 0, len = this.gridCellsArr.length; x < len; x++) {
        this.gridCellsArr[x].updatePos({ x: cord.x + (this.pxSize / 2), y: cord.y + (this.pxSize / 2) });
        cord.x += this.pxSize + this.gridLineWidth;
        if (col === (maxCol - 1)) {
            cord.x = this.gridLineWidth;
            cord.y += this.pxSize + this.gridLineWidth;
            col = 0;
        } else {
            col++;
        }
    }
}

/**
 * If found return cell else null
 * @method getCurrentCell
 */
CellsObj.prototype.getCurrentCell = function () {
    return this.gridCellsArr[this.currentCell] || null;
}

CellsObj.prototype.getCurrentImage = function () {
    return this.getCurrentCell().layers[this.currentLayer] || null;
}

CellsObj.prototype.getCurrentImageEncode = function () {
    var selectImg = this.getCurrentImage();
    var src = null;
    window.gridGraph.resizeCanvas(this.pxSize * 2, this.pxSize * 2);

    window.gridGraph.image(window.imgArr[selectImg.src],
        0, 0,
        this.pxSize * 2, this.pxSize * 2,
        selectImg.x, selectImg.y,
        selectImg.width, selectImg.height);
    src = window.gridGraph.elt.toDataURL();
    window.gridGraph.clear();
    window.gridGraph.resizeCanvas(window.mainCanvas.width, window.mainCanvas.height);
    return src;
}

/**
 * Updating the Cell's image by layer
 * this function expects currentCell to have a value
 * @method updateCurrentCellImg 
 */
CellsObj.prototype.updateCurrentCellImg = function (selectedImg) {
    this.getCurrentCell().layers[selectedImg.layer] = new MainObj({ x: selectedImg.x, y: selectedImg.y },
        selectedImg.width, selectedImg.height, 0, selectedImg.src);

}

CellsObj.prototype.findImgByCord = function (cord) {

    this.currentLayer = null;

    //
    // Resize the temp canvas to the pixels set
    //
    window.gridGraph.resizeCanvas(this.pxSize, this.pxSize);

    //
    // Going through the layers backyard from top to bottom
    //
    var tempCell = this.getCurrentCell();

    for (var x = tempCell.layers.length - 1; x >= 0; x--) {
        if (tempCell.layers[x] != undefined) {
            window.gridGraph.push();
            window.gridGraph.imageMode(window.CENTER);
            window.gridGraph.translate(this.pxSize / 2, this.pxSize / 2);
            window.gridGraph.rotate(tempCell.layers[x].heading);
            window.gridGraph.image(window.imgArr[tempCell.layers[x].src],
                0, 0,
                this.pxSize, this.pxSize,
                tempCell.layers[x].x, tempCell.layers[x].y,
                tempCell.layers[x].width, tempCell.layers[x].height);
            window.gridGraph.loadPixels();
            //
            // The doc mentions that is faster accessing the pixels array directly
            // For now just using the get p5.js function
            //

            var tempPixel = window.gridGraph.get((cord.x - tempCell.x) + (this.pxSize / 2),
                (cord.y - tempCell.y) + (this.pxSize / 2));


            window.gridGraph.pop();
            window.gridGraph.clear();
            //
            // Break since we have found an image at this layer no need to keep looking
            //
            if (tempPixel[3] !== 0) {
                this.currentLayer = x;
                break;
            }


        }
    }

    //
    // clearing the temp canvas and resizing to default
    //
    window.gridGraph.clear();
    window.gridGraph.resizeCanvas(window.mainCanvas.width, window.mainCanvas.height);
}

CellsObj.prototype.deleteCellImageByLayer = function () {
    //delete this.getCurrentImage();
    delete this.getCurrentCell().layers[this.currentLayer];
    this.currentLayer = null;
}

CellsObj.prototype.rotateCellImg = function () {
    this.getCurrentImage().turn();
}

CellsObj.prototype.setLayerVis = function (layer, vis) {
    for (var i = 0, len = this.gridCellsArr.length; i < len; i++) {
        this.gridCellsArr[i].setLayerVis(layer, vis);
    }
}

CellsObj.prototype.drawCells = function () {
    for (var i = 0, len = this.gridCellsArr.length; i < len; i++) {
        this.gridCellsArr[i].render();
    }
}

CellsObj.prototype.returnLayerImgArr = function () {
    var tempImgArr = [];
    var tempCell = this.getCurrentCell();
    for (var x = 0; x < tempCell.layers.length; x++) {
        if (tempCell.layers[x] != undefined) {
            this.currentLayer = x;
            var tempImg = document.createElement('img');
            tempImg.alt = x;
            tempImg.height = this.pxSize;
            tempImg.width = this.pxSize;
            tempImg.src = this.getCurrentImageEncode();
            tempImgArr.push(tempImg);
        }
    }
    return (tempImgArr.length > 0) ? tempImgArr : null;
}