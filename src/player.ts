import { Canvas, Flip } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { boxOverlay, CollisionObject } from "./gameobject.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { State } from "./core/types.js";


export class Player extends CollisionObject {

    private renderOffset : Vector2;

    private jumpTimer : number;
    private jumpMargin : number;
    private canJump : boolean;

    private climbing : boolean;
    private touchLadder : boolean;
    private isLadderTop : boolean;
    private climbX : number;

    private hurtTimer : number;

    private flip : Flip;


    constructor(x : number, y : number) {

        super(x, y);

        this.friction = new Vector2(0.1, 0.1);
        this.hitbox = new Vector2(12, 16);
        this.collisionBox = new Vector2(8, 12);
        this.center = new Vector2();
        this.renderOffset = new Vector2(0, -2);

        this.inCamera = true;

        this.canJump = false;
        this.jumpTimer = 0;
        this.jumpMargin = 0;

        this.touchLadder = false;
        this.climbing = false;
        this.climbX = 0;
        this.isLadderTop = false;

        this.spr = new Sprite(16, 16);
    
        this.hurtTimer = 0;
      
        this.flip = Flip.None;
    }


    protected die(ev : GameEvent) {

        return true;
    }

    
    private control(ev : GameEvent) {

        const EPS = 0.1;
        const BASE_GRAVITY = 4.0;
        const BASE_SPEED = 1.0;
        const CLIMB_SPEED = 0.5;
        const JUMP_TIME = 15;

        let jumpButtonState = ev.getAction("fire1");

        // Start climbing
        if (!this.climbing &&
            this.touchLadder && 
            (!this.isLadderTop && ev.upPress() || 
            (this.isLadderTop && ev.downPress()))) {

            this.climbing = true;
            this.pos.x = this.climbX;

            if (this.isLadderTop) {

                this.pos.y += 6;
            }
            this.stopMovement();
        }
        

        // Climb
        if (this.climbing) {

            if (!this.touchLadder) {

                this.climbing = false;
            }
            else {

                this.target.y = CLIMB_SPEED * ev.getStick().y;
                if (jumpButtonState == State.Pressed) {

                    this.climbing = false;
                    if (ev.getStick().y < EPS) {

                        this.jumpTimer =  JUMP_TIME;
                    }
                }
                return;
            }
        }

        this.target.x = ev.getStick().x * BASE_SPEED;
        this.target.y = BASE_GRAVITY;

        // Jump
        if (this.jumpMargin > 0 && jumpButtonState == State.Pressed) {

            this.jumpTimer =  JUMP_TIME;
            this.jumpMargin = 0;
        }
        else if (this.jumpTimer > 0 && (jumpButtonState & State.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }
    }


    private animate(ev : GameEvent) {

        const EPS = 0.01;
        const JUMP_EPS = 0.5;
        const BASE_SPEED = 12;
        const CLIMB_SPEED = 10;
        const SPEED_MOD = 6;

        let frame : number;
        let speed : number;

        if (this.climbing) {

            if (Math.abs(this.speed.y) > EPS) {

                this.spr.animate(1, 3, 4, CLIMB_SPEED, ev.step);
            }
            return;
        }

        if (this.canJump) {

            if (Math.abs(this.speed.x) < EPS) {

                this.spr.setFrame(0, 0);
            }
            else {

                speed = BASE_SPEED - Math.abs(this.speed.x) * SPEED_MOD;
                this.spr.animate(0, 1, 4, speed, ev.step);
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
        this.touchLadder = false;
        this.isLadderTop = false;
    }


    public draw(c : Canvas) {

        let bmp = c.getBitmap("player");

        let px = Math.floor(this.pos.x) + this.renderOffset.x;
        let py = Math.floor(this.pos.y) + 1 + this.renderOffset.y;

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

            this.climbing = false;

            this.canJump = true;
            this.jumpMargin = JUMP_MARGIN;
        }
    }


    public ladderCollision(x : number, y : number, w : number, h : number, 
        ladderTop : boolean, ev : GameEvent) : boolean {

        if (boxOverlay(this.pos, this.center, this.collisionBox, x, y, w, h)) {

            this.climbX = x + w/2;
            this.touchLadder = !ladderTop || !this.climbing;
            this.isLadderTop = this.isLadderTop || ladderTop;

            return true;
        }
        return false;
    }
}
