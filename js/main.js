'use strict';

var mainCanvas;
var mainCtx;
var gridCanvas;
var gridGraph;
var gridPointsArr = [];
var gridTree;
var currentCell = null;
var currentSelectImg = null;
var drawing = false;
var pixelArr;

var gridCells;

var imgArr = [];
var cellArr = [];

var collectionArea;
var selectedImg;
var rotateBtn;
var deleteBtn;
var handTool = false;

const SIZE_PX = 64;
var GRID_LINE_W = 2;
var gridX = 12;
var gridY = 8;
var gridSize = { x: gridX, y: gridY };
var gridVis = true;
var cellSize = SIZE_PX;
var cellBorderSize = GRID_LINE_W;
var canvasX = (gridX * cellSize) + (cellBorderSize * (gridX + 1))
var canvasY = (gridY * cellSize) + (cellBorderSize * (gridY + 1))

function preload() {
    window.imgArr['main'] = loadImage("img/stage01.png");
}


/**
 * Setup Initialize Content - p5.js function
 * @function setup
 */

function setup() {
    //
    // Not really needed since p5.js function access the main canvas directly
    // but just to have in case there is a need..
    //
    window.mainCanvas = createCanvas(canvasX, canvasY);
    window.mainCanvas.parent('mainCanvas');
    window.mainCtx = window.mainCanvas.canvas.getContext('2d');
    // This is by default
    frameRate(60);
    // Setting the pixel density to one for now so it can be the same across devices
    pixelDensity(1);

    //  Events for the ToolBox buttons
    collectionArea = document.querySelector('#mapMkrCol');
    selectedImg = document.querySelector('#mapMkrSelImg');
    rotateBtn = document.querySelector('#mapMkrBtnRotate');
    deleteBtn = document.querySelector('#mapMkrBtnDel');

    //
    // Disabling the delete and rotate buttons
    //
    rotateBtn.disabled = true;
    deleteBtn.disabled = true;

    //deleteBtn.classList.add('mapMkrHide');

    rotateBtn.addEventListener('click', rotateCellImage);
    deleteBtn.addEventListener('click', deleteCellImage);

    var toolBxBtns = document.querySelectorAll('.mapMkrTbBtn');

    for (var x = 0; x < toolBxBtns.length; x++) {
        toolBxBtns[x].addEventListener('click',
            selectCategory);
    }

    var visBtns = document.querySelectorAll('.vis');

    for (var i = 0; i < visBtns.length; i++) {
        visBtns[i].addEventListener('click',
            toggleVis);
    }
    var printBtn = document.querySelector('#printBtn');
    printBtn.addEventListener('click', printMap, false);

    var saveBtn = document.querySelector('#saveBtn');
    saveBtn.addEventListener('click', saveMap, false);

    window.gridTree = new QuadTree({ x: 0, y: 0, width: window.mainCanvas.width, height: window.mainCanvas.height }, false, 7);

    //
    // This is the Grid Canvas that will sit on top
    //
    window.gridCanvas = document.createElement('canvas');
    window.gridCanvas.id = 'gridCanvas';
    window.gridCanvas.height = window.mainCanvas.height;
    window.gridCanvas.width = window.mainCanvas.width;
    document.querySelector('#mainCanvas').appendChild(window.gridCanvas);
    window.gridCtx = window.gridCanvas.getContext('2d');

    //
    // Temporary p5.js offscreen graphics buffer used to draw the graph
    // Just in case if its needed
    //
    window.gridGraph = createGraphics(window.mainCanvas.width, window.mainCanvas.height);

    grid(gridSize);
    createGridPoints(gridSize);
    window.gridCells = new CellsObj(gridSize, SIZE_PX, GRID_LINE_W);
    //set default tile
    window.setDefault();
}


/**
 * Selecting which layer/category based on the id of the buttons
 * @function selectCategory
 */

function selectCategory() {
    switch (this.id) {
        case 'mapMkrBtnFlr':
            buildCollByLayer(0);
            break;
        case 'mapMkrBtnWall':
            buildCollByLayer(1);
            break;
        case 'mapMkrBtnObj':
            buildCollByLayer(2);
            break;
        case 'mapMkrBtnGrd':
            //TO DO add popup for selecting gird size
            break;

        case 'mapMkrBtnHand':
            //
            drawing = false;
            window.currentSelectImg = null;
            document.querySelector('#mainCanvas').classList.add('hoverPointer');
            //window.mainCanvas.canvas.classList.add('hoverPointer');
            window.handTool = true;
            break;
    }
}

