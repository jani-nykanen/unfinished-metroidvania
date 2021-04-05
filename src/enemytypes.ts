import { Flip } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { clamp } from "./core/mathext.js";
import { Vector2 } from "./core/vector.js";
import { Enemy } from "./enemy.js";
import { InteractionTargetWithCollisions } from "./interactiontarget.js";
import { Player } from "./player.js";


// If I make it a pure array, it will complain that "Slime" used
// before declared
const ENEMY_TYPES = () : Array<Function> => [Slime, Bat];

export const getEnemyType = (index : number) : Function => ENEMY_TYPES()[clamp(index, 0, ENEMY_TYPES().length-1) | 0];


export class Slime extends Enemy {

    static JUMP_TIME = 60; 


    private jumpTimer : number;


    constructor(x : number, y : number) {

        super(x, y, 0, 3, 2);

        const BASE_GRAVITY = 2.0;

        this.collisionBox = new Vector2(8, 8);
        this.hitbox = new Vector2(8, 8);
        this.friction.x = 0.05;

        this.center.y = 3;
        this.mass = 0.75;

        this.target.y = BASE_GRAVITY;

        this.jumpTimer = Slime.JUMP_TIME + 
            (Math.floor((x/16) | 0) % 2) * Slime.JUMP_TIME/2;
    }


    protected updateAI(ev : GameEvent) {

        const JUMP_HEIGHT = -2.0;
        const MOVE_SPEED = 0.5;
        const ANIM_EPS = 0.5;

        if (this.canJump) {

            this.target.x = 0;

            if ((this.jumpTimer -= ev.step) <= 0) {

                this.speed.y = JUMP_HEIGHT;
                this.jumpTimer += Slime.JUMP_TIME;
            
                this.speed.x = MOVE_SPEED * this.dir;
                this.target.x = this.speed.x;

                this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;
            }
        }

        let frame = 0;
        if (this.speed.y < -ANIM_EPS)
            frame = 1;
        else if (this.speed.y > ANIM_EPS)
            frame = 2;
        
        this.spr.setFrame(frame, this.spr.getRow());
    }


    protected playerEvent(pl : Player, ev : GameEvent) {
        
        this.dir = pl.getPos().x > this.pos.x ? 1 : -1;
    }
}



export class Bat extends Enemy {


    private awake : boolean;
    private fallTimer : number;
    private moveDir : Vector2;


    constructor(x : number, y : number) {

        super(x, y, 1, 3, 2);

        this.collisionBox = new Vector2(8, 8);
        this.hitbox = new Vector2(8, 8);

        // For "sleeping" effect
        this.pos.y -= 4;

        this.fallTimer = 0;
        this.awake = false;
    
        this.moveDir = new Vector2(0, 0);
        this.friction = new Vector2(0.05, 0.05);
    }


    protected updateAI(ev : GameEvent) {

        const ANIM_SPEED = 6.0;
        const MOVE_SPEED = 0.5;

        if (!this.awake) return;

        if (this.fallTimer > 0) {

            this.spr.setFrame(1, this.spr.getRow());
            this.fallTimer -= ev.step;

            return;
        }

        this.spr.animate(this.spr.getRow(), 2, 5, ANIM_SPEED, ev.step);
        
        this.target = Vector2.scalarMultiply(this.moveDir, MOVE_SPEED);
    }


    protected playerEvent(pl : Player, ev : GameEvent) {

        const WAKE_UP_DISTANCE = 32;
        const DELTA_Y = 8;
        const FALL_TIME = 30;
        const FALL_SPEED = 1.0;

        let p = pl.getPos();

        if (this.awake) {

            if (this.fallTimer <= 0) {

                this.moveDir = Vector2.direction(this.pos, p);
            }

            return;
        }

        if (this.health < this.maxHealth || 
            (p.y > this.pos.y + DELTA_Y &&
            Math.abs(p.x - this.pos.x) < WAKE_UP_DISTANCE)) {

            this.awake = true;
            this.fallTimer = FALL_TIME;

            this.speed.y = FALL_SPEED;
            this.target.y = this.speed.y;
        }

    }
}