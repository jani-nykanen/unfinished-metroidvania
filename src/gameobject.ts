import { Camera } from "./camera.js";
import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Sprite } from "./core/sprite.js";
import { Rect, Vector2 } from "./core/vector.js";


export const updateSpeedAxis = (speed : number, target : number, step : number) : number => {
		
    if (speed < target) {
        
        return Math.min(target, speed+step);
    }
    return Math.max(target, speed-step);
}


// No better place for these

export const boxOverlay = (pos : Vector2, center : Vector2, hitbox : Vector2, 
    x : number, y : number, w : number, h : number) : boolean => {

    let px = pos.x + center.x - hitbox.x/2;
    let py = pos.y + center.y - hitbox.y/2;

    return px + hitbox.x >= x && px < x+w &&
           py + hitbox.y >= y && py < y+h;
}


export const boxOverlayRect = (rect : Rect, 
    x : number, y : number, w : number, h : number) : boolean => {

    return boxOverlay(
        new Vector2(rect.x, rect.y), 
        new Vector2(), 
        new Vector2(rect.w, rect.h), 
        x, y, w, h);
}


export abstract class ExistingObject {

    protected exist : boolean;


    constructor() {

        this.exist = false;
    }
    

    public doesExist = () : boolean => this.exist;
}


export function nextObject<T extends ExistingObject> (arr : Array<T>, type : Function) {

    let o : T;

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


export abstract class WeakGameObject extends ExistingObject {


    protected pos : Vector2;
    protected oldPos : Vector2;
    protected center : Vector2;

    protected hitbox : Vector2;

    protected dying : boolean;
    protected inCamera : boolean;

    protected spr : Sprite;


    constructor(x : number, y : number) {

        super();

        this.pos = new Vector2(x, y);
        this.oldPos = this.pos.clone();
        this.center = new Vector2();

        this.hitbox = new Vector2();

        this.spr = new Sprite(0, 0);

        this.dying = false;
        this.inCamera = false;

        this.exist = true;
    }


    protected die (ev : GameEvent) : boolean {

        return true;
    }


    public update(ev : GameEvent) {

        if (!this.exist || !this.inCamera) return;

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


    public cameraCheck(cam : Camera) {

        let pos = cam.getTopLeftCorner();

        let checkbox = new Vector2(this.spr.width, this.spr.height);

        let oldState = this.inCamera;
        this.inCamera = boxOverlay(
            this.pos, this.center, checkbox,
            pos.x, pos.y, cam.width, cam.height);

        if (oldState && !this.inCamera) {

            this.outsideCameraEvent();
        }
    }


    public overlayObject(o : WeakGameObject) : boolean {

        return boxOverlay(this.pos, this.center, this.hitbox,
            o.pos.x + o.center.x - o.hitbox.x/2,
            o.pos.y + o.center.y - o.hitbox.y/2,
            o.hitbox.x, o.hitbox.y);
    }


    protected updateLogic(ev : GameEvent) {};
    protected outsideCameraEvent() {}
    protected extendedLogic(ev : GameEvent) {}

    public draw(c : Canvas) {}
    public postDraw(c : Canvas) {}

    public getPos = () => this.pos.clone();
    public getHitbox = () : Vector2 => this.hitbox.clone();

    public isInCamera = () => this.inCamera;
    public isDying = () => this.dying;
    
}


export abstract class GameObject extends WeakGameObject {
    

    protected oldPos : Vector2;
    protected speed : Vector2;
    protected target : Vector2;
    protected friction : Vector2;


    constructor(x : number, y : number) {

        super(x, y);

        this.speed = new Vector2();
        this.target = this.speed.clone();
        this.friction = new Vector2(1, 1);
    }


    protected die (ev : GameEvent) : boolean {

        return true;
    }


    protected postUpdate(ev : GameEvent) {}


    protected updateMovement(ev : GameEvent) {

        this.speed.x = updateSpeedAxis(this.speed.x,
            this.target.x, this.friction.x*ev.step);
        this.speed.y = updateSpeedAxis(this.speed.y,
            this.target.y, this.friction.y*ev.step);

        this.pos.x += this.speed.x * ev.step;
        this.pos.y += this.speed.y * ev.step;
    }


    public extendedLogic(ev : GameEvent) {

        this.updateMovement(ev);
        this.postUpdate(ev);
    }


    public stopMovement() {

        this.speed.zeros();
        this.target.zeros();
    }


    public getSpeed = () => this.speed.clone();
    public getTarget = () => this.target.clone();
}


export abstract class CollisionObject extends GameObject {


    protected collisionBox : Vector2;
    protected bounceFactor : number;
    protected disableCollisions : boolean;
    protected collideIfDying : boolean;


    constructor(x : number, y : number) {

        super(x, y);

        this.collisionBox = new Vector2();
        this.bounceFactor = 0;

        this.collideIfDying = false;
        this.disableCollisions = false;
    }


    protected wallCollisionEvent(dir : number, ev : GameEvent) {}
    protected verticalCollisionEvent(dir : number, ev : GameEvent) {}


    public wallCollision(
        x : number, y : number, h : number, 
        dir : number, ev : GameEvent, force = false) {

        const EPS = 0.001;
        const V_MARGIN = 1;
        const NEAR_MARGIN = 1;
        const FAR_MARGIN = 4;
        
        if (!this.inCamera ||
            (!force && this.disableCollisions) ||
            !this.exist || this.dying || 
            this.speed.x * dir < EPS) 
            return false;

        let top = this.pos.y + this.center.y - this.collisionBox.y/2;
        let bottom = top + this.collisionBox.y;

        if (bottom <= y + V_MARGIN || top >= y + h - V_MARGIN)
            return false;

        let xoff = this.center.x + this.collisionBox.x/2 * dir;
        let nearOld = this.oldPos.x + xoff
        let nearNew = this.pos.x + xoff;

        if ((dir > 0 && nearNew >= x - NEAR_MARGIN*ev.step &&
             nearOld <= x + (FAR_MARGIN + this.speed.x)*ev.step) || 
             (dir < 0 && nearNew <= x + NEAR_MARGIN*ev.step &&
             nearOld >= x - (FAR_MARGIN - this.speed.x)*ev.step)) {

            this.pos.x = x - xoff;
            this.speed.x *= -this.bounceFactor;

            this.wallCollisionEvent(dir, ev);

            return true;
        }

        return false;
    }     


    public verticalCollision(x : number, y: number, w : number,
        dir : number, ev : GameEvent, force = false) : boolean {

        const EPS = 0.001;
        const NEAR_MARGIN = 1;
        const FAR_MARGIN = 4;
        const H_MARGIN = 1;

        if (!this.inCamera ||
            (!force && this.disableCollisions) ||
            !this.exist || this.dying ||
            this.speed.y * dir < EPS)
            return false;

        if (this.pos.x + this.collisionBox.x/2 < x + H_MARGIN || 
            this.pos.x - this.collisionBox.x/2 >= x + w - H_MARGIN)
            return false;

        let py = this.pos.y + this.center.y + dir * this.collisionBox.y/2;

        if ((dir > 0 && py > y - NEAR_MARGIN * ev.step && 
            py <= y + (this.speed.y + FAR_MARGIN) * ev.step) || 
            (dir < 0 && py < y + NEAR_MARGIN * ev.step && 
            py >= y + (this.speed.y - FAR_MARGIN) * ev.step) ) {

            this.pos.y = y - this.center.y - dir*this.collisionBox.y/2;
            this.speed.y *= -this.bounceFactor;

            this.verticalCollisionEvent(dir, ev);

            return true;
        }
    
        return false;
    }


    public hurtCollision(x : number, y : number, w : number, h : number, 
        dmg : number, knockback : number, ev : GameEvent) : boolean {

        return false;
    }


    public breakCollision(x : number, y : number, w : number, h : number, ev : GameEvent) : boolean {

        return false;
    }


    public ladderCollision(x : number, y : number, w : number, h : number, 
        ladderTop : boolean, ev : GameEvent) : boolean {

        return false;
    }


    public getCollisionBox = () : Vector2 => this.collisionBox.clone();
    public doesCollideIfDying = () : boolean => this.collideIfDying;
}
