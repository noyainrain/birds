import {GameObjects, Geom, Input, Math as Util, Time} from "phaser";
import {generateTexture, shuffle} from "./util.js";
import {fillTriangle, fillCircle, fillShape, drawSticky} from "./sticky.js";
import {Color, Scene} from "./core.js";

const scale = 960 / 640;
const px = scale;
const Size = {
    px,
    width: 640 * scale,
    height: 360 * scale,
    object: 44 * px,
    objectRadius: 22 * px
}

class Food {
    value = 0;
    /** @type {Array<GameObjects.Image>} */
    fruits = [];

    /**
     * @param {Entity} entity
     * @param {number} offset
     */
    constructor(entity, offset) {
        this.entity = entity;
        this.offset = offset;
    }

    /** @param {number} value */
    add(value) {
        const size = Size.object / 8;
        this.entity.scene.generateTexture("fruit", size, size, context => {
            context.strokeStyle = Color.PRIMARY;
            context.fillStyle = Color.BACKGROUND;
            const body = new Geom.Circle(size / 2, size / 2, size / 2);
            fillShape(context, body);
            body.radius -= 0.5;
            fillShape(context, body, {stroke: true});
        });

        if (value > 0) {
            const width = 8;
            for (let i = this.value; i < this.value + value; i++) {
                const x = i % width;
                const y = Math.trunc(i / width);
                const fruit = new GameObjects.Image(
                    this.entity.scene, x * size / 2 - width / 2 * size / 2 + size / 4, -y * size / 2 - this.offset, "fruit"
                );
                this.fruits.push(fruit);
                this.entity.add(fruit);
            }
		} else {
            for (let i = this.value; i > this.value + value; i--) {
                const fruit = this.fruits.pop();
                if (!fruit) {
                    throw new Error("Assertion failed");
                }
                this.entity.remove(fruit);
            }
        }

        this.value += value;
    }
}

export class Entity extends GameObjects.Container {
    /** @type {World} */
    scene;
    info = "";

    /*set flipX(value) {
        for (let child of this.list) {
            child.flipX = value;
        }
    }*/

    /**
     * @param {World} scene
     * @param {...unknown} args
     */
    constructor(scene, ...args) {
        super(scene, ...args);
        this.scene = scene;
    }
}

class Structure extends Entity {
    /** @type{Array<typeof Structure>} */
    acceptedSources = [];

    /** ... */
    turn() {}

    /**
     * @param {number} food
     * @returns {number}
     */
    pull(food) {
        return 0;
    }

    /**
     * @param {number} food
     */
    push(food) {}

    /** ... */
    getLanding() {
        return new Util.Vector2(Size.objectRadius, 0).rotate(Math.random() * Math.PI).add(this);
    }

    /** ... */
    getValue() {
        return 0;
    }
}

export class Bush extends Structure {
    /** @returns {number} */
    pull() {
        return 1;
    }
}

export class DeciduousTree extends Structure {
    acceptedSources = [Bush];
    food = new Food(this, Size.object - Size.object * 5 / 6 / 2);
    egg = 0;

    /** @type {GameObjects.Image?} */
    #nest = null;
    /** @type {GameObjects.Image?} */
    #egg = null;

    /** @param {number} food */
    pull(food) {
        food = Math.min(food, this.food.value)
        this.food.add(-food);
        return food;
    }

