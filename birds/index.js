import {Game, Scale} from "phaser";
import {UI} from "./ui.js";
import {World} from "./world.js";

const game = new Game({
    width: 960,
    height: 540,
    parent: "game",
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.Center.CENTER_BOTH
    },
    fps: {
        target: 30,
        //limit: 30,
        forceSetTimeOut: true
    },
    scene: [new UI(), new World()]
});

addEventListener("blur", () => {
    console.log("PAUSE")
    game.pause();
});

addEventListener("focus", () => {
    console.log("RESUME")
    game.resume();
});
