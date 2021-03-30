import { Flip } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Vector2 } from "./core/vector.js";
import { Enemy } from "./enemy.js";
import { Player } from "./player.js";


// Not very safe
export const getEnemyType = (index : number) : Function => [Slime][index];


export class Slime extends Enemy {

    static JUMP_TIME = 60; 


    private jumpTimer : number;


    constructor(x : number, y : number) {

        super(x, y, 0, 3);

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

