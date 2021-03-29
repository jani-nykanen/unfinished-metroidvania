import { CollisionObject } from "./gameobject.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
export class Enemy extends CollisionObject {
    constructor(x, y, id = 0) {
        super(x, y);
        this.isDeactivated = () => (this.dying || !this.exist || !this.inCamera);
        this.startPos = this.pos.clone();
        this.dir = 0;
        this.id = id;
        this.spr = new Sprite(16, 16);
        this.spr.setFrame(0, id + 1);
        // Default values, in the case I forget to set them
        // separately for each enemy
        this.friction = new Vector2(0.1, 0.1);
        this.hitbox = new Vector2(16, 16);
        this.collisionBox = this.hitbox.clone();
        this.renderOffset = new Vector2();
        this.canJump = false;
    }
    updateAI(ev) { }
    die(ev) {
        const DEATH_SPEED = 4;
        this.spr.animate(0, 0, 4, DEATH_SPEED, ev.step);
        return this.spr.getColumn() == 4;
    }
    updateLogic(ev) {
        this.updateAI(ev);
        this.canJump = false;
    }
    draw(c) {
        if (!this.inCamera || !this.exist)
            return;
        let bmp = c.getBitmap("enemies");
        let px = Math.round(this.pos.x) + this.renderOffset.x - this.spr.width / 2;
        let py = Math.round(this.pos.y) + this.renderOffset.y - this.spr.height / 2;
        c.drawSprite(this.spr, bmp, px, py, this.flip);
    }
    playerEvent(pl, ev) { }
    playerCollision(pl, ev) {
        if (this.isDeactivated())
            return false;
        this.playerEvent(pl, ev);
        return false;
    }
    enemyCollisionEvent(dirx, diry, ev) { }
    ;
    enemyCollision(e, ev) {
        if (this.isDeactivated() || e.isDeactivated())
            return false;
        if (this.overlayObject(e)) {
            this.enemyCollisionEvent(Math.sign(e.pos.x - this.pos.x), Math.sign(e.pos.y - this.pos.y), ev);
            return true;
        }
        return false;
    }
    verticalCollisionEvent(dir, ev) {
        this.canJump = true;
    }
}
