import {GameObjects, Geom} from "phaser";
import {fillShape} from "./sticky.js";
import {Color, Scene} from "./core.js";

export class UI extends Scene {
    /** @type {GameObjects.Text?} */
    #text = null;

    constructor() {
        super({key: "ui", active: true});
    }

    create() {
        const FONT_SIZE = 16;
        const style = {
            fontSize: FONT_SIZE
        }
        this.#text = this.add.text(
            this.cameras.main.width - FONT_SIZE, FONT_SIZE, "Test", style
        );
        this.#text.setOrigin(1, 0);
        console.log("UI CREATED");
    }

    update() {
        if (this.game.loop.framesThisSecond === 1) {
            const text = `${this.game.loop.actualFps.toFixed()} fps`;
            this.#text?.setText(text);
        }
    }
}

const HINTS = "Get as many birds as possible through winter";

/** ... */
export class Start extends Scene {
    constructor() {
        super({key: "start", active: true});
    }

    create() {
        const camera = this.cameras.main;

        const title = this.write(
            camera.centerX, this.font.fontSize, "Birds", {fontSize: this.font.fontSize * 4}
        );
        title.setOrigin(0.5, 0);

        const size = this.font.fontSize * 4;
        this.generateTexture("play", size, size, context => {
            const width = 3;
            context.strokeStyle = Color.PRIMARY;
            context.fillStyle = Color.PRIMARY;
            context.lineWidth = 3;
            fillShape(
                context,
                new Geom.Triangle(width / 2, width / 2, size - width / 2, size / 2, width / 2, size - width / 2),
                // {stroke: true}
            );
        });
        const playButton = this.add.image(camera.centerX, camera.centerY, "play");
        playButton.setInteractive().on("pointerup", () => {
            this.scene.start("world");
        });

        const hints = this.write(camera.centerX, camera.height - this.font.fontSize, HINTS);
        hints.setOrigin(0.5, 1);
    }
}

export class Fin extends Scene {
    constructor() {
        super({key: "fin"});
    }

    /**
     * @param {Object<string, number>} data
     */
    create(data) {
        const camera = this.cameras.main;

        const title = this.write(
            camera.centerX, this.font.fontSize, "Winter is Here", {fontSize: this.font.fontSize * 4}
        );
        title.setOrigin(0.5, 0);

        const migrated = data.migrated === 1 ?
            "1 bird migrated" : `${data.migrated} birds migrated`;

        let record;
        console.log(data.migrated, data.highScore);
        if (data.migrated > data.highScore) {
            record = "New high score! Amazing!";
        } else {
            record = `(High Score: ${data.highScore})`;
        }

        const result = this.write(
            camera.centerX, camera.centerY, `${migrated}\n${record}`, {align: "center"}
        );
        result.setOrigin(0.5, 0.5);

        const size = this.font.fontSize * 2;
        this.generateTexture("stop", size, size, context => {
            const width = 3;
            context.strokeStyle = Color.PRIMARY;
            context.fillStyle = Color.PRIMARY;
            context.lineWidth = width;
            fillShape(
                context,
                // new Geom.Rectangle(width / 2, width / 2, size - width / 2, size - width / 2),
                new Geom.Rectangle(0, 0, size, size),
                {stroke: false}
            );
        });
        const stopButton = this.add.image(
            camera.centerX, camera.height - this.font.fontSize, "stop"
        );
        stopButton.setOrigin(0.5, 1);
        stopButton.setInteractive().on("pointerup", () => {
            this.scene.start("start");
        });
    }
}