    /**
     * @param {number} food
     */
    push(food) {
        if (!this.#nest) {
            const size = Size.object / 4;
            this.scene.generateTexture("egg", size, size, context => {
                context.strokeStyle = Color.PRIMARY;
                context.fillStyle = Color.BACKGROUND;
                const body = new Geom.Circle(size / 2, size / 2, size / 2);
                fillShape(context, body);
                body.radius -= 0.5;
                fillShape(context, body, {stroke: true});
            });
            this.#egg = new GameObjects.Image(this.scene, 0, -Size.object + Size.object * 5 / 6 / 2 + size / 2, "egg");
            this.add(this.#egg);

            const nestSize = Size.object / 2;
            this.scene.generateTexture("nest", nestSize, nestSize, context => {
                context.strokeStyle = Color.PRIMARY;
                context.fillStyle = Color.BACKGROUND;
                const body = new Geom.Circle(nestSize / 2, nestSize / 2, nestSize / 2);
                fillShape(context, body, {end: 0.5});
                body.radius -= 0.5;
                fillShape(context, body, {stroke: true, end: 0.5, closed: true});
            });
            this.#nest = new GameObjects.Image(this.scene, 0, -Size.object + Size.object * 5 / 6 / 2, "nest");
            this.add(this.#nest);
        }

        this.food.add(Math.min(food, 2 - this.food.value));

        this.info = `${this.food.value},${this.egg}/${Bird.COST}`;
    }

    turn() {
        // if (this.food > 0) {
        if (this.food.value >= 2) {
            // this.food--;
            this.food.add(-2);
            // this.egg++;
            this.egg += 2;
        }

        if (this.egg >= Bird.COST) {
            this.egg = 0;
            const bird = this.scene.createBird();
            const position = this.getLanding();
            bird.setPosition(position.x, position.y);
        }

        if (this.#egg) {
            this.#egg.y = -Size.object + 5 / 6 / 2 * Size.object + this.#egg.height / 2 - (this.egg / Bird.COST) * this.#egg.height; 
        }

        this.info = `${this.food.value},${this.egg}/${Bird.COST}`;
    }

    getValue() {
        return this.egg > 0 ? 2 * Cat.TURNS : 0;
    }
}

/** ... */
export class ConiferTree extends Structure {
    acceptedSources = [ConiferTree];
}

/** ... */
export class Trunk extends Structure {
    acceptedSources = [Bush];

    food = new Food(this, Math.trunc(Size.object / 4));

    /** @param {number} food */
    pull(food) {
        food = Math.min(food, this.food.value)
        this.food.add(-food);
        return food;
    }

    /**
     * @param {number} food
     */
    push(food) {
        this.food.add(food);
        this.info = this.food.value.toString();
    }

    /**
     * @param {number} food
     */
    feed(food) {
        // TODO check boundaries
        this.food.add(-food);
        this.info = this.food.value.toString();
    }

    getValue() {
        return this.food.value;
    }
}

export class Bird extends Entity {
    // 5 - 10 rounds / 15 - 30 s
    static COST = 10;

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
        const position = source.getLanding();
        this.setPosition(position.x, position.y);

        const eye = this.list[1];
        eye.setTexture(destination instanceof ConiferTree ? "bird-eye-angry" : "bird-eye");
    }

    /** ... */
    turn() {
        if (this.source && this.destination) {
            // better: angry bool
            this.destination.push(this.source.pull());

            let destinationPosition = this.destination.getLanding();
            if (this.destination instanceof ConiferTree) {
                if (this.scene.cats.getLength() > 0) {
                    // TODO better algo: distribute all defense birds amongst all cats
                    const cats = this.scene.cats.getChildren();
                    const cat = cats[Math.trunc(Math.random() * cats.length)];
                    cat.mob();
                    destinationPosition = cat;
                }
            }

            const sourcePosition = this.source.getLanding();
            const angle = new Util.Vector2(destinationPosition).subtract(sourcePosition).angle();
            const reverse = (angle >= Math.PI / 2 && angle < 3 / 2 * Math.PI);
            //const reverse = true;
            //this.flipX = true;


            const t = World.TURN_DURATION / 2;
            const d = t / 3;
            this.scene.tweens.chain({
                targets: this,
                tweens: [{
                    duration: t - d,
                    ease: "Cubic.inOut",
                    // yoyo: true,
                    // delay: d / 2 + Math.random() * d / 2,
                    delay: Math.random() * d,
                    // delay: t / 4, // 200 + Math.random() * 100,
                    // hold: t / 4, // 200 + Math.random() * 100,
                    //flipY: true,
                    //flipX: false,
                    props: {x: destinationPosition.x, y: destinationPosition.y},
                        //flipX: {from: true, to: false}}
                    onStart: () => {
                        console.log("TWEEN START");
                        // this.flipX = reverse;
                        this.scaleX = reverse ? -1 : 1;
                    }
                }, {
                    duration: t - d,
                    ease: "Cubic.inOut",
                    // yoyo: true,
                    // delay: d / 2 + Math.random() * d / 2,
                    delay: Math.random() * d,
                    // delay: t / 4, // 200 + Math.random() * 100,
                    // hold: t / 4, // 200 + Math.random() * 100,
                    props: {x: sourcePosition.x, y: sourcePosition.y},
                    onStart: () => {
                        console.log("TWEEN START");
                        // this.flipX = !reverse;
                        this.scaleX = reverse ? 1 : -1;
                    }
                }]
            });
        } else {
            const t = World.TURN_DURATION / 2;
            const d = t / 3;
            const delay = Math.random() * d;
            const scaleX = Math.random() < 0.5 ? 1 : -1;
            this.scene.tweens.add({
                targets: this,
                duration: 0,
                delay: delay + 250,
                props: {scaleX}
            });
            this.scene.tweens.add({
                targets: this,
                duration: 250,
                delay,
                ease: "Cubic.out",
                yoyo: true,
                props: {y: `-=${Size.object / 8}`}
            })
        }
    }

    /**
     * @param {Util.Vector2} target
     */
    flighDirection(target) {
        const angle = new Util.Vector2(target).subtract(this).angle();
        return (angle >= Math.PI / 2 && angle < 3 / 2 * Math.PI) ? -1 : 1;
    }

    /**
     * @param {Trunk} trunk
     * @param {Util.Vector2} target
     */
    migrate(trunk, target) {
        trunk.feed(Bird.COST);

        const trunkPosition = trunk.getLanding();

        const t = World.TURN_DURATION / 2;
        const d = t / 3;
        this.scene.tweens.chain({
            targets: this,
            tweens: [{
                duration: t - d,
                ease: "Cubic.inOut",
                delay: Math.random() * d,
                props: {x: trunkPosition.x, y: trunkPosition.y},
                onStart: () => {
                    this.flipX = this.flighDirection(trunkPosition) === -1
                }
            }, {
                duration: t - d,
                ease: "Cubic.inOut",
                delay: Math.random() * d,
                props: {x: target.x, y: target.y},
                onStart: () => {
                    this.flipX = this.flighDirection(target) === -1
                }
            }]
        });
    }
}

class Cat extends Entity {
    static TURNS = 10;
    static STEAL = 5;