/**
 * Build html image elements of the avaible images for a particular layer/category
 * @function buildCollByLayer
 */
function buildCollByLayer(layer) {
    //
    // Found places where they mentioned that this
    //   collectionArea.innerHTML = '';
    // could potentially be slower and that this is faster
    //   while (collectionArea.firstChild) {
    //      collectionArea.removeChild(collectionArea.firstChild);
    //   }
    //
    //
    collectionArea.innerHTML = '';
    window.gridGraph.resizeCanvas(SIZE_PX, SIZE_PX);
    for (var x = 0; x < imgData.coll.length; x++) {
        if (imgData.coll[x].layer === layer) {
          //cretae div
          var tempDivEle = document.createElement('div');
          tempDivEle.classList.add('tile-item');
          tempDivEle.classList.add('col-md-2');

            var tempCardEle = document.createElement('div');
            tempCardEle.classList.add('item-inner');
            //create img
            var tempImgEle = document.createElement('img');
            //tempImgEle.classList.add('card-img-top');
            tempImgEle.classList.add('mapMkrColItem');
            tempImgEle.height = SIZE_PX;
            tempImgEle.width = SIZE_PX;
            tempImgEle.id = 'imgIdx-' + x;
            tempImgEle.setAttribute('title', imgData.coll[x].name);
            //insert img src
            window.gridGraph.image(window.imgArr[imgData.coll[x].src],
                0, 0,
                SIZE_PX, SIZE_PX,
                imgData.coll[x].x, imgData.coll[x].y,
                imgData.coll[x].width, imgData.coll[x].height);
            tempImgEle.src = window.gridGraph.elt.toDataURL();
            //add event
            tempImgEle.addEventListener('click', collItemSelected);
            //create label
            var tempLblEle = document.createElement('h5');
            //tempLblEle.classList.add('card-title');
            var lblText = imgData.coll[x].name;
            //console.log(lblText);
            tempLblEle.innerHTML = lblText;
            //insert img and label into div
            tempCardEle.appendChild(tempImgEle);
            tempCardEle.appendChild(tempLblEle);
            tempDivEle.appendChild(tempCardEle);

            //add each div to collection
            collectionArea.appendChild(tempDivEle);
            window.gridGraph.clear();
        }
    }
    window.gridGraph.resizeCanvas(window.mainCanvas.width, window.mainCanvas.height);
}

function collItemSelected() {
    window.handTool = false;
    document.querySelector('#mainCanvas').classList.remove('hoverPointer');
    rotateBtn.disabled = true;
    deleteBtn.disabled = true;
    //deleteBtn.classList.add('mapMkrHide');
    //window.gridGraph.resizeCanvas(SIZE_PX, SIZE_PX);
    window.gridGraph.resizeCanvas(SIZE_PX * 2, SIZE_PX * 2);
    window.currentSelectImg = this.id.split('-')[1];
    var selectImg = imgData.coll[window.currentSelectImg];
    window.gridGraph.image(window.imgArr[selectImg.src],
        0, 0,
        SIZE_PX * 2, SIZE_PX * 2,
        selectImg.x, selectImg.y,
        selectImg.width, selectImg.height);
    //64, 64);
    selectedImg.src = window.gridGraph.elt.toDataURL();
    window.gridGraph.clear();
    window.gridGraph.resizeCanvas(window.mainCanvas.width, window.mainCanvas.height);
}

function setDefault() {
  buildCollByLayer(0);

    window.gridGraph.resizeCanvas(SIZE_PX * 2, SIZE_PX * 2);
    window.currentSelectImg = 0;
    var selectImg = imgData.coll[0];
    window.gridGraph.image(window.imgArr[selectImg.src],
        0, 0,
        SIZE_PX * 2, SIZE_PX * 2,
        selectImg.x, selectImg.y,
        selectImg.width, selectImg.height);
    //64, 64);
    selectedImg.src = window.gridGraph.elt.toDataURL();
    window.gridGraph.clear();
    window.gridGraph.resizeCanvas(window.mainCanvas.width, window.mainCanvas.height);
}

