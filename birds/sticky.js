import {GameObjects, Geom} from "phaser";

/** @typedef {Geom.Rectangle | Geom.Triangle | Geom.Circle} Shape */

/**
 * @typedef Spot
 * @property {number} [x]
 * @property {number} [y]
 * @property {number} [offsetX]
 * @property {number} [offsetY]
 */

/**
 * @template {Shape} T
 * @typedef OnShape
 * @property {T} shape
 */

/**
 * @typedef OnObject
 * @property {GameObjects.Components.GetBounds & GameObjects.Components.Transform & GameObjects.Components.Origin} object
 */

/**
 * @template {Shape} T
 * @param {Spot & OnShape<T>} shape
 * @param {Spot & OnShape<Shape>} ref
 * @returns {T}
 */
export function stick(shape, ref) {
    /**
     * @param {Geom.Rectangle | Geom.Triangle | Geom.Circle} shape
     * @param {number} x
     * @param {number} y
     */
    function getPoint(shape, x, y) {
        if (shape instanceof Geom.Rectangle) {
            return {x: shape.x + x * shape.width, y: shape.y + y * shape.height};
        } else if (shape instanceof Geom.Triangle) {
            return {
                x: (1 - x) * shape.left + x * shape.right,
                y: (1 - y) * shape.top + y * shape.bottom
            };
        } else {
            return {
                x: shape.x + (2 * x - 1) * shape.radius,
                y: shape.y + (2 * y - 1) * shape.radius,
            };
        }
    }
    const s = getPoint(shape.shape, shape.x ?? 0.5, shape.y ?? 0.5);
    const r = getPoint(ref.shape, ref.x ?? 0.5, ref.y ?? 0.5);

    // TODO unify somehow
    if (shape.shape instanceof Geom.Rectangle || shape.shape instanceof Geom.Circle) {
        shape.shape.setPosition(
            r.x + (ref.offsetX ?? 0) + shape.shape.x - s.x, r.y + (ref.offsetY ?? 0) + shape.shape.y - s.y
        );
    } else {
        shape.shape.left = r.x + shape.shape.left - s.x;
        shape.shape.top = r.y + (ref.offsetY ?? 0) + shape.shape.top - s.y;
    }

    return shape.shape;
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {Geom.Circle} circle
 */
export function fillCircle(context, circle, {stroke = false, start = 0, end = 1, closed = false} = {}) {
    context.beginPath();
    console.log("START", start);
    context.arc(circle.x, circle.y, circle.radius, start * 2 * Math.PI, end * 2 * Math.PI);
    if (closed) {
        context.closePath();
    }
    stroke ? context.stroke() : context.fill();
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {Geom.Triangle} triangle
 */
export function fillTriangle(context, triangle, {stroke = false, closed = false} = {}) {
    context.beginPath();
    context.moveTo(triangle.x1, triangle.y1);
    context.lineTo(triangle.x2, triangle.y2);
    context.lineTo(triangle.x3, triangle.y3);
    // TODO why needed to close?
    if (closed) {
        context.lineTo(triangle.x1, triangle.y1);
    }
    stroke ? context.stroke() : context.fill();
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {Geom.Rectangle} rectangle
 */
export function drawRectangle(context, rectangle, {stroke = false} = {}) {
    const offset = context.lineWidth / 2;
    console.log("OFFSET", offset);
    stroke ?
        //context.strokeRect(
        //    rectangle.x + 0.5, rectangle.y + 0.5, rectangle.width - 0.5, rectangle.height - 0.5
        //) :
        context.strokeRect(
            rectangle.x + offset, rectangle.y + offset, rectangle.width - offset,
            rectangle.height - offset
        ) :
        context.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
}

/**
 * Draw a filled shaped to a canvas.
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {Geom.Circle | Geom.Triangle | Geom.Rectangle} shape - Shape to draw
 */
export function fillShape(context, shape, {stroke = false, start = 0, end = 1, closed = false} = {}) {
    if (shape instanceof Geom.Circle) {
        //context.beginPath();
        //context.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
        //context.fill();
        fillCircle(context, shape, {stroke, start, end, closed});
    } else if (shape instanceof Geom.Triangle) {
        //context.beginPath();
        //context.moveTo(shape.x1, shape.y1);
        //context.lineTo(shape.x2, shape.y2);
        //context.lineTo(shape.x3, shape.y3);
        //context.fill();
        fillTriangle(context, shape, {stroke, closed});
    } else if (shape instanceof Geom.Rectangle) {
        // context.fillRect(shape.x, shape.y, shape.width, shape.height);
        drawRectangle(context, shape, {stroke});
    } else {
        throw new Error("Assertion failed");
    }
}

/**
 * @template {Shape} T
 * @param {Spot & OnShape<T>} shape
 * @param {Spot & OnShape<Shape>} ref
 * @param {CanvasRenderingContext2D} context
 * @returns {T}
 */
export function drawSticky(shape, ref, context, {stroke = false, start = 0, end = 1, closed = true} = {}) {
    const s = stick(shape, ref);
    fillShape(context, s, {stroke, start, end, closed});
    return s;
}
