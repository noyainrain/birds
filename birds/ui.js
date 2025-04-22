import {GameObjects, Scene} from "phaser";

export class UI extends Scene {
    /** @type {GameObjects.Text?} */
    #text = null;

    create() {
        const FONT_SIZE = 16;
        const style = {
            fontSize: FONT_SIZE
        }
        this.#text = this.add.text(
            this.cameras.main.width - FONT_SIZE, FONT_SIZE, "Test", style
        );
        this.#text.setOrigin(1, 0);
    }

    update() {
        if (this.game.loop.framesThisSecond === 1) {
            const text = `${this.game.loop.actualFps.toFixed()} fps`;
            this.#text?.setText(text);
        }
    }
}