function cellItemSelected() {
    rotateBtn.disabled = false;
    deleteBtn.disabled = false;
    selectedImg.src = window.gridCells.getCurrentImageEncode();
}


/**
 * This is the main loop - p5.js function
 * @function draw
*/
function draw() {
    update();
    render();
}


/**
 * Update canvas content.
 * (rotate,move)
 * @function update
 */
function update() {
    if (drawing) {
        updateCells();
    }
}


/**
 * This is the drawing section
 * @function render
 */
function render() {
    clear();
    window.gridCells.drawCells();
}



/**
 * Draw the grid based on x - col and y - row
 * @function grid
 */

function grid(size) {
    var cord = { x: 0, y: 0 };
    //
    // Draw horizontal lines as we go down the screen
    //
    for (var y = 0; y < size.y + 1; y++) {
        cord.x += (GRID_LINE_W / 2);
        window.gridGraph.push();
        window.gridGraph.strokeWeight(GRID_LINE_W);
        window.gridGraph.stroke('#bfdbf7');
        window.gridGraph.line(0, cord.x, width, cord.x);
        window.gridGraph.pop();
        cord.x += SIZE_PX + (GRID_LINE_W / 2);
    }

    //
    // Draw vertical lines as we go right the screen
    //
    for (var x = 0; x < size.x + 1; x++) {
        cord.y += (GRID_LINE_W / 2);
        window.gridGraph.push();
        window.gridGraph.strokeWeight(GRID_LINE_W);
        window.gridGraph.stroke('#bfdbf7');
        window.gridGraph.line(cord.y, 0, cord.y, height);
        window.gridGraph.pop();
        cord.y += SIZE_PX + (GRID_LINE_W / 2);
    }

    window.gridCtx.drawImage(window.gridGraph.elt, 0, 0);
    window.gridGraph.clear();
}


/**
 *
 * Creating an array of Grid Points based on top left
 * @function createGridPoints
 */

function createGridPoints(size) {
    window.gridPointsArr = [];
    var cord = { x: 0, y: 0 };
    var center = 0;
    cord.x = GRID_LINE_W;
    cord.y = GRID_LINE_W;
    for (var y = 0; y < size.y; y++) {
        for (var x = 0; x < size.x; x++) {
            window.gridPointsArr.push(new MainObj({ x: cord.x, y: cord.y }, SIZE_PX, SIZE_PX));
            cord.x += SIZE_PX + GRID_LINE_W;

        }
        cord.x = GRID_LINE_W;
        cord.y += SIZE_PX + GRID_LINE_W;
    }

    window.gridTree.insert(window.gridPointsArr);
}

/**
 * Called when the mouse is pressed - p5.js function
 * @function mousePressed
 */
function mousePressed() {

    var cord = { x: 0, y: 0 };
    cord.x = window.mouseX;
    cord.y = window.mouseY;
    cord.width = 2;
    cord.height = 2;

    // Only looking for a cell if user clicked within the canvas
    //
    if (cord.x < 0 + width &&
        cord.x > 0 &&
        cord.y < 0 + height &&
        cord.y > 0) {

        window.gridTree.insert(cord);
        findCell(cord);
        console.log("pressed");
        //gridTreeReset();
        if (window.gridCells.currentCell !== null) {

            if (window.handTool) {
                window.gridCells.findImgByCord(cord);
                if (window.gridCells.currentLayer !== null) {
                    cellItemSelected();
                } else {
                    rotateBtn.disabled = true;
                    deleteBtn.disabled = true;
                }
            }
            else if (window.currentSelectImg !== null) {
                drawing = true;
                var selectImg = imgData.coll[window.currentSelectImg];
                window.gridCells.updateCurrentCellImg(selectImg);
            }
        }
    }
}
function mouseReleased() {
    drawing = false;
    gridTreeReset();
    //console.log("released");
}
function findCell(cord) {
    window.currentCell = null;
    //var tempCord = { x: cord.x, y: cord.y, width: 10, height: 10 };
    //var tempCord = { x: cord.x, y: cord.y };
    var arrDist = [];
    var cells = window.gridTree.retrieve(cord);

    var cnt = 0;

    //console.log('here: ' + cells.length);
    for (var x = 0, len = cells.length; x < len; x++) {
        //console.log('looking');
        var cell = cells[x];
        //cnt++;

        if (cord === cell) {
            continue;
        }

        if (cord.x < cell.x + cell.width &&
            cord.x > cell.x &&
            cord.y < cell.y + cell.height &&
            cord.y > cell.y) {
            window.gridCells.currentCell = window.gridPointsArr.indexOf(cell);
            //console.log('found');
            break;
        }

    }

    //console.log('count' + cnt);
}