    /** @type {Structure?} */
    target = null;
    stay = Cat.TURNS;

    turn() {
        if (this.target) {
            const food = this.target.pull(Cat.STEAL);
            console.log("CAT STOLE", food);
            this.stay--;
            this.info = `${this.stay}/${Cat.TURNS}`;

            const t = World.TURN_DURATION / 2;
            const d = t / 3;
            const delay = Math.random() * d;
            this.scene.tweens.add({
                targets: this,
                duration: 250,
                delay,
                ease: "Cubic.out",
                yoyo: true,
                props: {y: `-=${Size.object / 8}`}
            })
        }
    }

    /** @param {Structure} target */
    assign(target) {
        this.target = target;
        const position = target.getLanding();
        this.setPosition(position.x, position.y);
    }

    mob() {
        this.stay--;
        this.info = `${this.stay}/${Cat.TURNS}`;
    }
}

// 1. Stash
// 2. Cat events

export class World extends Scene {
    static TURN_DURATION = 3000;
    static WINTER = 100; // 5 min
    //static WINTER = 40; // 2 min
    //static WINTER = 20; // 2 min
    //static WINTER = 11; // 30 sec

    /** @returns {GameObjects.Group} */
    get cats() {
        if (!this.#cats) {
            throw new Error("Uninitialized");
        }
        return this.#cats;
    }

    /** @type {GameObjects.Text?} */
    #infoText = null;
    #debugTexts = new WeakMap();
    /** @type {GameObjects.Group?} */
    #structures = null;
    /** @type {GameObjects.Group?} */
    #birds = null;
    /** @type {GameObjects.Group?} */
    #cats = null;
    /** @type {Bird?} */
    #bird = null;
    /** @type {GameObjects.Image?} */
    #selection = null;
    /** @type {GameObjects.Image?} */
    #moon = null;
    /** @type {GameObjects.TileSprite?} */
    #assignMarker = null;
    #afterDrag = false;
    /** @type {Time.TimerEvent?} */
    #timer = null;

    /** @type {GameObjects.Text?} */
    #unknownText = null;

    turns = 0;

    constructor() {
        super({key: "world"});
    }

