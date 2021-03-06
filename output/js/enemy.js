import { boxOverlay, CollisionObject, nextObject } from "./gameobject.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { FlyingText } from "./flyingtext.js";
export class Enemy extends CollisionObject {
    constructor(x, y, id = 0, health = 1, attackPower = 1) {
        super(x, y);
        this.isDeactivated = () => (this.dying || !this.exist || !this.inCamera);
        this.isHurt = () => this.hurtTimer > 0;
        this.maxHealth = health;
        this.health = this.maxHealth;
        this.attackPower = attackPower;
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
        this.oldCanJump = false;
        this.hurtTimer = 0;
        this.mass = 1;
        this.lastHitId = -1;
        this.lastExplosionId = -1;
        this.offCameraRadius = 32;
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
        this.oldCanJump = this.canJump;
        this.canJump = false;
    }
    draw(c) {
        if (!this.inCamera || !this.exist)
            return;
        if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 4) % 2 == 1)
            return;
        let bmp = c.getBitmap("enemies");
        let px = Math.floor(this.pos.x) + this.renderOffset.x - this.spr.width / 2;
        let py = Math.floor(this.pos.y) + this.renderOffset.y - this.spr.height / 2;
        c.drawSprite(this.spr, bmp, px, py, this.flip);
    }
    playerEvent(pl, ev) { }
    spawnCollectibles(collectibles, dir) {
        const JUMP_Y = -1.0;
        collectibles.spawn(this.pos.x, this.pos.y, dir, JUMP_Y);
    }
    hurt(dmg, flyingText, collectibles, knockbackDir, knockback, ev) {
        const BASE_KNOCKBACK = 1.0;
        const HURT_TIME = 30;
        const MESSAGE_SPEED = 1.0;
        if ((this.health -= dmg) <= 0) {
            this.spawnCollectibles(collectibles, knockbackDir);
            this.hurtTimer = 0;
            this.kill(ev);
        }
        else {
            this.hurtTimer = HURT_TIME + (this.hurtTimer % 2);
            this.speed.x = knockbackDir * knockback * BASE_KNOCKBACK * this.mass;
        }
        nextObject(flyingText, FlyingText).spawn(-dmg, this.pos.x, this.pos.y + this.center.y - this.spr.height / 2, MESSAGE_SPEED);
    }
    playerCollision(pl, flyingText, collectibles, ev) {
        const PLAYER_KNOCKBACK = 2.0;
        if (this.isDeactivated())
            return false;
        this.playerEvent(pl, ev);
        // Cannot use Math.sign here since it might return 0
        // (very unlikely since we are dealing with floating point numbers,
        // but in theory possible)
        let dir = pl.getPos().x - this.pos.x > 0 ? 1 : -1;
        if (pl.isDownAttack())
            dir = 0;
        let swordHitbox = pl.getSwordHitbox();
        if (pl.getSwordHitId() > this.lastHitId &&
            pl.canHurt() && boxOverlay(this.pos, this.center, this.collisionBox, swordHitbox.x - swordHitbox.w / 2, swordHitbox.y - swordHitbox.h / 2, swordHitbox.w, swordHitbox.h)) {
            this.hurt(pl.getAttackDamage(), flyingText, collectibles, -dir, pl.getAttackDamage(), ev);
            this.lastHitId = pl.getSwordHitId();
            pl.downAttackBoost();
            return true;
        }
        pl.hurtCollision(this.pos.x + this.center.x - this.hitbox.x / 2, this.pos.y + this.center.y - this.hitbox.y / 2, this.hitbox.x, this.hitbox.y, this.attackPower, PLAYER_KNOCKBACK * dir, ev);
        return false;
    }
    projectileCollision(p, flyingText, collectibles, ev) {
        if (!p.isFriendly() || (p.isDying() && !p.isExplosive())
            || !p.doesExist() || !p.isInCamera())
            return false;
        let hitbox = p.getHitbox();
        let pos = p.getPos();
        let dir = p.getPos().x - this.pos.x > 0 ? 1 : -1;
        if (!p.isDying() && boxOverlay(this.pos, this.center, this.hitbox, pos.x - hitbox.x / 2, pos.y - hitbox.y / 2, hitbox.x, hitbox.y)) {
            p.kill(ev);
            this.hurt(p.getDamage(), flyingText, collectibles, -dir, p.getDamage(), ev);
            // Needed if kills the bullet and causes the explosion
            if (p.getExplosionId() >= 0)
                this.lastExplosionId = p.getExplosionId();
            return true;
        }
        else if (p.isDying() && p.isExplosive() &&
            this.lastExplosionId < p.getExplosionId() &&
            p.checkExplosion(this.pos.x + this.center.x - this.hitbox.x / 2, this.pos.y + this.center.y - this.hitbox.y / 2, this.hitbox.x, this.hitbox.y)) {
            this.lastExplosionId = p.getExplosionId();
            this.hurt(p.getDamage(), flyingText, collectibles, -dir, p.getDamage(), ev);
            return true;
        }
        return false;
    }
    enemyCollision(e, ev) {
        // To reduce unnecessary collision checks
        const COLLISION_RADIUS = 32;
        if (this.isDeactivated() || e.isDeactivated())
            return false;
        // Infinity norm is faster to compute than 2-norm
        if (Math.max(Math.abs(this.pos.x - e.pos.x), Math.abs(this.pos.y - e.pos.y)) > COLLISION_RADIUS) {
            return false;
        }
        let px = this.pos.x + this.center.x - this.hitbox.x / 2;
        let py = this.pos.y + this.center.y - this.hitbox.y / 2;
        let w = this.hitbox.x;
        let h = this.hitbox.y;
        return e.verticalCollision(px, py, w, 1, ev) ||
            e.verticalCollision(px, py + h, w, -1, ev) ||
            e.wallCollision(px, py, h, 1, ev) ||
            e.wallCollision(px + w, py, h, -1, ev);
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
