import * as Phaser from "phaser";
import {GameObjects} from "phaser";
import {generateTexture} from "./util.js";

export const Color = {
    PRIMARY: "#ffffff",
    BACKGROUND: "#000000"
};

/** ... */
export class Scene extends Phaser.Scene {
    font = {
        fontFamily: "sans",
        fontSize: 16
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {string} text
     * @param {import("phaser").Types.GameObjects.Text.TextStyle} style
     * @returns {GameObjects.Text}
     */
    write(x, y, text, style = {}) {
        return this.add.text(x, y, text, {...this.font, ...style});
    }

    /**
     * @param {string} name
     * @param {number} width
     * @param {number} height
     * @param {import("./util.js").DrawFunction} draw
     * @returns {?Phaser.Textures.Texture}
     */
    generateTexture(name, width, height, draw) {
        return generateTexture(this.textures, name, width, height, draw);
    }
}