    create() {
        this.#structures = this.add.group();
        this.#birds = this.add.group();
        this.#cats = this.add.group();

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

        const moonSize = Size.object / 2;
        this.generateTexture("moon", moonSize, moonSize, context => {
            context.strokeStyle = Color.PRIMARY;
            context.fillStyle = Color.BACKGROUND;
            const body = new Geom.Circle(moonSize / 2, moonSize / 2, moonSize / 2 - 1);
            fillShape(context, body);
            fillShape(context, body, {stroke: true});
        });
        this.#moon = this.add.image(0, 0, "moon");

        // 360
        const nX = Math.trunc(Size.width / objectWidth);
        // const nY = Math.trunc((Size.height - objectWidth) / gapHeight + 1);
        const nY = Math.trunc((Size.height - objectWidth) / gapHeight);

        /** @type {Array<Util.Vector2>} */
        const points = [];
        for (let y = 0; y < nY; y++) {
            for (let x = 0; x < (y % 2 ? nX - 1 : nX); x++) {
                points.push(
                    new Util.Vector2(
                        x * objectWidth + offset + (y % 2 ? offset : 0),
                        // y * gapHeight + offset
                        y * gapHeight + objectWidth + gapHeight
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

        const deciduousTreeCount = 10;
        const coniferTreeCount = 10;
        const bushCount = 10;
        const trunkCount = 5;

        function* randomPoints() {
            const rnd = shuffle(points.slice());
            for (let point of rnd) {
                yield point;
            }
        }

        const gen = randomPoints();

        for (let i = 0; i < bushCount; i++) {
            const point = gen.next().value;
            if (!point) {
                throw new Error("point");
            }
            // const bush = this.add.circle(point.x, point.y, objectRadius / 2);
            // bush.setStrokeStyle(1, 0xffffff);
            // const bush = this.add.image(point.x, point.y, "bush");
            // const bush = this.add.existing(new Bush(this, point.x, point.y, "bush"));
            const bush = this.createBush();
            bush.setPosition(point.x, point.y);
            bush.depth = point.y;
        }
        for (let i = 0; i < deciduousTreeCount; i++) {
            const point = gen.next().value;
            if (!point) {
                throw new Error("point");
            }
            //const tree = this.add.triangle(
            //    point.x, point.y, 0, 0, objectRadius, objectWidth, objectWidth, 0
            //);
            //tree.setStrokeStyle(1, 0xffffff);
            // const tree = this.add.image(point.x, point.y, "tree");
            // const tree = this.add.existing(new Tree(this, point.x, point.y, "tree"));
            const tree = this.createDeciduousTree();
            tree.setPosition(point.x, point.y);
            tree.depth = point.y;
        }
        for (let i = 0; i < coniferTreeCount; i ++) {
            const point = gen.next().value;
            if (!point) {
                throw new Error("point");
            }
            const tree = this.createConiferTree();
            tree.setPosition(point.x, point.y);
            tree.depth = point.y;
        }
        for (let i = 0; i < trunkCount; i++) {
            const point = gen.next().value;
            if (!point) {
                throw new Error("point");
            }
            const trunk = this.createTrunk();
            trunk.setPosition(point.x, point.y);
            trunk.depth = point.y;
        }

        const birdCount = 2;
        for (let i = 0; i < birdCount; i++) {
            const bird = this.createBird();
            const point = gen.next().value;
            if (!point) {
                throw new Error("point");
            }
            bird.setPosition(point.x, point.y);
            console.log("BIRD", bird.x, bird.y);
        }

        const bird = this.#birds.getChildren()[0];
        const selectionWidth = bird.input.hitArea.width;
        const selectionHeight = bird.input.hitArea.height;
        console.log("SEL", selectionWidth, selectionHeight);
        this.generateTexture("selection", selectionWidth, selectionHeight, context => {
            context.strokeStyle = "#ffffff";
            fillShape(
                context, new Geom.Rectangle(0, 0, selectionWidth, selectionHeight), {stroke: true}
            );
        });
        this.#selection = this.add.image(0, 0, "selection");
        this.#selection.depth = 10002;
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
        this.#assignMarker.depth = 10002;

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
                    // const center = this.#bird.getCenter();
                    //const center = Geom.Rectangle.GetCenter(this.#bird.input.hitArea);
                    //this.#selection?.setPosition(this.#bird.x + center.x, this.#bird.y + center.y);
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
        this.input.on("drop", (pointer, object, zone) => {
            if (!this.#bird) {
                return;
            }
            console.log("DROPPED", object, zone);
            if (zone.acceptedSources.includes(object.constructor)) {
                this.#bird.assign(object, zone);
            } else if (object.acceptedSources.includes(zone.constructor)) {
                this.#bird.assign(zone, object);
            } else {
                this.#unknownText?.setVisible(true);
                this.#unknownText?.setPosition(pointer.x, pointer.y);
                //this.#unknownText?.alpha = 1;
                this.tweens.add({
                    targets: this.#unknownText,
                    props: {
                        y: {value: `-=${this.font.fontSize}`, ease: "Cubic.Out"},
                        alpha: {value: [1, 0], ease: "Linear"}
                    }
                })
            }
        });

        // setInterval(() => this.turn(), 1000);
        this.#timer = this.time.addEvent({delay: World.TURN_DURATION, loop: true, callback: () => this.turn()});

        const FONT_SIZE = 16;
        const style = {
            fontSize: FONT_SIZE
        }
        this.#infoText = this.add.text(
            this.cameras.main.width - FONT_SIZE, this.cameras.main.height - FONT_SIZE, "", style
        );

        this.#unknownText = this.write(0, 0, "?");
        this.#unknownText.setVisible(false);
        this.#unknownText.setOrigin(0.5, 1);
        this.#unknownText.depth = 10002;
    }

    turn() {
        console.log("TURN");
        if (this.turns >= World.WINTER) {
            this.end();
            return;
        }

        if (
            this.turns === Math.trunc(World.WINTER / 4) ||
            this.turns === Math.trunc(World.WINTER * 2 / 4)
        ) {
            this.spawnCat();
        }
        if (this.turns === Math.trunc(World.WINTER * 3 / 4)) {
            this.spawnCat();
            this.spawnCat();
        }

        if (!this.#birds || !this.#cats) {
            throw new Error("AAA");
        }
        for (const bird of this.#birds.getChildren()) {
            if (!(bird instanceof Bird)) {
                throw Error("Assertion failed");
            }
            bird.turn();
        }
        for (const cat of this.#cats.getChildren()) {
            if (!(cat instanceof Cat)) {
                throw Error("Assertion failed");
            }
            cat.turn();

            if (cat.stay <= 0) {
                this.#cats.remove(cat, true);
            }
        }
        for (const structure of this.#structures?.getChildren() ?? []) {
            if (!(structure instanceof Structure)) {
                throw new Error("Assertion failed");
            }
            structure.turn();
        }

        this.turns++;
        this.#moon?.setPosition((this.turns / World.WINTER) * this.cameras.main.width, 0);
        //this.#infoText?.setText(`${this.turns}/${World.WINTER}`);
        this.#infoText?.setOrigin(1, 0.5);
    }

    end() {
        console.log("END");
        this.#timer?.remove();

        if (!this.#structures) {
            throw new Error("Assertion failed");
        }
        const trunks = this.#structures.getChildren().filter(
            structure => structure instanceof Trunk
        );

        function randomTrunk() {
            let fullTrunks = trunks.filter(trunk => trunk.food.value >= Bird.COST);
            console.log("FULL TRUNKS", fullTrunks.length);
            // let fullTrunks = trunks.filter(trunk => true);
            if (fullTrunks.length === 0) {
                return null;
            }
            const i = Math.trunc(Math.random() * fullTrunks.length);
            return fullTrunks[i];
        }

        const target = new Util.Vector2(this.cameras.main.centerX, this.cameras.main.centerY)
            .rotate(Math.random() * 2 * Math.PI)
            .add(new Util.Vector2(this.cameras.main.centerX, this.cameras.main.centerY)).scale(1.1);
        console.log("TARGET", target);

        let migrated = 0;
        for (const bird of this.#birds?.getChildren() ?? []) {
            if (!(bird instanceof Bird)) {
                throw Error("Assertion failed");
            }
            const trunk = randomTrunk();
            if (!trunk) {
                break
            }
            bird.migrate(trunk, target);
            migrated++;
        }

        this.#timer = this.time.addEvent({
            delay: World.TURN_DURATION,
            callback: () => {
                //const migrated = this.#birds.getLength();
                let highScore = parseInt(localStorage.highScore) || 0;
                if (migrated > highScore) {
                    localStorage.highScore = migrated;
                }
                this.scene.start("fin", {migrated, highScore, birds: this.#birds?.getLength()});
            }
        });
    }

    update() {
        if (this.#bird) {
            // const center = this.#bird.getCenter();
            const center = Geom.Rectangle.GetCenter(this.#bird.input.hitArea);
            // this.#selection?.setPosition(center.x, center.y);
            this.#selection?.setPosition(this.#bird.x + center.x, this.#bird.y + center.y);
        }
        return;

        const entities = [
            ...(this.#structures?.getChildren() ?? []),
            ...(this.#cats?.getChildren() ?? [])
        ];
        // for (const structure of this.#structures?.getChildren() ?? []) {
        for (const entity of entities) {
            if (!(entity instanceof Entity)) {
                throw new Error("Assertion failed");
            }
            let text = this.#debugTexts.get(entity);
            if (!text) {
                text = this.add.text(entity.x, entity.y, "");
                this.#debugTexts.set(entity, text);
            }
            text.setText(entity.info);
        }
    }

    /** ... */
    spawnCat() {
        const cat = this.createCat();
        const targets = (this.#structures?.getChildren() ?? []).filter(
            structure => structure instanceof DeciduousTree || structure instanceof Trunk
        );
        targets.sort((a, b) => b.getValue() - a.getValue());
        console.log("TARGETS", targets.map(structure => structure.getValue()));
        const target = targets[0];
        cat.assign(target);
    }

    /** @returns {Bush} */
    createBush() {
        this.generateTexture("bush", Size.object, Size.object, context => {
            context.strokeStyle = Color.PRIMARY;
            context.fillStyle = Color.BACKGROUND;
            const size = Size.object * 5 / 6;
            const circle = new Geom.Circle(Size.object / 2, Size.object, size / 2 - 1);
            console.log("BUUUUUSH");
            fillShape(context, circle, {start: 0.5, closed: true});
            fillShape(context, circle, {stroke: true, start: 0.5, closed: true});

            const fruitSize = Size.object / 8;
            const fruit = new Geom.Circle(0, 0, fruitSize / 2 - 0.5);
            drawSticky({shape: fruit}, {shape: circle, x: 1 / 3, y: 1 / 6}, context, {stroke: true});
            drawSticky({shape: fruit}, {shape: circle, x: 2 / 3, y: 2 / 6}, context, {stroke: true});
        });
        const body = new GameObjects.Image(this, 0, 0, "bush");
        body.setOrigin(0.5, 1);
        const bush = new Bush(this, 0, 0, [body]);
        //bush.setInteractive({draggable: true});
        bush.setInteractive({
            hitArea: body.getBounds(),
            hitAreaCallback: Geom.Rectangle.Contains,
            draggable: true,
            dropZone: true
        });
        //this.input.enableDebug(bush);
        this.#structures?.add(bush, true);
        return bush;
    }

    createDeciduousTree() {
        this.generateTexture("deciduous", Size.object, Size.object, context => {
            context.strokeStyle = Color.PRIMARY;
            context.fillStyle = Color.BACKGROUND;
            const canvas = new Geom.Rectangle(0, 0, Size.object, Size.object);

            const trunk = new Geom.Triangle(0, Size.object / 2, Size.object / 8, 0, Size.object / 4, Size.object / 2);
            drawSticky({shape: trunk, y: 1}, {shape: canvas, y: 1}, context, {stroke: true, closed: true});

            const r = Size.object * 5 / 6 / 2;
            const circle = new Geom.Circle(
                // objectRadius / 2, objectRadius / 2, objectRadius / 2 - 1
                //Size.objectRadius, Size.objectRadius, Size.objectRadius - 1
                r, r, r - 1
            );
            drawSticky({shape: circle, y: 0}, {shape: canvas, y: 0}, context);
            drawSticky({shape: circle, y: 0}, {shape: canvas, y: 0}, context, {stroke: true});
            //fillShape(context, circle, {stroke: true});
        });
        const body = new GameObjects.Image(this, 0, 0, "deciduous");
        body.setOrigin(0.5, 1);
        const tree = new DeciduousTree(this, 0, 0, [body]);
        //tree.setInteractive({dropZone: true});
        tree.setInteractive({
            hitArea: body.getBounds(),
            hitAreaCallback: Geom.Rectangle.Contains,
            draggable: true,
            dropZone: true
        });
        //this.input.enableDebug(tree);
        this.#structures?.add(tree, true);
        return tree;
    }

    createConiferTree() {
        this.generateTexture("conifer", Size.object, Size.object, context => {
            context.strokeStyle = Color.PRIMARY;
            context.fillStyle = Color.BACKGROUND;
            const canvas = new Geom.Rectangle(0, 0, Size.object, Size.object);

            const trunk = new Geom.Triangle(0, Size.object / 2, Size.object / 8, 0, Size.object / 4, Size.object / 2);
            drawSticky({shape: trunk, y: 1}, {shape: canvas, y: 1}, context, {stroke: true, closed: true});

            const size = Size.object * 5 / 6;
            const triangle = new Geom.Triangle(
                0, size - 0.5, size / 2, 0, size, size - 0.5
            );
            //context.lineWidth = 2;
            drawSticky({shape: triangle, y: 0}, {shape: canvas, y: 0}, context, {closed: true});
            drawSticky({shape: triangle, y: 0}, {shape: canvas, y: 0}, context, {stroke: true, closed: true});
        });
        const body = new GameObjects.Image(this, 0, 0, "conifer");
        body.setOrigin(0.5, 1);
        const tree = new ConiferTree(this, 0, 0, [body]);
        //tree.setInteractive({draggable: true, dropZone: true});
        tree.setInteractive({
            hitArea: body.getBounds(),
            hitAreaCallback: Geom.Rectangle.Contains,
            draggable: true,
            dropZone: true
        });
        //this.input.enableDebug(tree);
        this.#structures?.add(tree, true);
        return tree;
    }

    createTrunk() {
        const width = Size.object;
        const height = Math.trunc(Size.object / 4);
        this.generateTexture("trunk", width, Size.object, context => {
            context.strokeStyle = Color.PRIMARY;
            context.fillStyle = Color.BACKGROUND;
            context.strokeStyle = Color.PRIMARY;
            const size = Size.object * 5 / 6;
            const body = new Geom.Rectangle((Size.object - size) / 2, Size.object - height, size, height);
            fillShape(context, body);
            fillShape(context, body, {stroke: true});
        });
        const body = new GameObjects.Image(this, 0, 0, "trunk");
        body.setOrigin(0.5, 1);
        const trunk = new Trunk(this, 0, 0, [body]);
        trunk.setInteractive({hitArea: body.getBounds(), hitAreaCallback: Geom.Rectangle.Contains, draggable: true, dropZone: true});
        //this.input.enableDebug(trunk);
        this.#structures?.add(trunk, true);
        return trunk;
    }

    /** @returns {Bird} */
    createBird() {
        const size = Size.object / 2;
        const r = Math.trunc(size / 2);
        const beakSize = Math.trunc(r / 2);
        console.log("SIZES", size, r, beakSize, r - 0.5);
        const width = size + beakSize;
        generateTexture(this.textures, "bird", width, size, context => {
            context.strokeStyle = Color.PRIMARY;
            context.fillStyle = Color.BACKGROUND;
            // TODO this should work, hmmmmm
            const body = new Geom.Circle(r, r, r - 0.5);
            fillCircle(context, body);
            fillCircle(context, body, {stroke: true});
            const beak = new Geom.Triangle(0, 0, beakSize, beakSize / 2, 0, beakSize);
            drawSticky({shape: beak, x: 0}, {shape: body, x: 1}, context);
            drawSticky({shape: beak, x: 0}, {shape: body, x: 1}, context, {stroke: true});
        });
        this.generateTexture("bird-eye", beakSize, beakSize, context => {
            context.fillStyle = Color.PRIMARY;
            const eye = new Geom.Circle(beakSize / 2, beakSize / 2, beakSize / 2);
            fillShape(context, eye);
        });
        this.generateTexture("bird-eye-angry", beakSize, beakSize, context => {
            context.fillStyle = Color.PRIMARY;
            const eye = new Geom.Circle(beakSize / 2, beakSize / 2, beakSize / 2);
            fillShape(context, eye, {end: 0.5});
        });
        const eye = new GameObjects.Image(this, 0, 0, "bird-eye");
        eye.setOrigin(1, 0.5);
        eye.setPosition(size - width / 2 - beakSize / 2, - size / 2 - beakSize / 2)
        console.log("EYE POS", eye.x, eye.y);
        const body = new GameObjects.Image(this, 0, 0, "bird");
        body.setOrigin(0.5, 1);
        const bird = new Bird(this, 0, 0, [body, eye]);
        //console.log(bird.getBounds());
        // bird.setInteractive(new Geom.Rectangle(-size / 2, -size, size, size), Geom.Rectangle.Contains);
        bird.setInteractive(body.getBounds(), Geom.Rectangle.Contains);
        bird.depth = 10001;
        //this.input.enableDebug(bird);
        // return this.add.existing(bird);
        this.#birds?.add(bird, true);
        return bird;
    }

    /** @returns {Cat} */
    createCat() {
        const size = Math.trunc(Size.object / 2);
        const r = size / 2;
        const earPlus = size / 4;
        const eyeSize = size / 4;
        this.generateTexture("cat", size, size + earPlus, context => {
            context.strokeStyle = Color.PRIMARY;
            context.fillStyle = Color.BACKGROUND;
            const canvas = new Geom.Rectangle(0, 0, size, size + earPlus);
            const body = new Geom.Circle(r, r, r);
            drawSticky({shape: body, y: 1}, {shape: canvas, y: 1}, context, {closed: false});
            drawSticky({shape: body, y: 1}, {shape: canvas, y: 1}, context, {stroke: true, end: 0.5, closed: false});
            //drawSticky({shape: body, y: 1}, {shape: canvas, y: 1}, context, {stroke: true, start: 0.7, end: 0.8, closed: false});
            const ear = new Geom.Triangle(0, earPlus + r, r / 4, 0, r, earPlus);
            fillShape(context, ear);
            fillShape(context, ear, {stroke: true});
            const ear2 = new Geom.Triangle(size, earPlus + r, size - r / 4, 0, r, earPlus);
            fillShape(context, ear2);
            fillShape(context, ear2, {stroke: true});
            const eye = new Geom.Circle(0, 0, eyeSize / 2);
            context.fillStyle = Color.PRIMARY;
            drawSticky({shape: eye, x: 0}, {shape: body, x: 0, offsetX: eyeSize / 2}, context, {end: 0.5});
            drawSticky({shape: eye, x: 1}, {shape: body, x: 1, offsetX: -eyeSize / 2}, context, {end: 0.5});
            const whiskerH = new Geom.Triangle(0, 0, r, 0, 0, 0);
            const whisker = new Geom.Triangle(0, 0, r, r / 4, 0, 0);
            const whisker2 = new Geom.Triangle(r, 0, 0, r / 4, r, 0);
            // const whisker2 = Geom.Triangle.RotateAroundXY(Geom.Triangle.Clone(whisker), 0, 0, Math.PI / 2);
            // TODO why is offsetX not working, x: ... here is a hack
            drawSticky({shape: whiskerH, x: 0}, {shape: body, y: 0.75, x: 0.55, offsetX: eyeSize / 2}, context, {stroke: true});
            drawSticky({shape: whisker, x: 0, y: 0}, {shape: body, y: 0.75, x: 0.55, offsetX: eyeSize / 2}, context, {stroke: true});
            drawSticky({shape: whiskerH, x: 1}, {shape: body, y: 0.75, x: 0.45, offsetX: -eyeSize / 2}, context, {stroke: true});
            drawSticky({shape: whisker2, x: 1, y: 0}, {shape: body, y: 0.75, x: 0.45, offsetX: -eyeSize / 2}, context, {stroke: true});
        });
        const body = new GameObjects.Image(this, 0, 0, "cat");
        body.setOrigin(0.5, 1);
        const cat = new Cat(this, 0, 0, [body]);
        cat.depth = 10000;
        this.#cats?.add(cat, true);
        return cat;
    }
}
