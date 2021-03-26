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

    private canAttack : boolean;
    private attacking : boolean;
    private sprSword : Sprite;

    private downAttacking : boolean;
    private downAttackWait : number;

    private hurtTimer : number;

    private flip : Flip;
    private dir : number;


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

        this.canAttack = false;
        this.attacking = false;
        this.sprSword = new Sprite(16, 16);

        this.spr = new Sprite(16, 16);
    
        this.hurtTimer = 0;
      
        this.flip = Flip.None;
        this.dir = 1;
    
        this.downAttacking = false;
        this.downAttackWait = 0;
    }


    protected die(ev : GameEvent) {

        return true;
    }


    private jump(ev : GameEvent) {

        const EPS = 0.1;
        const JUMP_TIME = 15;

        let jumpButtonState = ev.getAction("fire1");

        if (Math.abs(this.target.x) > EPS) {

            this.flip = this.target.x > 0 ? Flip.None : Flip.Horizontal;
            this.dir = Math.sign(this.target.x);
        }

        // Jump
        if (this.jumpMargin > 0 && jumpButtonState == State.Pressed) {

            this.jumpTimer =  JUMP_TIME;
            this.jumpMargin = 0;
        }
        else if (this.jumpTimer > 0 && (jumpButtonState & State.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }
    }


    private attack(ev : GameEvent) {

        const EPS = 0.25;
        const SWORD_RUSH = 1.0;
        const DOWN_ATTACK_GRAVITY = 8.0;
        const DOWN_ATTACK_JUMP = -1.5;

        let down = ev.getStick().y > EPS;

        // Attack
        if ((this.canAttack || (!this.canJump && down)) &&
            ev.getAction("fire2") == State.Pressed) {
            
            this.stopMovement();
            this.jumpTimer = 0;
        
            if (!this.canJump && down) {

                this.downAttacking = true;
                this.downAttackWait = 0;

                this.speed.y = DOWN_ATTACK_JUMP;
                this.target.y = DOWN_ATTACK_GRAVITY;

                return; 
            }

            this.attacking = true;
            this.canAttack = false;

            this.spr.setFrame(0, 2);

            if (this.canJump)
                this.speed.x = SWORD_RUSH * this.dir;

            if (this.climbing) {

                this.flip = this.dir > 0 ? Flip.None : Flip.Horizontal;
            }
        }
    }


    private startClimbing(ev : GameEvent) {

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
            this.jumpTimer = 0;
        }
    }


    private climb(ev : GameEvent) {

        const EPS = 0.1;
        const CLIMB_SPEED = 0.5;
        const CLIB_JUMP_TIME = 15;

        this.canAttack = true;

        let jumpButtonState = ev.getAction("fire1");

        if (Math.abs(ev.getStick().x) > EPS)
            this.dir = Math.sign(ev.getStick().x);

        if (!this.touchLadder) {

            this.climbing = false;
        }
        else {

            this.target.y = CLIMB_SPEED * ev.getStick().y;
            if (jumpButtonState == State.Pressed) {

                this.climbing = false;
                if (ev.getStick().y < EPS) {

                    this.jumpTimer =  CLIB_JUMP_TIME;
                }
            }
        }
    }

    
    private control(ev : GameEvent) {

        const BASE_GRAVITY = 4.0;
        const BASE_SPEED = 1.0;

        this.friction.y = 0.1;
        if (this.downAttacking)
            this.friction.y = 0.25;

        if (this.attacking || this.downAttacking) return;

        this.startClimbing(ev);
        
        if (this.climbing) {

            this.climb(ev);
        }
        else {

            this.target.x = ev.getStick().x * BASE_SPEED;
            this.target.y = BASE_GRAVITY;

            this.jump(ev);
        }

        this.attack(ev);
    }


    private animate(ev : GameEvent) {

        const EPS = 0.01;
        const JUMP_EPS = 0.5;
        const BASE_SPEED = 12;
        const CLIMB_SPEED = 10;
        const SPEED_MOD = 6;

        let frame : number;
        let speed : number;

        if (this.downAttacking) {

            this.spr.setFrame(3, 2);
            this.sprSword.setFrame(3, 0);

            return;
        }

        if (this.attacking) {

            this.spr.animate(2, 0, 3, this.spr.getColumn() == 2 ? 12 : 4, ev.step);
            if (this.spr.getColumn() < 3) {
                
                this.sprSword.setFrame(this.spr.getColumn(), 0);
                return;
            }
            else {

                this.attacking = false;
                if (this.climbing) {

                    this.spr.setFrame(3, 1);
                }
            }
        }

        if (this.climbing) {

            this.flip = Flip.None;
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

        if (this.downAttackWait > 0) {

            if ((this.downAttackWait -= ev.step) <= 0) {

                this.downAttacking = false;
            }
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


    private drawSword(c : Canvas) {

        const X_OFFSET = [12, 14, 12, 3];
        const Y_OFFSET = [-6, 1, 6, 7];

        let bmp = c.getBitmap("weapons");

        let dir = this.flip == Flip.None ? 1 : -1;

        let px = Math.floor(this.pos.x) + this.renderOffset.x;
        let py = Math.floor(this.pos.y) + 1 + this.renderOffset.y;

        px += X_OFFSET[this.sprSword.getColumn()] * dir;
        py += Y_OFFSET[this.sprSword.getColumn()];

        c.drawSprite(this.sprSword, bmp, 
            px - this.spr.width/2, 
            py - this.spr.height/2, 
            this.flip);
    }


    public draw(c : Canvas) {

        let bmp = c.getBitmap("player");

        let px = Math.floor(this.pos.x) + this.renderOffset.x;
        let py = Math.floor(this.pos.y) + 1 + this.renderOffset.y;

        c.drawSprite(this.spr, bmp, 
            px - this.spr.width/2, 
            py - this.spr.height/2, 
            this.flip);

        if (this.attacking || this.downAttacking)
            this.drawSword(c);
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
        const DOWN_ATTACK_WAIT = 30;

        if (dir > 0) {

            if (this.downAttacking && 
                this.downAttackWait <= 0) {

                this.downAttackWait = DOWN_ATTACK_WAIT;
            }

            this.climbing = false;

            this.canJump = true;
            this.jumpMargin = JUMP_MARGIN;

            this.canAttack = true;
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
