import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { InteractionTargetWithCollisions } from "./interactiontarget.js";
export class Projectile extends InteractionTargetWithCollisions {
    constructor() {
        super(0, 0);
        this.isFriendly = () => this.friendly;
        this.getDamage = () => this.damage;
        this.isExplosive = () => this.explosive;
        this.getExplosionId = () => this.explosionId;
        this.id = 0;
        this.dir = 0;
        this.spr = new Sprite(24, 24);
        this.explosive = false;
        this.exist = false;
        this.friendly = false;
        this.damage = 0;
    }
    die(ev) {
        const DEATH_SPEED = 4;
        this.spr.animate(this.spr.getRow(), 4, 8, DEATH_SPEED, ev.step);
        return this.spr.getColumn() >= 8;
    }
    outsideCameraEvent() {
        this.exist = false;
    }
    spawn(x, y, speedx, speedy, id, damage = 0, friendly = true, explosionId = -1) {
        const WIDTH = [10, 8];
        const HEIGHT = [2, 8];
        const IS_EXPLOSIVE = [1];
        this.pos = new Vector2(x, y);
        this.speed = new Vector2(speedx, speedy);
        this.target = this.speed.clone();
        this.id = id;
        this.explosive = IS_EXPLOSIVE.includes(id);
        this.collideIfDying = this.explosive;
        this.collisionBox = new Vector2(WIDTH[id], HEIGHT[id]);
        this.hitbox = this.collisionBox.clone();
        this.spr.setFrame(0, this.id);
        this.exist = true;
        this.dying = false;
        this.inCamera = true;
        this.damage = damage;
        this.friendly = friendly;
        this.explosionId = explosionId;
        this.dir = Math.sign(speedx);
        return this;
    }
    setInitialOldPos(pos) {
        this.oldPos = pos.clone();
    }
    updateLogic(ev) {
        const ANIM_SPEED = 2;
        this.spr.animate(this.spr.getRow(), 0, 3, ANIM_SPEED, ev.step);
    }
    verticalCollisionEvent(dir, ev) {
        this.kill(ev);
    }
    wallCollisionEvent(dir, ev) {
        this.kill(ev);
    }
    draw(c) {
        if (!this.exist || !this.inCamera)
            return;
        let bmp = c.getBitmap("projectile");
        let px = Math.floor(this.pos.x) - this.spr.width / 2;
        let py = Math.floor(this.pos.y) - this.spr.height / 2;
        c.drawSprite(this.spr, bmp, px, py);
    }
    checkExplosion(x, y, w, h) {
        const EXP_RADIUS = 10;
        return this.explosive && this.dying &&
            (this.pos.x + EXP_RADIUS > x &&
                this.pos.x - EXP_RADIUS < x + w &&
                this.pos.y + EXP_RADIUS > y &&
                this.pos.y - EXP_RADIUS < y + h);
    }
    breakCollision(x, y, w, h, ev) {
        return this.checkExplosion(x, y, w, h);
    }
    kill(ev) {
        this.dying = true;
        this.spr.setFrame(4, this.spr.getRow());
        this.pos.x += this.dir * this.spr.width / 4;
    }
}
