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

var imgArr = [];
var cellArr = [];

var collectionArea;
var selectedImg;
var rotateBtn;
var deleteBtn;
var handTool = false;
var gridSize = 16;
const SIZE_PX = 32;
const GRID_LINE_W =2;
var gridX = 16;
var gridY = 16;
//var gridSize = gridX * gridY;
var cellSize = 32;
var cellBorderSize =2;
var canvasX = (gridX * cellSize) + (cellBorderSize*(gridX+1))
var canvasY = (gridY * cellSize) + (cellBorderSize*(gridY+1))

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
  // but just to have in case there is a need.
  //
  window.mainCanvas = createCanvas(canvasX,canvasY);
  window.mainCanvas.parent('mainCanvas');
  window.mainCtx = window.mainCanvas.canvas.getContext('2d');
    window.mainCanvas = background(0);
    // This is by default
    frameRate(60);
    // Setting the pixel density to one for now so it can be the same across devices
    pixelDensity(1);

    //  Events for the ToolBox buttons
    collectionArea = document.querySelector('#mapMkrCol');
    selectedImg = document.querySelector('#mapMkrSelImg');
    rotateBtn = document.querySelector('#mapMkrBtnRotate');
    deleteBtn = document.querySelector('#mapMkrBtnDel');

    rotateBtn.classList.add('mapMkrHide');
    deleteBtn.classList.add('mapMkrHide');

    rotateBtn.addEventListener('click', rotateCellImage);
    deleteBtn.addEventListener('click', deleteCellImage);

    var toolBxBtns = document.querySelectorAll('.mapMkrTbBtn');

    for (var x = 0; x < toolBxBtns.length; x++) {
        toolBxBtns[x].addEventListener('click',
            selectCategory);
    }

    var visBtns = document.querySelectorAll('.vis');

    for (var i = 0; i < visBtns.length; i++) {
        visBtns[i].addEventListener('click', toggleVis);
    }


    window.gridTree = new QuadTree({ x: 0, y: 0, width: window.mainCanvas.width, height: window.mainCanvas.height }, false, 7);

    //
    // This is the Grid Canvas that will sit on top
    //
    window.gridCanvas = document.createElement('canvas');
    window.gridCanvas.id = 'gridCanvas`';
    window.gridCanvas.height = window.mainCanvas.height;
    window.gridCanvas.width = window.mainCanvas.width;
    document.querySelector('#mainCanvas').appendChild(window.gridCanvas);
    window.gridCtx = window.gridCanvas.getContext('2d');

    //
    // Temporary p5.js offscreen graphics buffer used to draw the graph
    // Just in case if its needed
    //
    window.gridGraph = createGraphics(window.mainCanvas.width, window.mainCanvas.height);

    var size = gridSize;
    grid(gridX, gridY);
    createGridPoints(gridX, gridY);
    createCellObjects(gridX, gridY);


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
            window.currentSelectImg = null;
            document.querySelector('#mainCanvas').classList.add('hoverPointer');
            //window.mainCanvas.canvas.classList.add('hoverPointer');
            window.handTool = true;
            break;
    }
}

/**Sok_2520764_thannary
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
            var tempImgEle = document.createElement('img');
            tempImgEle.classList.add('mapMkrColItem');
            tempImgEle.height = SIZE_PX;
            tempImgEle.width = SIZE_PX;
            tempImgEle.id = 'imgIdx-' + x;
            tempImgEle.setAttribute('title', imgData.coll[x].name);

            //
            // Setting the selected image index
            // and displaying the current selected image
            //
            // This has grown since and should be in a function
            //
            tempImgEle.addEventListener('click', collItemSelected);


            window.gridGraph.image(window.imgArr[imgData.coll[x].src],
                0, 0,
                SIZE_PX, SIZE_PX,
                imgData.coll[x].x, imgData.coll[x].y,
                imgData.coll[x].width, imgData.coll[x].height);
            tempImgEle.src = window.gridGraph.elt.toDataURL();
            collectionArea.appendChild(tempImgEle);
            window.gridGraph.clear();
        }
    }
    window.gridGraph.resizeCanvas(window.mainCanvas.width, window.mainCanvas.height);
}

function collItemSelected() {
    window.handTool = false;
    document.querySelector('#mainCanvas').classList.remove('hoverPointer');
    rotateBtn.classList.add('mapMkrHide');
    deleteBtn.classList.add('mapMkrHide');
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

function cellItemSelected() {
    rotateBtn.classList.remove('mapMkrHide');
    deleteBtn.classList.remove('mapMkrHide');
    window.gridGraph.resizeCanvas(SIZE_PX * 2, SIZE_PX * 2);
    var selectImg = window.cellArr[window.currentCell].layers[window.currentSelectImg];

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


/**
 * This is the main loop - p5.js function
 * @function draw
*/
function draw() {
  if(drawing){
    drawCell();
  }
    update();
    render();
}


