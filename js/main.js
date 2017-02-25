'use strict';

var mainCanvas;
var mainCtx;
var gridCanvas;
var gridGraph;
var gridPointsArr = [];
var gridTree;
var currentCell = null;
var currentSelectImg = null;
var pixelArr;
var cellImagesWrap;

var gridCells;

var imgArr = [];
var cellArr = [];

var collectionArea;
var selectedImg;
var rotateBtn;
var deleteBtn;
var dimOverlay;
var handTool = false;
var gridSize = 16;
const SIZE_PX = 64;
var GRID_LINE_W = 2;
var gridX = 15;
var gridY = 10;
var gridSize = {
    x: gridX,
    y: gridY
};
var gridVis = true;
var cellSize = SIZE_PX;
var cellBorderSize = GRID_LINE_W;
var canvasX = (gridX * cellSize) + (cellBorderSize * (gridX + 1));
var canvasY = (gridY * cellSize) + (cellBorderSize * (gridY + 1));

//
// Rotate Tool Handle
//
var rotateToolHandle;
var rotateToolHeading;
var toolGrabbed = false;


//
// Features
//
var drawing = false;
var rotateTool = false;
var handTool = false;

//
// Its a pain to deal with single and double clicks
// More research can be done on this topic
//
var mouseClicks = 0;

/**
 * Load Content - p5.js function
 * @function preload
 */
