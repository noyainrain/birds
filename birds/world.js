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
    food = 0;
    nest = false;
    egg = 0;

    /** @param {number} food */
    pull(food) {
        food = Math.min(food, this.food)
        this.food -= food;
        return food;
    }

    /**
     * @param {number} food
     */
    push(food) {
        this.food += food;

        if (!this.nest) {
            // TODO build nest
        }

        this.info = `${this.food},${this.egg}/${Bird.COST}`;
    }

    turn() {
        // if (this.food > 0) {
        if (this.food >= 2) {
            // this.food--;
            this.food -= 2;
            // this.egg++;
            this.egg += 2;
        }

        if (this.egg >= Bird.COST) {
            this.egg = 0;
            const bird = this.scene.createBird();
            const position = this.getLanding();
            bird.setPosition(position.x, position.y);
        }

        this.info = `${this.food},${this.egg}/${Bird.COST}`;
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

    food = 0;

    /** @param {number} food */
    pull(food) {
        food = Math.min(food, this.food)
        this.food -= food;
        return food;
    }

    /**
     * @param {number} food
     */
    push(food) {
        this.food += food;
        this.info = this.food.toString();
    }

    /**
     * @param {number} food
     */
    feed(food) {
        // TODO check boundaries
        this.food -= food;
        this.info = this.food.toString();
    }

    getValue() {
        return this.food;
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
    // static WINTER = 100; // 5 min
    static WINTER = 40; // 2 min
    // static WINTER = 21; // 30 sec

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
    /** @type {GameObjects.TileSprite?} */
    #assignMarker = null;
    #afterDrag = false;
    /** @type {Time.TimerEvent?} */
    #timer = null;

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
        }
        for (let i = 0; i < coniferTreeCount; i ++) {
            const point = gen.next().value;
            if (!point) {
                throw new Error("point");
            }
            const tree = this.createConiferTree();
            tree.setPosition(point.x, point.y);
        }
        for (let i = 0; i < trunkCount; i++) {
            const point = gen.next().value;
            if (!point) {
                throw new Error("point");
            }
            const trunk = this.createTrunk();
            trunk.setPosition(point.x, point.y);
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
        this.input.on("drop", (_, object, zone) => {
            if (!this.#bird) {
                return;
            }
            console.log("DROPPED", object, zone);
            if (zone.acceptedSources.includes(object.constructor)) {
                this.#bird.assign(object, zone);
            }
        });

        // setInterval(() => this.turn(), 1000);
        this.#timer = this.time.addEvent({delay: World.TURN_DURATION, loop: true, callback: () => this.turn()});

        const FONT_SIZE = 16;
        const style = {
            fontSize: FONT_SIZE
        }
        this.#infoText = this.add.text(
            this.cameras.main.width - FONT_SIZE, this.cameras.main.height - FONT_SIZE, "Test", style
        );
    }

    turn() {
        console.log("TURN");
        if (this.turns >= World.WINTER) {
            this.end();
            return;
        }

        if (
            this.turns === Math.trunc(World.WINTER / 2) ||
            this.turns === Math.trunc(World.WINTER * 3 / 4)
        ) {
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
        this.#infoText?.setText(`${this.turns}/${World.WINTER}`);
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
            let fullTrunks = trunks.filter(trunk => trunk.food >= Bird.COST);
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
                this.scene.start("fin", {migrated, highScore});
            }
        });
    }

    update() {
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

        if (this.#bird) {
            // const center = this.#bird.getCenter();
            const center = Geom.Rectangle.GetCenter(this.#bird.input.hitArea);
            // this.#selection?.setPosition(center.x, center.y);
            this.#selection?.setPosition(this.#bird.x + center.x, this.#bird.y + center.y);
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
            context.strokeStyle = "#ffffff";
            const circle = new Geom.Circle(Size.object / 2, Size.object, Size.object / 2);
            console.log("BUUUUUSH");
            fillShape(context, circle, {stroke: true, start: 0.5, closed: true});
        });
        const body = new GameObjects.Image(this, 0, 0, "bush");
        body.setOrigin(0.5, 1);
        const bush = new Bush(this, 0, 0, [body]);
        //bush.setInteractive({draggable: true});
        bush.setInteractive({
            hitArea: body.getBounds(),
            hitAreaCallback: Geom.Rectangle.Contains,
            draggable: true
        });
        //this.input.enableDebug(bush);
        this.#structures?.add(bush, true);
        return bush;
    }

    createDeciduousTree() {
        this.generateTexture("deciduous", Size.object, Size.object, context => {
            context.strokeStyle = "#ffffff";
            const circle = new Geom.Circle(
                // objectRadius / 2, objectRadius / 2, objectRadius / 2 - 1
                Size.objectRadius, Size.objectRadius, Size.objectRadius - 1
            );
            fillShape(context, circle, {stroke: true});
        });
        const body = new GameObjects.Image(this, 0, 0, "deciduous");
        body.setOrigin(0.5, 1);
        const tree = new DeciduousTree(this, 0, 0, [body]);
        //tree.setInteractive({dropZone: true});
        tree.setInteractive({
            hitArea: body.getBounds(),
            hitAreaCallback: Geom.Rectangle.Contains,
            dropZone: true
        });
        //this.input.enableDebug(tree);
        this.#structures?.add(tree, true);
        return tree;
    }

    createConiferTree() {
        this.generateTexture("conifer", Size.object, Size.object, context => {
            const triangle = new Geom.Triangle(
                0, Size.object - 0.5, Size.objectRadius, 0, Size.object, Size.object - 0.5
            );
            //context.lineWidth = 2;
            context.strokeStyle = "#ffffff";
            fillTriangle(context, triangle, {stroke: true, closed: true});
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
            context.fillStyle = "#ff0000";
            context.strokeStyle = Color.PRIMARY;
            fillShape(context, new Geom.Rectangle(0, Size.object - height, width, height), {stroke: true});
        });
        const body = new GameObjects.Image(this, 0, 0, "trunk");
        body.setOrigin(0.5, 1);
        const trunk = new Trunk(this, 0, 0, [body]);
        trunk.setInteractive({hitArea: body.getBounds(), hitAreaCallback: Geom.Rectangle.Contains, dropZone: true});
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
            context.strokeStyle = "#ffffff";
            context.fillStyle = Color.PRIMARY;
            // TODO this should work, hmmmmm
            const body = new Geom.Circle(r, r, r - 0.5);
            fillCircle(context, body, {stroke: true});
            const beak = new Geom.Triangle(0, 0, beakSize, beakSize / 2, 0, beakSize);
            drawSticky({shape: beak, x: 0}, {shape: body, x: 1}, context, {stroke: true});
            console.log("BEAK", beak);
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
            context.fillStyle = Color.PRIMARY;
            const canvas = new Geom.Rectangle(0, 0, size, size + earPlus);
            const body = new Geom.Circle(r, r, r);
            drawSticky({shape: body, y: 1}, {shape: canvas, y: 1}, context, {stroke: true, end: 0.5, closed: false});
            //drawSticky({shape: body, y: 1}, {shape: canvas, y: 1}, context, {stroke: true, start: 0.7, end: 0.8, closed: false});
            const ear = new Geom.Triangle(0, earPlus + r, r / 4, 0, r, earPlus);
            fillShape(context, ear, {stroke: true});
            const ear2 = new Geom.Triangle(size, earPlus + r, size - r / 4, 0, r, earPlus);
            fillShape(context, ear2, {stroke: true});
            const eye = new Geom.Circle(0, 0, eyeSize / 2);
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
        this.#cats?.add(cat, true);
        return cat;
    }
}