/**
 * Update canvas content.
 * (rotate,move)
 * @function update
 */
function update() {

}


/**
 * This is the drawing section
 * @function render
 */
function render() {
    clear();

    for (var x = 0, len = window.cellArr.length; x < len; x++) {
        window.cellArr[x].render();
    }

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
    for (var y = 0; y < size.y; y++) {
        cord.x += SIZE_PX + (GRID_LINE_W / 2);
        window.gridGraph.push();
        window.gridGraph.strokeWeight(GRID_LINE_W);
        window.gridGraph.stroke(56);
        window.gridGraph.line(0, cord.x, width, cord.x);
        window.gridGraph.pop();
        cord.x += (GRID_LINE_W / 2);
    }

    //
    // Draw vertical lines as we go right the screen
    //
    for (var x = 0; x < size.x; x++) {
        cord.y += SIZE_PX + (GRID_LINE_W / 2);
        window.gridGraph.push();
        window.gridGraph.strokeWeight(GRID_LINE_W);
        window.gridGraph.stroke(56);
        window.gridGraph.line(cord.y, 0, cord.y, height);
        window.gridGraph.pop();
        cord.y += (GRID_LINE_W / 2);
    }

    window.gridCtx.drawImage(window.gridGraph.elt, 0, 0);
    window.gridGraph.clear();
}

function createGridPoints(size) {
    var cord = { x: 0, y: 0 };
    var center = 0;
    console.log(size.y);
    console.log(size.x);
    for (var y = 0; y < size.y; y++) {
        for (var x = 0; x < size.x; x++) {
            window.gridPointsArr.push(new MainObj({ x: cord.x, y: cord.y }, SIZE_PX, SIZE_PX));
            cord.x += SIZE_PX + GRID_LINE_W / 2;
        }
        cord.x = 0;
        cord.y += SIZE_PX + GRID_LINE_W / 2;
    }

    window.gridTree.insert(window.gridPointsArr);
}

function createCellObjects(size) {
    //
    // At a later time it can be determined if we want to combine the cellArr with the gridPointsArr
    // cellArr has the center cord instead of top left
    //

    var cord = { x: 0, y: 0 };
    var center = 0;
    for (var y = 0; y < size.y; y++) {
        for (var x = 0; x < size.x; x++) {
            window.cellArr.push(new MainObj({ x: cord.x + (SIZE_PX / 2), y: cord.y + (SIZE_PX / 2) }, SIZE_PX, SIZE_PX));
            cord.x += SIZE_PX + GRID_LINE_W;
        }
        cord.x = 0;
        cord.y += SIZE_PX + GRID_LINE_W;
    }
}


/**
 * Called when the mouse is pressed - p5.js function
 * @function mousePressed
 */
