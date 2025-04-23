import {Geom, Scene, Math as Util} from "phaser";
import {fillTriangle, fillCircle, generateTexture, shuffle} from "./util.js";

const scale = 960 / 640;
const Size = {
    px: scale,
    width: 640 * scale,
    height: 360 * scale
}

export class World extends Scene {
    constructor() {
        super({key: "world", active: true});
    }

    create() {
        // 1.5 is correction for our viewport
        const objectWidth = 44 * Size.px;
        const objectRadius = objectWidth / 2;
        const gapWidth = 44 * Size.px;
        const gapHeight = 38 * Size.px;

        const offset = gapWidth / 2;

        // . . .
        //  . . (.)
        // . . .
        // w <->
        // h = sqrt(3) / 2 * w
        // w = 2 / sqrt(3) * h

        // 360
        const nX = Math.trunc(Size.width / objectWidth);
        const nY = Math.trunc((Size.height - objectWidth) / gapHeight + 1);

        /** @type {Array<Util.Vector2>} */
        const points = [];
        for (let y = 0; y < nY; y++) {
            for (let x = 0; x < (y % 2 ? nX - 1 : nX); x++) {
                points.push(
                    new Util.Vector2(
                        x * objectWidth + offset + (y % 2 ? offset : 0),
                        y * gapHeight + offset
                    )
                );
            }
        }

        console.log("POINTS", points);
        for (const point of points) {
            const debug = false;
            if (debug) {
                const circle = this.add.circle(point.x, point.y, 1);
                circle.setStrokeStyle(1, 0xffffff);
                console.log("POINT ADDED AT", circle);
            }
        }

        // equidistant / "hexagonal" grid formulat
        // . . .  -nX, -nX+1
        //  . a . -1, 0, +1
        // . . .  +nX, +nX+1
        //  . . . -nX-1, -nX
        // . b .  -1, 0, +1
        //  . . . +nX-1, -nX

        const treeCount = 10;
        const bushCount = 10;
        function* randomPoints() {
            const rnd = shuffle(points.slice());
            for (let point of rnd) {
                yield point;
            }
        }

        const gen = randomPoints();

        generateTexture(this.textures, "tree", objectWidth, objectWidth, context => {
            const triangle = new Geom.Triangle(
                0, objectWidth - 0.5, objectRadius, 0, objectWidth, objectWidth - 0.5
            );
            //context.lineWidth = 2;
            context.strokeStyle = "#ffffff";
            fillTriangle(context, triangle, {stroke: true});
        });
        generateTexture(this.textures, "bush", objectRadius, objectRadius, context => {
            const circle = new Geom.Circle(
                objectRadius / 2, objectRadius / 2, objectRadius / 2 - 1
            );
            context.strokeStyle = "#ffffff";
            fillCircle(context, circle, {stroke: true});
        });

        for (let i = 0; i < treeCount; i++) {
            const point = gen.next().value;
            if (!point) {
                throw new Error("point");
            }
            //const tree = this.add.triangle(
            //    point.x, point.y, 0, 0, objectRadius, objectWidth, objectWidth, 0
            //);
            //tree.setStrokeStyle(1, 0xffffff);
            const tree = this.add.image(point.x, point.y, "tree");
            tree.setOrigin(0.5, 1);
        }
        for (let i = 0; i < bushCount; i++) {
            const point = gen.next().value;
            if (!point) {
                throw new Error("point");
            }
            // const bush = this.add.circle(point.x, point.y, objectRadius / 2);
            // bush.setStrokeStyle(1, 0xffffff);
            const bush = this.add.image(point.x, point.y, "bush");
            bush.setOrigin(0.5, 1);
        }
    }
}
