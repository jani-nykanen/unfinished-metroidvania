import { InteractionTarget } from "./interactiontarget.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
export class Checkpoint extends InteractionTarget {
    constructor(x, y) {
        super(x, y);
        this.active = false;
        this.spr = new Sprite(16, 16);
        this.hitbox = new Vector2(12, 12);
    }
    updateLogic(ev) {
        const ANIM_SPEED = 6;
        if (this.active)
            this.spr.animate(0, 1, 4, ANIM_SPEED, ev.step);
    }
    draw(c) {
        if (!this.exist || !this.inCamera)
            return;
        let bmp = c.getBitmap("checkpoint");
        c.drawSprite(this.spr, bmp, Math.floor(this.pos.x) - 8, Math.floor(this.pos.y) - 8);
    }
    playerCollision(pl, ev) {
        if (!this.exist || this.dying || !this.inCamera || pl.isDying())
            return false;
        if (!this.active &&
            pl.overlayObject(this)) {
            pl.setCheckpointReference(this.pos);
            this.active = true;
            this.spr.setFrame(1, 0);
            if (ev != null) {
                // Sound effect
            }
            return true;
        }
        if (this.active &&
            !pl.compareCheckpointReference(this.pos)) {
            this.deactivate();
        }
        return false;
    }
    deactivate() {
        this.active = false;
        this.spr.setFrame(0, 0);
    }
}
