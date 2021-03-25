import { Canvas, Flip } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { CollisionObject } from "./gameobject.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { State } from "./core/types.js";


export class Player extends CollisionObject {

    private renderOffset : Vector2;

    private jumpTimer : number;
    private jumpMargin : number;
    private canJump : boolean;

    private hurtTimer : number;

    private flip : Flip;


    constructor(x : number, y : number) {

        super(x, y);

        this.friction = new Vector2(0.1, 0.1);
        this.hitbox = new Vector2(16, 16);
        this.collisionBox = new Vector2(12, 12);
        this.center = new Vector2();
        this.renderOffset = new Vector2(0, -2);

        this.inCamera = true;

        this.canJump = false;
        this.jumpTimer = 0;
        this.jumpMargin = 0;

        this.spr = new Sprite(16, 16);
    
        this.hurtTimer = 0;
      
        this.flip = Flip.None;
    }


    protected die(ev : GameEvent) {

        return true;
    }

    
    private control(ev : GameEvent) {

        const BASE_GRAVITY = 4.0;
        const BASE_SPEED = 1.0;
        const JUMP_TIME = 15;

        this.target.x = ev.getStick().x * BASE_SPEED;
        this.target.y = BASE_GRAVITY;

        let s = ev.getAction("fire1");

        // Normal & double jump
        if (this.jumpMargin > 0 && s == State.Pressed) {

            this.jumpTimer =  JUMP_TIME;
            this.jumpMargin = 0;
        }
        else if (this.jumpTimer > 0 && (s & State.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }
    }


    private animate(ev : GameEvent) {

        const EPS = 0.01;
        const JUMP_EPS = 0.5;

        let frame : number;

        if (this.canJump) {

            if (Math.abs(this.speed.x) < EPS) {

                this.spr.setFrame(0, 0);
            }
            else {

                this.spr.animate(0, 1, 4, 6, ev.step);
            }
        }
        else {

            frame = 1;
            if (this.speed.y < -JUMP_EPS)
                frame = 0;
            else if (this.speed.y > JUMP_EPS)
                frame = 2;

            this.spr.setFrame(frame, 1);
        }

        if (Math.abs(this.target.x) > EPS) {

            this.flip = this.target.x > 0 ? Flip.None : Flip.Horizontal;
        }
    }


    private updateTimers(ev : GameEvent) {

        const JUMP_SPEED = -2.0;

        if (this.hurtTimer > 0) {

            this.hurtTimer -= ev.step;
        }

        if (this.jumpMargin > 0) {

            this.jumpMargin -= ev.step;
        }
        
        if (this.jumpTimer > 0 ) {

            this.jumpTimer -= ev.step;
            this.speed.y = JUMP_SPEED;
        }
    }


    protected updateLogic(ev : GameEvent) {

        this.control(ev);
        this.animate(ev);
        this.updateTimers(ev);

        this.canJump = false;
    }


    public draw(c : Canvas) {

        let bmp = c.getBitmap("player");

        let px = Math.round(this.pos.x) + this.renderOffset.x;
        let py = Math.round(this.pos.y) + 1 + this.renderOffset.y;

        c.drawSprite(this.spr, bmp, 
            px - this.spr.width/2, 
            py - this.spr.height/2, 
            this.flip);
    }


    public setPosition(x : number, y : number) {

        this.pos = new Vector2(x, y);
    }


    public hurt(ev : GameEvent) {

        const HURT_TIME = 60;

        if (this.dying || this.hurtTimer > 0) return;

        this.hurtTimer = HURT_TIME;
    }


    protected verticalCollisionEvent(dir : number, ev : GameEvent) {

        const JUMP_MARGIN = 12;

        if (dir > 0) {

            this.canJump = true;
            this.jumpMargin = JUMP_MARGIN;
        }
    }
}