function preload() {
    window.imgArr['main'] = loadImage("img/stage00.png");
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
    var canvasBounds = window.mainCanvas.elt.getBoundingClientRect();

    //
    // Not using the global mouse event because I want to have it respect the z-index
    // without having to create multiple variables to track the current state of the sketch
    // meaning are we drawing(placing tiles), selecting a cell to edit and selecting cell images (displayed on top of the canvas)
    //
    window.mainCanvas.elt.addEventListener('mousedown', canvasClicked);
    window.mainCanvas.elt.addEventListener('mouseup', canvasMouseReleased);

    // This is by default
    frameRate(60);
    // Setting the pixel density to one for now so it can be the same across devices
    pixelDensity(1);

    //  Events for the ToolBox buttons
    collectionArea = document.querySelector('#mapMkrCol');
    selectedImg = document.querySelector('#mapMkrSelImg');
    rotateBtn = document.querySelector('#mapMkrBtnRotate');
    deleteBtn = document.querySelector('#mapMkrBtnDel');

    // Disabling the delete and rotate buttons

    rotateBtn.disabled = true;
    deleteBtn.disabled = true;

    // Setting up the click events for the rotate and delete button

    rotateBtn.addEventListener('click', rotateCellImage);
    deleteBtn.addEventListener('click', deleteCellImage);

    // Adding click events for the toolbox and visibility buttons

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

    var eraseBtn = document.querySelector('#mapMkrBtnErs');
    eraseBtn.addEventListener('click', selectEraser);

    var gridBtn = document.querySelector('#mapMkrBtnGrd');
    gridBtn.addEventListener('click', toggleGridMenu);


    window.gridTree = new QuadTree({
        x: 0,
        y: 0,
        width: window.mainCanvas.width,
        height: window.mainCanvas.height
    }, false, 7);

    // This is the Grid Canvas that will sit on top

    window.gridCanvas = document.createElement('canvas');
    window.gridCanvas.id = 'gridCanvas';
    window.gridCanvas.height = window.mainCanvas.height;
    window.gridCanvas.width = window.mainCanvas.width;
    document.querySelector('#mainCanvas').appendChild(window.gridCanvas);
    window.gridCtx = window.gridCanvas.getContext('2d');

    //
    // Here wiring the mouse events for the grid canvas.
    // In this case using pure js but it could be changed to use p5.js
    // Adding the click events to both canvas because when the grid one is on top
    // if will have the focus and when hidden the mainCanvas will have the focus.
    //
    window.gridCanvas.addEventListener('mousedown', canvasClicked);
    window.gridCanvas.addEventListener('mouseup', canvasMouseReleased);





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
    //
    window.cellImagesWrap = document.querySelector('#mapMkrCellImages');

    document.querySelector('#mapMkrBtnSelCellImgX').addEventListener('click', function() {
        window.mainCanvas.elt.style.opacity = 1;
        window.gridCanvas.style.opacity = 1;
        window.cellImagesWrap.style.display = 'none';
        document.querySelector('#mapMkrCellImagesContent').innerHTML = '';
    });


    //
    // Currently just used for the rotate tool.
    // This could also be done with css transform translate and transform rotate and possibly transform-origin
    //
    // The height and width could just be the size of the cells * x for now just have it hardcoded.
    //
    window.toolCanvas = document.createElement('canvas');
    window.toolCanvas.id = 'toolCanvas';
    window.toolCanvas.classList.add('mapMkrHide');
    window.toolCanvas.height = 250;
    window.toolCanvas.width = 250;
    window.toolCtx = window.toolCanvas.getContext('2d');
    document.body.appendChild(window.toolCanvas);

    rotateToolHeading = radians(0);

    window.toolCanvas.addEventListener('mousedown', function() {
        var toolCanvBnds = window.toolCanvas.getBoundingClientRect();

        //
        // Mouse position based on the tool canvas
        //
        var mousePos = {
            x: (winMouseX - toolCanvBnds.left),
            y: (winMouseY - toolCanvBnds.top)
        };

        //
        // Create box with boundaries around the tool handle (Circle)
        //
        var topLeft = {
            x: rotateToolHandle.x - 10,
            y: rotateToolHandle.y - 10
        };
        var topRight = {
            x: rotateToolHandle.x + 10,
            y: rotateToolHandle.y - 10
        };
        var bottomLeft = {
            x: rotateToolHandle.x - 10,
            y: rotateToolHandle.y + 10
        };
        var bottomRight = {
            x: rotateToolHandle.x + 10,
            y: rotateToolHandle.y + 10
        };


        //
        // Center mouse click
        //
        mousePos = {
            x: mousePos.x - window.toolCanvas.width / 2,
            y: mousePos.y - window.toolCanvas.height / 2
        };

        console.log(mousePos);
        if (mousePos.x < topLeft.x + 30 &&
            mousePos.x > topLeft.x &&
            mousePos.y < topLeft.y + 30 &&
            mousePos.y > topLeft.y) {
            toolGrabbed = true;
        }
    });

    window.toolCanvas.addEventListener('mouseup', function() {
        if (toolGrabbed) {
            toolGrabbed = false;
            var tempDeg = degrees(rotateToolHeading);
            if (tempDeg > 270) {
                if ((tempDeg - 270) > 45) {
                    rotateToolHeading = 0;
                }
                else {
                    rotateToolHeading = radians(270);
                }
            }
            else if (tempDeg > 180) {
                if ((tempDeg - 180) > 45) {
                    rotateToolHeading = radians(270);
                }
                else {
                    rotateToolHeading = radians(180);
                }
            }
            else if (tempDeg > 90) {
                if ((tempDeg - 90) > 45) {
                    rotateToolHeading = radians(180);
                }
                else {
                    rotateToolHeading = radians(90);
                }
            }
            else {
                if (tempDeg > 45) {
                    rotateToolHeading = radians(90);
                }
                else {
                    rotateToolHeading = radians(0);
                }
            }
            rotateToolHandle.x = 82 * Math.cos(rotateToolHeading);
            rotateToolHandle.y = 82 * Math.sin(rotateToolHeading);
            window.gridCells.getCurrentImage().setHeading(rotateToolHeading);
        }
    });



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
            imgData.currentImg = null;
            document.querySelector('#mainCanvas').classList.add('hoverPointer');
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
            //   tempDivEle.classList.add('col-md-2');

            var tempCardEle = document.createElement('div');
            tempCardEle.classList.add('item-inner');
            //create img
            var tempImgEle = document.createElement('img');
            tempImgEle.classList.add('card-img-top');
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
            // var style = "background-position: -"+imgData.coll[x].x+"px -"+imgData.coll[x].y+"px;";
            // tempImgEle.style = style;
            //add event
            tempImgEle.addEventListener('click', collItemSelected);
            //create label
            var tempLblEle = document.createElement('h5');
            tempLblEle.classList.add('card-title');
            var lblText = imgData.coll[x].name;
            console.log(lblText);
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

function collItemSelected() {
    window.handTool = false;
    document.querySelector('#mainCanvas').classList.remove('hoverPointer');
    rotateBtn.disabled = true;
    deleteBtn.disabled = true;
    //deleteBtn.classList.add('mapMkrHide');
    //window.gridGraph.resizeCanvas(SIZE_PX, SIZE_PX);
    window.gridGraph.resizeCanvas(SIZE_PX * 2, SIZE_PX * 2);
    imgData.currentImg = this.id.split('-')[1];
    var selectImg = imgData.getCurrentImg();
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
    if (!mouseIsPressed) {
        drawing = false;
    }

    if (window.rotateTool) {
        var tempCurrentCell = window.gridCells.getCurrentCell();
        var tempCurrentImg = window.gridCells.getCurrentImage();
        window.toolCtx.clearRect(0, 0, window.toolCanvas.width, window.toolCanvas.height);

        window.gridGraph.push();
        window.gridGraph.translate(window.toolCanvas.width / 2, window.toolCanvas.height / 2);
        window.gridGraph.rotate(rotateToolHeading);
        var rightMiddle = {
            x: (tempCurrentCell.width / 2),
            y: 0
        };
        window.gridGraph.stroke('rgb(0,255,0)');
        window.gridGraph.strokeWeight(6);
        window.gridGraph.line(rightMiddle.x + 6, 0, rightMiddle.x + 50, 0);
        window.gridGraph.ellipse(rightMiddle.x + 50, 0, 20);
        window.gridGraph.pop();
        window.toolCtx.drawImage(window.gridGraph.elt, 0, 0);
        window.toolCanvas.classList.remove('mapMkrHide');

        window.gridGraph.clear();

    }

    if (toolGrabbed) {
        var toolCanvBnds = window.toolCanvas.getBoundingClientRect();

        //
        // Mouse position based on the tool canvas
        //
        var mousePos = {
            x: (winMouseX - toolCanvBnds.left),
            y: (winMouseY - toolCanvBnds.top)
        };

        //
        // Center mouse click
        //
        mousePos = {
            x: mousePos.x - window.toolCanvas.width / 2,
            y: mousePos.y - window.toolCanvas.height / 2
        };

        var a = Math.atan2(mousePos.y, mousePos.x);

        rotateToolHeading = (a > 0 ? a : (2 * PI + a));
        window.gridCells.getCurrentImage().setHeading(rotateToolHeading);
        //rotateToolHandle.x = rotateToolHandle.x * Math.cos(a) - rotateToolHandle.y * Math.sin(a);
        //rotateToolHandle.y = rotateToolHandle.x * Math.sin(a) + rotateToolHandle.y * Math.cos(a);
        rotateToolHandle.x = 82 * Math.cos(rotateToolHeading);
        rotateToolHandle.y = 82 * Math.sin(rotateToolHeading);

        //console.log('angle: ' + a);
        console.log('rotateX: ' + rotateToolHandle.x + ' rotateY: ' + rotateToolHandle.y);

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
    var cord = {
        x: 0,
        y: 0
    };
    //
    // Draw horizontal lines as we go down the screen
    push();
    window.gridGraph.stroke('#bfdbf7');
    window.gridGraph.strokeWeight(GRID_LINE_W);
    for (var y = 0; y < size.y + 1; y++) {
        cord.x += (GRID_LINE_W / 2);
        window.gridGraph.line(0, cord.x, width, cord.x);
        cord.x += SIZE_PX + (GRID_LINE_W / 2);
    }
    // Draw vertical lines as we go right the screen
    for (var x = 0; x < size.x + 1; x++) {
        cord.y += (GRID_LINE_W / 2);
        window.gridGraph.line(cord.y, 0, cord.y, height);
        cord.y += SIZE_PX + (GRID_LINE_W / 2);
    }
    pop();
    window.gridCtx.drawImage(window.gridGraph.elt, 0, 0);
    window.gridGraph.clear();
}
/**
 * Creating an array of Grid Points based on top left
 * @function createGridPoints
 */

function createGridPoints(size) {
    window.gridPointsArr = [];
    var cord = {
        x: 0,
        y: 0
    };
    var center = 0;
    cord.x = GRID_LINE_W;
    cord.y = GRID_LINE_W;
    for (var y = 0; y < size.y; y++) {
        for (var x = 0; x < size.x; x++) {
            window.gridPointsArr.push(new MainObj({
                x: cord.x,
                y: cord.y
            }, SIZE_PX, SIZE_PX));
            cord.x += SIZE_PX + GRID_LINE_W;

        }
        cord.x = GRID_LINE_W;
        cord.y += SIZE_PX + GRID_LINE_W;
    }

    window.gridTree.insert(window.gridPointsArr);
}

/**
 * Called when the mouse is pressed - p5.js function
 * Leavin this here in case we need it for something else
 * @function mousePressed
 */
function mousePressed() {

    var cord = {
        x: 0,
        y: 0
    };
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

        /******************************************************************************
        Hey whats up with this? should there be something here?

        this is what I have in my copy.\

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
                if(!erasing){drawing = true;}
                var selectImg = imgData.coll[window.currentSelectImg];
                window.gridCells.updateCurrentCellImg(selectImg);
            }
        }
        ******************************************************************************/
    }
    
    
}


/**
 *
 */
function canvasClicked(e) {
    //
    // Code to handle single and double mouse clicks
    //
    var that = this;
    window.mouseClicks++;
    if (window.mouseClicks == 1) {
        setTimeout(function() {
            if (window.mouseClicks == 1) {
                canvasSingleMouseClick.call(this, e);
            }
            else {
                displaySelectedCellImages.call(this, e);
            }
            window.mouseClicks = 0;
        }, 200);
    }

}

function canvasSingleMouseClick() {
    // console.log('canvasClicked');
    var cord = {
        x: 0,
        y: 0
    };
    cord.x = window.mouseX;
    cord.y = window.mouseY;
    cord.width = 2;
    cord.height = 2;
    window.gridTree.insert(cord);
    findCell(cord);

    if (window.gridCells.currentCell !== null) {

        if (window.handTool) {
            window.gridCells.findImgByCord(cord);
            if (window.gridCells.currentLayer !== null) {
                cellItemSelected();
            }
            else {
                rotateBtn.disabled = true;
                deleteBtn.disabled = true;
            }
        }
        else if (imgData.currentImg !== null) {
            drawing = true;
            var selectImg = imgData.getCurrentImg();
            window.gridCells.updateCurrentCellImg(selectImg);
        }
    }
}

function mouseReleased() {
    /*
    drawing = false;
    gridTreeReset();
    */

    //
    // Should probably put this function inside a mouse release event for the actual body instead because this
    // Event is for the main canvas
    //
    if (toolGrabbed) {
        toolGrabbed = false;
        var tempDeg = degrees(rotateToolHeading);
        if (tempDeg > 270) {
            if ((tempDeg - 270) > 45) {
                rotateToolHeading = 0;
            }
            else {
                rotateToolHeading = radians(270);
            }
        }
        else if (tempDeg > 180) {
            if ((tempDeg - 180) > 45) {
                rotateToolHeading = radians(270);
            }
            else {
                rotateToolHeading = radians(180);
            }
        }
        else if (tempDeg > 90) {
            if ((tempDeg - 90) > 45) {
                rotateToolHeading = radians(180);
            }
            else {
                rotateToolHeading = radians(90);
            }
        }
        else {
            if (tempDeg > 45) {
                rotateToolHeading = radians(90);
            }
            else {
                rotateToolHeading = radians(0);
            }
        }
        rotateToolHandle.x = 82 * Math.cos(rotateToolHeading);
        rotateToolHandle.y = 82 * Math.sin(rotateToolHeading);
        window.gridCells.getCurrentImage().setHeading(rotateToolHeading);
    }
}

function canvasMouseReleased() {
    //console.log('released');
    gridTreeReset();
    drawing = false;
}

function findCell(cord) {
    window.currentCell = null;
    var arrDist = [];
    var cells = window.gridTree.retrieve(cord);

    var cnt = 0;

    // console.log('here: ' + cells.length);
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
            // console.log('found');
            return true;
        }

    }
    return false;
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
    var layer = this.name.split("-")[1];
    var iconOn = document.querySelector("#" + this.id + "On");
    var iconOff = document.querySelector("#" + this.id + "Off");
    if (iconOn.classList.contains("hide")) {
        iconOn.classList.remove("hide");
        iconOff.classList.add("hide");
        if (layer == 3) {
            window.gridCanvas.classList.remove("hide");
            GRID_LINE_W = 2;
            createGridPoints(gridSize);
            window.gridCells.update(gridSize, SIZE_PX, GRID_LINE_W);
            window.gridCells.updateCellsCords(gridX);
        }
        else {
            window.gridCells.setLayerVis(layer, true);

        }
    }
    else {
        iconOff.classList.remove("hide");
        iconOn.classList.add("hide");
        if (layer == 3) {
            window.gridCanvas.classList.add("hide");
            GRID_LINE_W = 0;
            createGridPoints(gridSize);
            window.gridCells.update(gridSize, SIZE_PX, GRID_LINE_W);
            window.gridCells.updateCellsCords(gridX);
        }
        else {
            window.gridCells.setLayerVis(layer, false);
        }
    }
}
/**
 * Updating the layer of the cells as the user is clicking/holding
 * @function updateCells
 */
