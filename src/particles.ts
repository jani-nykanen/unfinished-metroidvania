import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { InteractionTargetWithCollisions } from "./interactiontarget.js";


export class Particle extends InteractionTargetWithCollisions {


    private timer : number;


    constructor() {

        super(0, 0);

        this.exist = false;
        this.friction = new Vector2(0.01, 0.1);
        this.collisionBox = new Vector2(6, 6);

        this.spr = new Sprite(16, 16);
        this.spr.setFrame(0, 0);

        this.bounceFactor = 0.90;

        this.timer = 0;
    }


    protected outsideCameraEvent() {

        this.exist = false;
    }


    public spawn(x : number, y : number, speed : Vector2, frame = 0, row = 0, time = 60) {

        const BASE_GRAVITY = 2.0;

        this.pos = new Vector2(x, y);
        this.speed = speed.clone();

        this.target = new Vector2(0, BASE_GRAVITY);

        this.exist = true;
        this.inCamera = true;

        this.spr.setFrame(frame, row);

        this.timer = time;
    }


    public updateLogic(ev : GameEvent) {

        if ((this.timer -= ev.step) <= 0) {

            this.exist = false;
        }
    }


    public draw(c : Canvas) {

        if (!this.exist || !this.inCamera) return;

        c.drawSprite(this.spr, c.getBitmap("particles"),
            Math.round(this.pos.x) - this.spr.width/2,
            Math.round(this.pos.y) - this.spr.height/2);
    }

}