function deleteCellImage() {
    window.gridCells.deleteCellImageByLayer();
    selectedImg.src = '';
    rotateBtn.disabled = true;
    deleteBtn.disabled = true;
}

function rotateCellImage() {
    window.gridCells.rotateCellImg();
}

function toggleVis() {
    //var btn = document.querySelector(this.id);
    var layer = this.name.split("-")[1];
    //console.log(layer);
    var iconOn = document.querySelector("#" + this.id + "On");
    var iconOff = document.querySelector("#" + this.id + "Off");
    //console.log(iconOff);
    var gridLines = document.querySelector("#gridCanvas");
    //console.log(gridLines);
    if (iconOn.classList.contains("hide")) {
        iconOn.classList.remove("hide");
        iconOff.classList.add("hide");
        if (layer == 3) {
            gridLines.classList.remove("hide");
            GRID_LINE_W = 2;
            createGridPoints(gridSize);
            window.gridCells.update(gridSize, SIZE_PX, GRID_LINE_W);
            window.gridCells.updateCellsCords(gridX);
        } else {
            window.gridCells.setLayerVis(layer, true);

        }
    } else {
        iconOff.classList.remove("hide");
        iconOn.classList.add("hide");
        if (layer == 3) {
            gridLines.classList.add("hide");
            GRID_LINE_W = 0;
            createGridPoints(gridSize);
            window.gridCells.update(gridSize, SIZE_PX, GRID_LINE_W);
            window.gridCells.updateCellsCords(gridX);
        } else {
            window.gridCells.setLayerVis(layer, false);
        }
    }


}


/**
 * Updating the layer of the cells as the user is clicking/holding
 * @function updateCells
 */
function updateCells() {
    var cord = { x: 0, y: 0 };
    cord.x = window.mouseX;
    cord.y = window.mouseY;
    cord.width = 2;
    cord.height = 2;
    window.gridTree.insert(cord);
    findCell(cord);
    gridTreeReset();
    if (window.gridCells.currentCell !== null) {
        if (window.currentSelectImg !== null) {
            var selectImg = imgData.coll[window.currentSelectImg];
            window.gridCells.updateCurrentCellImg(selectImg);
        }
    }
}
function gridTreeReset() {
    window.gridTree.clear();
    window.gridTree.insert(window.gridPointsArr);
}

function printMap(){
  var gridVis = document.querySelector("#GrdVisOn");
  //console.log(gridVis);
    if (gridVis.classList.contains("hide")){
      window.print();
    }
    else {
      GRID_LINE_W = 0;
      createGridPoints(gridSize);
      window.gridCells.update(gridSize, SIZE_PX, GRID_LINE_W);
      window.gridCells.updateCellsCords(gridX);
      window.print();
      GRID_LINE_W = 2;
      createGridPoints(gridSize);
      window.gridCells.update(gridSize, SIZE_PX, GRID_LINE_W);
      window.gridCells.updateCellsCords(gridX);
    }
    return false;
}

function saveMap(){
  var gridVis = document.querySelector("#GrdVisOn");
    if (gridVis.classList.contains("hide")){
      save(window.mainCanvas, 'myMap.jpg');
    }
    else {
    GRID_LINE_W = 0;
    createGridPoints(gridSize);
    window.gridCells.update(gridSize, SIZE_PX, GRID_LINE_W);
    window.gridCells.updateCellsCords(gridX);
    save(window.mainCanvas, 'myMap.jpg');
    GRID_LINE_W = 2;
    createGridPoints(gridSize);
    window.gridCells.update(gridSize, SIZE_PX, GRID_LINE_W);
    window.gridCells.updateCellsCords(gridX);
  }
  return false;
}
