'use strict';

/**
 *
 */

function MainObj(pos, width, height, angle, src, bounds) {
    //
    // This will be the center for images done to facilitate the rotation.
    //
    this.pos = window.createVector(pos.x, pos.y);

    //
    // Assigning the cord to x and y for the Quadtree class
    //
    this.x = this.pos.x;
    this.y = this.pos.y;
    this.width = width || 0;
    this.height = height || 0;
    this.bounds = bounds || null;
    this.heading = angle || 0;
    this.src = src || null;
    this.layerVis = [true, true, true];
    //
    // Used for the cell didn't want to create a separate class to inherit from this one
    //
    this.layers = [];
}

MainObj.prototype.rotation = 90;

MainObj.prototype.setRotation = function (angle) {
    this.rotation = angle;
}

MainObj.prototype.setHeading = function(angle) {
    this.heading = angle;
}

MainObj.prototype.turn = function () {
    this.heading += radians(this.rotation);
    if (this.heading > radians(270)) {
        this.heading = 0;
    }
}

MainObj.prototype.render = function () {
    for (var x = 0, len = this.layers.length; x < len; x++) {
        if (this.layers[x] != undefined && this.layerVis[x]) {
            push();
            imageMode(window.CENTER);
            translate(this.x, this.y);
            rotate(this.layers[x].heading);
            //
            // find the image here using the p5.js image function
            //
            image(window.imgArr[this.layers[x].src],
                0, 0,
                SIZE_PX, SIZE_PX,
                this.layers[x].x, this.layers[x].y,
                this.layers[x].width, this.layers[x].height);
            pixelArr = window.mainCtx.getImageData(this.x, this.y, 32, 32);
            pop();
        }
    }

}

MainObj.prototype.updatePos = function (pos) {
    this.pos = pos;
    this.x = this.pos.x;
    this.y = this.pos.y;

}

MainObj.prototype.setLayerVis = function (layer, vis) {
    this.layerVis[layer] = vis;
}

MainObj.prototype.addPoint = function(dot){
    this.dots.push(dot);
}