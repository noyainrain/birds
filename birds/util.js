import {Geom} from "phaser";

/**
 * TODO.
 * @template T
 * @param {Array<T>} array
 * @return {Array<T>}
 */
export function shuffle(array) {
    return array.map(item => [item, Math.random()])
        .sort((a, b) => b[1] - a[1])
        .map(item => item[0]);
}

/**
 * @param {number} width
 * @param {number} height
 * @param {Object} options
 * @param {boolean} [options.bounds]
 * @returns {CanvasRenderingContext2D}
 */
export function createCanvas(width, height, {bounds = false} = {}) {
    // TODO utility method
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("AAAAAAAAAAAAAAA");
    }
    if (bounds) {
        context.strokeStyle = "white";
        context.strokeRect(0, 0, width, height);
    }
    return context;
}

/**
 * @callback addImage
 * @param {string} key
 * @param {HTMLCanvasElement} source
 * @returns {Phaser.Textures.Texture}
 */
/**
 * @callback DrawFunction
 * @param {CanvasRenderingContext2D} context
 */
/**
 * @param {Phaser.Textures.TextureManager} textures
 * @param {string} name
 * @param {number} width
 * @param {number} height
 * @param {DrawFunction} draw
 * @returns {?Phaser.Textures.Texture}
 */
export function generateTexture(textures, name, width, height, draw) {
    if (textures.exists(name)) {
        return null;
    }
    const context = createCanvas(width, height);
    draw(context);
    return /** @type {addImage} */ (
        /** @type {unknown} */ (textures.addImage)
    )(name, context.canvas);
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {Geom.Circle} circle
 */
export function fillCircle(context, circle, {stroke = false} = {}) {
    context.beginPath();
    context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    stroke ? context.stroke() : context.fill();
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {Geom.Triangle} triangle
 */
export function fillTriangle(context, triangle, {stroke = false} = {}) {
    context.beginPath();
    context.moveTo(triangle.x1, triangle.y1);
    context.lineTo(triangle.x2, triangle.y2);
    context.lineTo(triangle.x3, triangle.y3);
    // TODO why needed to close?
    context.lineTo(triangle.x1, triangle.y1);
    stroke ? context.stroke() : context.fill();
}