function mousePressed() {

    var cord = { x: 0, y: 0 };
    cord.x = window.mouseX;
    cord.y = window.mouseY;


    // Only looking for a cell if user clicked within the canvas
    //
    if (cord.x < 0 + width &&
        cord.x > 0 &&
        cord.y < 0 + height &&
        cord.y > 0) {
          drawing = true;
        //window.gridTree.insert(cord);
        findCell(cord);
        console.log("pressed");
        //gridTreeReset();
        if (window.currentCell !== null) {
            var tempCell = window.cellArr[window.currentCell];

            if (window.handTool) {
                findClickedObj(cord);
                if (window.currentSelectImg !== null) {
                    cellItemSelected();
                }
            }
             else if (window.currentSelectImg !== null) {
                var selectImg = imgData.coll[window.currentSelectImg];
                tempCell.layers[selectImg.layer] = new MainObj({ x: selectImg.x, y: selectImg.y },
                    selectImg.width, selectImg.height, 0, selectImg.src);
            }
        }
    }
}
function mouseReleased(){
  drawing =false;
  //gridTreeReset();
  console.log("released");
}
function findCell(cord) {
    window.currentCell = null;
    //var tempCord = { x: cord.x, y: cord.y, width: 10, height: 10 };
    //var tempCord = { x: cord.x, y: cord.y };
    // var arrDist = [];
    var cells = window.gridPointsArr;

    // var cnt = 0;

    console.log('here: ' + cells.length);
    for (var x = 0, len = window.gridPointsArr.length; x < len; x++) {
        //console.log('looking');
        var cell = cells[x];
        //cnt++;

        // if (cord === cell) {
        //     continue;
        // }

        if (cord.x < cell.x + cell.width &&
            cord.x > cell.x &&
            cord.y < cell.y + cell.height &&
            cord.y > cell.y) {
            window.currentCell = window.gridPointsArr.indexOf(cell);;
            //console.log('found');
            break;
        }

    }

    //console.log('count' + cnt);
}

function findClickedObj(cord) {

    window.currentSelectImg = null;

    window.gridGraph.resizeCanvas(SIZE_PX, SIZE_PX);
    //
    // Going through the layers backyard from top to bottom
    //
    var tempCell = window.cellArr[window.currentCell];
    for (var x = tempCell.layers.length - 1; x >= 0; x--) {
        if (tempCell.layers[x] != undefined) {
            window.gridGraph.image(window.imgArr[tempCell.layers[x].src],
                0, 0,
                SIZE_PX, SIZE_PX,
                tempCell.layers[x].x, tempCell.layers[x].y,
                tempCell.layers[x].width, tempCell.layers[x].height);
            window.gridGraph.loadPixels();
            //
            // The doc mentions that is faster accessing the pixels array directly
            // For now just using the get p5.js function
            //

            var tempPixel = window.gridGraph.get((cord.x - tempCell.x) + (SIZE_PX / 2),
                (cord.y - tempCell.y) + (SIZE_PX / 2));

            //
            // Break since we have found an image at this layer no need to keep looking
            //
            if (tempPixel[3] !== 0) {
                window.currentSelectImg = x;
                console.log(window.currentSelectImg);
                break;
            }


        }
    }
    console.log(tempCell.x + ' ' + tempCell.y);
    console.log(cord);
    window.gridGraph.clear();
    window.gridGraph.resizeCanvas(window.mainCanvas.width, window.mainCanvas.height);
}

function cellInset(canvasCord, imgCord) {
    window.cellArr.push()
}

function deleteCellImage() {
    delete window.cellArr[window.currentCell].layers[window.currentSelectImg];
    window.currentSelectImg = null;
    selectedImg.src= '';
    rotateBtn.classList.add('mapMkrHide');
    deleteBtn.classList.add('mapMkrHide');
}

function rotateCellImage() {
    var selectImg = window.cellArr[window.currentCell].layers[window.currentSelectImg];
    selectImg.turn();
}

function toggleVis(){
  var btn = document.querySelector("#"+this.id);
  btn.classList.add('hide');

}

function drawCell(){
  // var cord = { x: 0, y: 0 };
  // cord.x = window.mouseX;
  // cord.y = window.mouseY;
  //cord.width = 2;
  //cord.height = 2;
  //window.gridTree.insert(cord);
  findCell();
  //gridTreeReset();
  if (window.currentCell !== null) {
    var tempCell = window.cellArr[window.currentCell];
    if (window.currentSelectImg !== null) {
       var selectImg = imgData.coll[window.currentSelectImg];
       tempCell.layers[selectImg.layer] = new MainObj({ x: selectImg.x, y: selectImg.y },
           selectImg.width, selectImg.height, 0, selectImg.src);
   }
 }
}
function gridTreeReset(){
  window.gridTree.clear();
  window.gridTree.insert(window.gridPointsArr);
}
