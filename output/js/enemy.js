import { boxOverlay, CollisionObject } from "./gameobject.js";
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
        const PLAYER_KNOCKBACK = 2.0;
        if (this.isDeactivated())
            return false;
        this.playerEvent(pl, ev);
        let swordHitbox = pl.getSwordHitbox();
        if (pl.canHurt() && boxOverlay(this.pos, this.center, this.collisionBox, swordHitbox.x - swordHitbox.w / 2, swordHitbox.y - swordHitbox.h / 2, swordHitbox.w, swordHitbox.h)) {
            this.kill(ev);
            return true;
        }
        let dir = Math.sign(pl.getPos().x - this.pos.x);
        pl.hurtCollision(this.pos.x + this.center.x - this.hitbox.x / 2, this.pos.y + this.center.y - this.hitbox.y / 2, this.hitbox.x, this.hitbox.y, 1, PLAYER_KNOCKBACK * dir, ev);
        return false;
    }
    projectileCollision(p, ev) {
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
    kill(ev) {
        this.dying = true;
        this.spr.setFrame(0, 0);
    }
}
