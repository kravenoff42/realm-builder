'use strict';

/**
 * 
 * @class Point
 */

function Point(pos) {
    this.pos = window.createVector(pos.x, pos.y);
    this.x = this.pos.x;
    this.y = this.pos.y
}