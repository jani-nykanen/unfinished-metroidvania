import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { boxOverlay } from "./gameobject.js";
import { InteractionTargetWithCollisions } from "./interactiontarget.js";


export class Projectile extends InteractionTargetWithCollisions {


    private id : number;
    private dir : number;

    private explosive : boolean;
    private friendly : boolean;
    private damage : number;

    private explosionId : number;

    
    constructor() {

        super(0, 0);

        this.id = 0;
        this.dir = 0;
        this.spr = new Sprite(24, 24);

        this.explosive = false;
        this.exist = false;

        this.friendly = false;
        this.damage = 0;
    }


    protected die(ev : GameEvent) {

        const DEATH_SPEED = 4;

        this.spr.animate(this.spr.getRow(), 4, 8, DEATH_SPEED, ev.step);

        return this.spr.getColumn() >= 8;
    }


    protected outsideCameraEvent() {

        this.exist = false;
    }


    public spawn(x : number, y : 
        number, speedx : number, speedy : number,
        id : number, damage = 0, friendly = true, explosionId = -1) : Projectile {

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


    public setInitialOldPos(pos : Vector2) {

        this.oldPos = pos.clone();
    }


    protected updateLogic(ev : GameEvent) {

        const ANIM_SPEED = 2;

        this.spr.animate(this.spr.getRow(), 0, 3, ANIM_SPEED, ev.step);
    }


    protected verticalCollisionEvent(dir : number, ev : GameEvent) {

        this.kill(ev);
    }


    protected wallCollisionEvent(dir : number, ev : GameEvent) {

        this.kill(ev);
    }


    public draw(c : Canvas) {

        if (!this.exist || !this.inCamera) return;

        let bmp = c.getBitmap("projectile");

        let px = Math.floor(this.pos.x) - this.spr.width/2;
        let py = Math.floor(this.pos.y) - this.spr.height/2;

        c.drawSprite(this.spr, bmp, px, py);
    }


    public checkExplosion(x : number, y : number, w : number, h : number) : boolean {

        const EXP_RADIUS = 12;

        return this.explosive && this.dying &&
            (this.pos.x + EXP_RADIUS > x &&
             this.pos.x - EXP_RADIUS < x + w &&
             this.pos.y + EXP_RADIUS > y &&
             this.pos.y - EXP_RADIUS < y + h);
    }


    public breakCollision(x : number, y : number, w : number, h : number, strong : boolean, ev : GameEvent) : boolean {

        const BONUS_MARGIN = 1;

        if (!this.exist || (!this.explosive && this.dying) 
            || !this.inCamera) return false;

        if (strong) {

            return this.checkExplosion(x, y, w, h);
        }
        else {

            if (boxOverlay(this.pos, this.center, this.collisionBox, 
                x-BONUS_MARGIN, y-BONUS_MARGIN, 
                w + BONUS_MARGIN*2, h + BONUS_MARGIN*2)) {

                this.kill(ev);
                return true;
            }
        }
    }


    public kill(ev : GameEvent) {

        this.dying = true;
        this.spr.setFrame(4, this.spr.getRow());

        this.pos.x += this.dir * this.spr.width/4;
    }


    public isFriendly = () : boolean => this.friendly;
    public getDamage = () : number => this.damage;
    public isExplosive = () : boolean => this.explosive;
    public getExplosionId = () : number => this.explosionId;
}
