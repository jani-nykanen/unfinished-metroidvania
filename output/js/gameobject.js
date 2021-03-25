import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
export const updateSpeedAxis = (speed, target, step) => {
    if (speed < target) {
        return Math.min(target, speed + step);
    }
    return Math.max(target, speed - step);
};
export const boxOverlay = (pos, center, hitbox, x, y, w, h) => {
    let px = pos.x + center.x - hitbox.x / 2;
    let py = pos.y + center.y - hitbox.y / 2;
    return px + hitbox.x >= x && px < x + w &&
        py + hitbox.y >= y && py < y + h;
};
export class ExistingObject {
    constructor() {
        this.doesExist = () => this.exist;
        this.exist = false;
    }
}
export function nextObject(arr, type) {
    let o;
    o = null;
    for (let a of arr) {
        if (!a.doesExist()) {
            o = a;
            break;
        }
    }
    if (o == null) {
        o = new type.prototype.constructor();
        arr.push(o);
    }
    return o;
}
export class WeakGameObject extends ExistingObject {
    constructor(x, y) {
        super();
        this.getPos = () => this.pos.clone();
        this.getHitbox = () => this.hitbox.clone();
        this.isInCamera = () => this.inCamera;
        this.isDying = () => this.dying;
        this.pos = new Vector2(x, y);
        this.oldPos = this.pos.clone();
        this.center = new Vector2();
        this.hitbox = new Vector2();
        this.spr = new Sprite(0, 0);
        this.dying = false;
        this.inCamera = false;
        this.exist = true;
    }
    die(ev) {
        return true;
    }
    update(ev) {
        if (!this.exist || !this.inCamera)
            return;
        if (this.dying) {
            if (this.die(ev)) {
                this.exist = false;
                this.dying = false;
            }
            return;
        }
        this.oldPos = this.pos.clone();
        this.updateLogic(ev);
        this.extendedLogic(ev);
    }
    cameraCheck(cam) {
        let pos = cam.getTopLeftCorner();
        let checkbox = new Vector2(this.spr.width, this.spr.height);
        let oldState = this.inCamera;
        this.inCamera = boxOverlay(this.pos, this.center, checkbox, pos.x, pos.y, cam.width, cam.height);
        if (oldState && !this.inCamera) {
            this.outsideCameraEvent();
        }
    }
    overlayObject(o) {
        return boxOverlay(this.pos, this.center, this.hitbox, o.pos.x + o.center.x - o.hitbox.x / 2, o.pos.y + o.center.y - o.hitbox.y / 2, o.hitbox.x, o.hitbox.y);
    }
    updateLogic(ev) { }
    ;
    outsideCameraEvent() { }
    extendedLogic(ev) { }
    draw(c) { }
    postDraw(c) { }
}
export class GameObject extends WeakGameObject {
    constructor(x, y) {
        super(x, y);
        this.getSpeed = () => this.speed.clone();
        this.getTarget = () => this.target.clone();
        this.speed = new Vector2();
        this.target = this.speed.clone();
        this.friction = new Vector2(1, 1);
    }
    die(ev) {
        return true;
    }
    postUpdate(ev) { }
    updateMovement(ev) {
        this.speed.x = updateSpeedAxis(this.speed.x, this.target.x, this.friction.x * ev.step);
        this.speed.y = updateSpeedAxis(this.speed.y, this.target.y, this.friction.y * ev.step);
        this.pos.x += this.speed.x * ev.step;
        this.pos.y += this.speed.y * ev.step;
    }
    extendedLogic(ev) {
        this.updateMovement(ev);
        this.postUpdate(ev);
    }
    stopMovement() {
        this.speed.zeros();
        this.target.zeros();
    }
}
export class CollisionObject extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.getCollisionBox = () => this.collisionBox.clone();
        this.collisionBox = new Vector2();
        this.bounceFactor = 0;
        this.disableCollisions = false;
    }
    wallCollisionEvent(dir, ev) { }
    verticalCollisionEvent(dir, ev) { }
    wallCollision(x, y, h, dir, ev, force = false) {
        const EPS = 0.001;
        const V_MARGIN = 1;
        const NEAR_MARGIN = 1;
        const FAR_MARGIN = 4;
        if (!this.inCamera ||
            (!force && this.disableCollisions) ||
            !this.exist || this.dying ||
            this.speed.x * dir < EPS)
            return false;
        let top = this.pos.y + this.center.y - this.collisionBox.y / 2;
        let bottom = top + this.collisionBox.y;
        if (bottom <= y + V_MARGIN || top >= y + h - V_MARGIN)
            return false;
        let xoff = this.center.x + this.collisionBox.x / 2 * dir;
        let nearOld = this.oldPos.x + xoff;
        let nearNew = this.pos.x + xoff;
        if ((dir > 0 && nearNew >= x - NEAR_MARGIN * ev.step &&
            nearOld <= x + (FAR_MARGIN + this.speed.x) * ev.step) ||
            (dir < 0 && nearNew <= x + NEAR_MARGIN * ev.step &&
                nearOld >= x - (FAR_MARGIN - this.speed.x) * ev.step)) {
            this.pos.x = x - xoff;
            this.speed.x *= -this.bounceFactor;
            this.wallCollisionEvent(dir, ev);
            return true;
        }
        return false;
    }
    verticalCollision(x, y, w, dir, ev, force = false) {
        const EPS = 0.001;
        const NEAR_MARGIN = 1;
        const FAR_MARGIN = 4;
        if (!this.inCamera ||
            (!force && this.disableCollisions) ||
            !this.exist || this.dying ||
            this.speed.y * dir < EPS)
            return false;
        if (this.pos.x + this.collisionBox.x / 2 < x || this.pos.x - this.collisionBox.x / 2 >= x + w)
            return false;
        let py = this.pos.y + this.center.y + dir * this.collisionBox.y / 2;
        if ((dir > 0 && py > y - NEAR_MARGIN * ev.step &&
            py <= y + (this.speed.y + FAR_MARGIN) * ev.step) ||
            (dir < 0 && py < y + NEAR_MARGIN * ev.step &&
                py >= y + (this.speed.y - FAR_MARGIN) * ev.step)) {
            this.pos.y = y - this.center.y - dir * this.collisionBox.y / 2;
            this.speed.y *= -this.bounceFactor;
            this.verticalCollisionEvent(dir, ev);
            return true;
        }
        return false;
    }
    hurtCollision(x, y, w, h, dmg, knockback, ev) {
        return false;
    }
    breakCollision(x, y, w, h, ev) {
        return false;
    }
}
