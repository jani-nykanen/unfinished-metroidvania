import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { InteractionTarget } from "./interactiontarget.js";
import { Player } from "./player.js";
import { Sprite } from "./core/sprite.js";


export class Checkpoint extends InteractionTarget {


    private active : boolean;


    constructor(x : number, y  : number) {

        super(x, y);

        this.active = false;
        this.spr = new Sprite(16, 16);
    }


    protected updateLogic(ev : GameEvent) {

        const ANIM_SPEED = 6;

        if (this.active)
            this.spr.animate(0, 1, 4, ANIM_SPEED, ev.step);
    }


    public draw(c : Canvas) {

        if (!this.exist || !this.inCamera) return;

        let bmp = c.getBitmap("checkpoint");

        c.drawSprite(this.spr, bmp, 
            Math.floor(this.pos.x) - 8,
            Math.floor(this.pos.y) - 8);
    }


    public playerCollision(pl : Player, ev : GameEvent) : boolean {

        if (!this.exist || this.dying || !this.inCamera || pl.isDying())
            return false;

        if (!this.active &&
            pl.overlayObject(this)) {

            pl.setCheckpointReference(this.pos);
            this.active = true;
            this.spr.setFrame(1, 0);

            return true;
        }

        if (this.active &&
            !pl.compareCheckpointReference(this.pos)) {

            this.deactivate();
        }


        return false;
    }


    public deactivate() {

        this.active = false;
        this.spr.setFrame(0, 0);
    }

}
