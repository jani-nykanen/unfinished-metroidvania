import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { CollisionObject } from "./gameobject.js";
export class Collectible extends CollisionObject {
    constructor() {
        super(0, 0);
        this.exist = false;
        this.id = -1;
        this.hitbox = new Vector2(8, 8);
        this.collisionBox = new Vector2(8, 10);
        this.spr = new Sprite(16, 16);
        this.bounceFactor = 0.90;
        this.friction = new Vector2(0.1, 0.1);
    }
    outsideCameraEvent() {
        this.exist = false;
    }
    updateLogic(ev) {
        const ANIM_SPEED = 6;
        this.spr.animate(this.spr.getRow(), 0, 3, ANIM_SPEED, ev.step);
    }
    spawn(id, x, y, speedx = 0, speedy = 0) {
        const BASE_GRAVITY = 2.0;
        this.id = id;
        this.spr.setFrame(0, this.id);
        this.pos = new Vector2(x, y);
        this.speed = new Vector2(speedx, speedy);
        this.target.y = BASE_GRAVITY;
        this.exist = true;
    }
    playerCollision(player) {
        if (this.dying || !this.exist || !this.inCamera)
            return;
        if (player.overlayObject(this)) {
            this.exist = false;
            return true;
        }
        return false;
    }
    draw(c) {
        if (!this.exist || !this.inCamera)
            return;
        let bmp = c.getBitmap("collectible");
        c.drawSprite(this.spr, bmp, Math.floor(this.pos.x) - 8, Math.floor(this.pos.y) - 8 + 1);
    }
}