function updateCells() {
    var cord = {
        x: 0,
        y: 0
    };
    cord.x = window.mouseX;
    cord.y = window.mouseY;
    cord.width = 2;
    cord.height = 2;
    window.gridTree.insert(cord);
    findCell(cord);
    gridTreeReset();
    if (window.gridCells.getCurrentCell()) {
        if (imgData.currentImg !== null) {
            var selectImg = imgData.getCurrentImg();
            window.gridCells.updateCurrentCellImg(selectImg);
        }
    }
}

function eraseCells() {
    var cord = {
        x: 0,
        y: 0
    };
    cord.x = window.mouseX;
    cord.y = window.mouseY;
    cord.width = 2;
    cord.height = 2;
    window.gridTree.insert(cord);
    findCell(cord);
    gridTreeReset();
    if (window.gridCells.currentCell !== null) {
        if (window.currentSelectImg !== null) {
            //console.log(cord);
            window.gridCells.deleteCellImageByLayer();
        }
    }
}
/**
 * Display Images of the Selected Cell
 * @function displaySelectedCellImages
 */
function displaySelectedCellImages() {
    var cord = {
        x: 0,
        y: 0
    };
    cord.x = window.mouseX;
    cord.y = window.mouseY;
    cord.width = 2;
    cord.height = 2;
    //
    // Making sure we are within the canvas
    //
    if (cord.x < 0 + width &&
        cord.x > 0 &&
        cord.y < 0 + height &&
        cord.y > 0) {

        //
        // Inserting mouse cord in the tree
        //
        window.gridTree.insert(cord);
        //console.log('display image');
        if (findCell(cord)) {

            //
            // Retrieve an array of images from the current cell by layer
            // Create an ul with li containing the img
            //
            var tempImgArr = [];
            if (tempImgArr = window.gridCells.returnLayerImgArr()) {
                //
                // Setting drawing to false to prevent future clicks to draw on the canvas
                // When clicking on the displayed cell images
                //
                drawing = false;

                //
                // Setting the grids transparency
                //
                window.mainCanvas.elt.style.opacity = .2;
                window.gridCanvas.style.opacity = .2;
                var canvasBounds = window.mainCanvas.elt.getBoundingClientRect();
                var cellImagesContent = document.querySelector('#mapMkrCellImagesContent');
                var tempList = document.createElement('ul');
                tempList.id = 'cellImages';
                for (var x = 0; x < tempImgArr.length; x++) {
                    var tempItem = document.createElement('li');
                    tempItem.id = 'cellImgLayer-' + tempImgArr[x].alt;

                    //
                    // If this grows too big it could be put into a function
                    // Click Event for when an image is selected from the cell list of images
                    //
                    tempItem.addEventListener('click', function() {

                        var canvasBounds = window.mainCanvas.elt.getBoundingClientRect();
                        //
                        // Resetting the canvas transparency
                        //
                        window.mainCanvas.elt.style.opacity = 1;
                        window.gridCanvas.style.opacity = 1;
                        window.gridCells.currentLayer = this.id.split('-')[1];
                        selectedImg.src = window.gridCells.getCurrentImageEncode();
                        window.cellImagesWrap.style.display = 'none';
                        document.querySelector('#mapMkrCellImagesContent').innerHTML = '';

                        //
                        // 
                        // This is where I'm planning on building the rotate tool
                        //
                        push();
                        fill(255);
                        var currentCell = window.gridCells.getCurrentCell();

                        //
                        // This is based on the center position of the actual cell not the image.
                        // This works because when we draw the image its based on the center of the cell.
                        // If for any reason we decide that the image are freely placed than this code would have to change.
                        // mkor if decided lets say to allow more than one image at layer 3 (2 beds).63222   
                        // 
                        translate(currentCell.x, currentCell.y);
                        var topLeft = {
                            x: 0 - (currentCell.width / 2),
                            y: 0 + (currentCell.height / 2)
                        };
                        var topRight = {
                            x: 0 + (currentCell.width / 2),
                            y: 0 + (currentCell.height / 2)
                        };
                        var buttomLeft = {
                            x: 0 - (currentCell.width / 2),
                            y: 0 - (currentCell.height / 2)
                        };
                        var buttomRight = {
                            x: 0 + (currentCell.width / 2),
                            y: 0 - (currentCell.height / 2)
                        };

                        ellipse(topLeft.x, topLeft.y, 10, 10);
                        ellipse(topRight.x, topRight.y, 10, 10);
                        ellipse(buttomLeft.x, buttomLeft.y, 10, 10);
                        ellipse(buttomRight.x, buttomRight.y, 10, 10);

                        window.gridCells.getCurrentImage().addPoint(topLeft);
                        window.gridCells.getCurrentImage().addPoint(topRight);
                        window.gridCells.getCurrentImage().addPoint(buttomLeft);
                        window.gridCells.getCurrentImage().addPoint(buttomRight);


                        window.toolCanvas.style.top = (canvasBounds.top + window.scrollY) + currentCell.y - (window.toolCanvas.height / 2) + 'px';
                        window.toolCanvas.style.left = (canvasBounds.left + window.scrollX) + currentCell.x - (window.toolCanvas.width / 2) + 'px';

                        pop();
                        setupRotateTool();
                        window.rotateTool = true;
                        window.drawing = false;

                    });
                    tempItem.appendChild(tempImgArr[x]);
                    tempList.appendChild(tempItem);
                }

                //
                // Move the list of images near the mouse click more towards the right
                //
                cellImagesContent.style.left = (cord.x + SIZE_PX) + canvasBounds.left + 'px';
                cellImagesContent.style.top = cord.y + canvasBounds.top + 'px';
                cellImagesContent.appendChild(tempList);
                window.cellImagesWrap.style.display = 'block';

                //
                // Handle Exit Btn
                //
                var exitBtn = document.querySelector('#mapMkrBtnSelCellImgX');
                exitBtn.style.left = (cord.x + SIZE_PX + 40) + canvasBounds.left + 'px';
                exitBtn.style.top = (cord.y - SIZE_PX - 30) + canvasBounds.top + 'px';

            }
        }

    }
    gridTreeReset();
}

