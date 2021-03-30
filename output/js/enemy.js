import { boxOverlay, CollisionObject, nextObject } from "./gameobject.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { FlyingText } from "./flyingtext.js";
export class Enemy extends CollisionObject {
    constructor(x, y, id = 0, health = 1) {
        super(x, y);
        this.isDeactivated = () => (this.dying || !this.exist || !this.inCamera);
        this.maxHealth = health;
        this.health = this.maxHealth;
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
        this.hurtTimer = 0;
        this.mass = 1;
        this.lastHitId = -1;
    }
    updateAI(ev) { }
    die(ev) {
        const DEATH_SPEED = 4;
        this.spr.animate(0, 0, 4, DEATH_SPEED, ev.step);
        return this.spr.getColumn() == 4;
    }
    updateLogic(ev) {
        if (this.hurtTimer > 0)
            this.hurtTimer -= ev.step;
        this.updateAI(ev);
        this.canJump = false;
    }
    draw(c) {
        if (!this.inCamera || !this.exist)
            return;
        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 4) % 2 == 1)
            return;
        let bmp = c.getBitmap("enemies");
        let px = Math.round(this.pos.x) + this.renderOffset.x - this.spr.width / 2;
        let py = Math.round(this.pos.y) + this.renderOffset.y - this.spr.height / 2;
        c.drawSprite(this.spr, bmp, px, py, this.flip);
    }
    playerEvent(pl, ev) { }
    hurt(dmg, flyingText, ev) {
        const HURT_TIME = 30;
        const MESSAGE_SPEED = 1;
        if ((this.health -= dmg) <= 0) {
            this.hurtTimer = 0;
            this.kill(ev);
        }
        else {
            this.hurtTimer = HURT_TIME + (this.hurtTimer % 2);
        }
        nextObject(flyingText, FlyingText).spawn(dmg, this.pos.x, this.pos.y + this.center.y - this.spr.height / 2, MESSAGE_SPEED);
    }
    playerCollision(pl, flyingText, ev) {
        const PLAYER_KNOCKBACK = 2.0;
        const SELF_KNOCKBACK = 2.0;
        if (this.isDeactivated())
            return false;
        this.playerEvent(pl, ev);
        let dir = Math.sign(pl.getPos().x - this.pos.x);
        let swordHitbox = pl.getSwordHitbox();
        if (pl.getSwordHitId() > this.lastHitId &&
            pl.canHurt() && boxOverlay(this.pos, this.center, this.collisionBox, swordHitbox.x - swordHitbox.w / 2, swordHitbox.y - swordHitbox.h / 2, swordHitbox.w, swordHitbox.h)) {
            this.hurt(pl.getAttackDamage(), flyingText, ev);
            this.lastHitId = pl.getSwordHitId();
            this.speed.x = -SELF_KNOCKBACK * dir * this.mass;
            pl.downAttackBoost();
            return true;
        }
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
        this.hurtTimer = 0;
    }
}
