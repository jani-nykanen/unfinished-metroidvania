import { Canvas, Flip } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { CollisionObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";


export abstract class Enemy extends CollisionObject {

    protected startPos : Vector2;

    protected flip : Flip;
    protected id : number;

    protected renderOffset : Vector2;
    protected canJump : boolean;
    protected dir : number;


    constructor(x : number, y : number, id = 0) {

        super(x, y);

        this.startPos = this.pos.clone();

        this.dir = 0;
        this.id = id;
        this.spr = new Sprite(16, 16);
        this.spr.setFrame(0, id+1);

        // Default values, in the case I forget to set them
        // separately for each enemy
        this.friction = new Vector2(0.1, 0.1);
        this.hitbox = new Vector2(16, 16);
        this.collisionBox = this.hitbox.clone();

        this.renderOffset = new Vector2();

        this.canJump = false;
    }

    
    public isDeactivated = () : boolean => (this.dying || !this.exist || !this.inCamera);


    protected updateAI(ev : GameEvent) {}


    protected die(ev : GameEvent) : boolean {

        const DEATH_SPEED = 4;

        this.spr.animate(0, 0, 4, DEATH_SPEED, ev.step);
        
        return this.spr.getColumn() == 4;
    }


    public updateLogic(ev : GameEvent) {

        this.updateAI(ev);

        this.canJump = false;
    }


    public draw(c : Canvas) {

        if (!this.inCamera || !this.exist)
            return;

        let bmp = c.getBitmap("enemies");

        let px = Math.round(this.pos.x) + this.renderOffset.x - this.spr.width/2;
        let py = Math.round(this.pos.y) + this.renderOffset.y - this.spr.height/2;

        c.drawSprite(this.spr, bmp, px, py, this.flip);
    }
    

    protected playerEvent(pl : Player, ev : GameEvent) {}


    public playerCollision(pl : Player, ev : GameEvent) : boolean {

        if (this.isDeactivated()) return false;

        this.playerEvent(pl, ev);

        return false;
    }


    protected enemyCollisionEvent(dirx : number, diry : number, ev : GameEvent) {};


    public enemyCollision(e : Enemy, ev : GameEvent) : boolean {

        if (this.isDeactivated() || e.isDeactivated())
            return false;

        if (this.overlayObject(e)) {

            this.enemyCollisionEvent(
                Math.sign(e.pos.x - this.pos.x), 
                Math.sign(e.pos.y - this.pos.y), ev);
            return true;
        }

        return false;
    }


    protected verticalCollisionEvent(dir : number, ev : GameEvent) {

        this.canJump = true;
    }

}