function setupRotateTool() {
    var tempCurrentCell = window.gridCells.getCurrentCell();
    var tempCurrentImg = window.gridCells.getCurrentImage();
    window.toolCtx.clearRect(0, 0, window.toolCanvas.width, window.toolCanvas.height);

    window.gridGraph.push();
    window.gridGraph.translate(window.toolCanvas.width / 2, window.toolCanvas.height / 2);
    window.gridGraph.rotate(rotateToolHeading);
    var rightMiddle = { x: (tempCurrentCell.width / 2), y: 0 };
    window.gridGraph.stroke('rgb(0,255,0)');
    window.gridGraph.strokeWeight(6);
    window.gridGraph.line(rightMiddle.x + 6, 0, rightMiddle.x + 50, 0);
    rotateToolHandle = { x: rightMiddle.x + 50, y: 0 };
    window.gridGraph.ellipse(rightMiddle.x + 50, 0, 20);
    window.gridGraph.pop();
    window.toolCtx.drawImage(window.gridGraph.elt, 0, 0);
    window.toolCanvas.classList.remove('mapMkrHide');

    window.gridGraph.clear();
}



function gridTreeReset() {
    window.gridTree.clear();
    window.gridTree.insert(window.gridPointsArr);
}

function printMap() {
    window.print();
    return false;
}

function saveMap() {
    var gridVis = document.querySelector("#GrdVisOn");
    if (gridVis.classList.contains("hide")) {
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

function selectEraser() {
    if (!erasing) {
        document.body.style.cursor = 'crosshair';
        erasing = true;
        drawing = false;
    }
    else {
        document.body.style.cursor = 'auto';
        erasing = false;
    }
}

function toggleGridMenu() {
    var gridMenu = document.querySelector('#gridMenu');
    var shown = gridMenu.classList.contains('show');
    if (shown) {
        gridMenu.classList.remove('show');
    }
    else {
        gridMenu.classList.add('show');
    }
}
