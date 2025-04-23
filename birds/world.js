import {GameObjects, Geom, Input, Scene, Math as Util} from "phaser";
import {generateTexture, shuffle} from "./util.js";
import {fillTriangle, fillCircle, fillShape, drawSticky} from "./sticky.js";

const scale = 960 / 640;
const px = scale;
const Size = {
    px,
    width: 640 * scale,
    height: 360 * scale,
    object: 44 * px,
    objectRadius: 22 * px
}

export class Bush extends GameObjects.Image {
}

export class Tree extends GameObjects.Image {
}

export class Bird extends GameObjects.Image {
    /** @type {Bush?} */
    source = null;
    /** @type {Tree?} */
    destination = null;

    /**
     * @param {Bush} source
     * @param {Tree} destination
     */
    assign(source, destination) {
        this.source = source;
        this.destination = destination;
        this.setPosition(source.x, source.y);
    }
}

export class World extends Scene {
    /** @type {Bird?} */
    #bird = null;
    /** @type {GameObjects.Image?} */
    #selection = null;
    /** @type {GameObjects.TileSprite?} */
    #assignMarker = null;
    #afterDrag = false;

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
        generateTexture(this.textures, "bush", objectRadius * 2, objectRadius * 2, context => {
            const circle = new Geom.Circle(
                // objectRadius / 2, objectRadius / 2, objectRadius / 2 - 1
                objectRadius, objectRadius, objectRadius - 1
            );
            console.log("BUSH SIZES", objectRadius * 2, objectRadius);
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
            // const tree = this.add.image(point.x, point.y, "tree");
            const tree = this.add.existing(new Tree(this, point.x, point.y, "tree"));
            tree.setOrigin(0.5, 1);
            tree.setInteractive({dropZone: true});
        }
        for (let i = 0; i < bushCount; i++) {
            const point = gen.next().value;
            if (!point) {
                throw new Error("point");
            }
            // const bush = this.add.circle(point.x, point.y, objectRadius / 2);
            // bush.setStrokeStyle(1, 0xffffff);
            // const bush = this.add.image(point.x, point.y, "bush");
            const bush = this.add.existing(new Bush(this, point.x, point.y, "bush"));
            bush.setOrigin(0.5, 1);
            bush.setInteractive({draggable: true});
        }

        const bird = this.createBird();
        const point = gen.next().value;
        if (!point) {
            throw new Error("point");
        }
        bird.setPosition(point.x, point.y);
        console.log("BIRD", bird.x, bird.y);

        generateTexture(this.textures, "selection", bird.width, bird.height, context => {
            context.strokeStyle = "#ffffff";
            fillShape(context, new Geom.Rectangle(0, 0, bird.width, bird.height), {stroke: true});
        });
        this.#selection = this.add.image(0, 0, "selection");
        this.#selection.setVisible(false);

        const size = 8 * Size.px;
        generateTexture(this.textures, "assign-indicator", size, size, context => {
            const r = size / 2;
            context.fillStyle = "#ffffff";
            fillShape(context, new Geom.Circle(r, r, r / 2));
        });
        this.#assignMarker = this.add.tileSprite(100, 100, size * 5, size, "assign-indicator");
        this.#assignMarker.setVisible(false);
        this.#assignMarker.setOrigin(0, 0.5);

        // this.input.setTopOnly(true);
        this.input.on("gameobjectup",
            /**
             * @param {undefined} _
             * @param {Bird} object
             * @param {Event} event
             */
            (_, object, event) => {
                if (object instanceof Bird) {
                    this.#bird = object;
                    const center = this.#bird.getCenter();
                    this.#selection?.setPosition(center.x, center.y);
                    this.#selection?.setVisible(true);
                    event.stopPropagation();
                }
            }
        );
        this.input.on("pointerup", () => {
            if (this.#afterDrag) {
                console.log("SKIPPING DESELECT AFTER DRAG");
                this.#afterDrag = false;
                return;
            }
            console.log("CLICKED ANYWHERE");
            this.#bird = null;
            this.#selection?.setVisible(false);
        });
        this.input.on("dragstart",
            /**
             * @param {Input.Pointer} pointer
             * @param {GameObjects.Image} object
             */
            (pointer, object) => {
                //if (!this.#bird) {
                //    event.preventDefault();
                //    return;
                //}
                if (!this.#bird) {
                    return;
                }
                console.log("DRAG STARTED", object);
                if (!this.#assignMarker) {
                    throw new Error("AAAAAA");
                }
                this.#assignMarker.setPosition(pointer.x, pointer.y);
                this.#assignMarker.width = 0;
                this.#assignMarker.setVisible(true);
            }
        );
        this.input.on("drag", (pointer) => {
            if (!this.#bird) {
                return;
            }
            this.#assignMarker?.setRotation(pointer.getAngle());
            // this.#assignMarker?.setSize(pointer.getDistance(), this.#assignMarker.height);
            if (!this.#assignMarker) {
                throw new Error("AAAAAA");
            }
            this.#assignMarker.width = pointer.getDistance();
        });
        this.input.on("dragend", (_, object, dropped) => {
            if (!this.#bird) {
                return;
            }
            console.log("DRAG ENDED", object);
            this.#assignMarker?.setVisible(false);
            this.#afterDrag = true;
            if (dropped) {
                this.#bird = null;
                this.#selection?.setVisible(false);
            }
        });
        this.input.on("drop", (_, object, zone) => {
            if (!this.#bird) {
                return;
            }
            console.log("DROPPED", object, zone);
            this.#bird.assign(object, zone);
        });

    }

    /** @returns {Bird} */
    createBird() {
        const size = Size.object / 2;
        const r = Math.trunc(size / 2);
        const beakSize = Math.trunc(r / 2);
        console.log("SIZES", size, r, beakSize, r - 0.5);
        generateTexture(this.textures, "bird", size + beakSize, size, context => {
            context.strokeStyle = "#ffffff";
            // TODO this should work, hmmmmm
            const body = new Geom.Circle(r, r, r - 0.5);
            fillCircle(context, body, {stroke: true});
            const beak = new Geom.Triangle(0, 0, beakSize, beakSize / 2, 0, beakSize);
            drawSticky({shape: beak, x: 0}, {shape: body, x: 1}, context, {stroke: true});
            console.log("BEAK", beak);
        });
        const bird = new Bird(this, 0, 0, "bird");
        bird.setOrigin(0.5, 1);
        bird.setInteractive();
        return this.add.existing(bird);
    }
}
