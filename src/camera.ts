import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Vector2 } from "./core/vector.js";
import { GameObject, updateSpeedAxis } from "./gameobject.js";


export class Camera {


    private pos : Vector2;
    private centerOff : Vector2;
    private centerOffTarget : Vector2;
    
    public readonly width : number;
    public readonly height : number;


    constructor(x : number, y : number, width : number, height : number) {

        this.pos = new Vector2(x + width/2, y + height/2);
    
        this.width = width;
        this.height = height;

        this.centerOff = new Vector2();
        this.centerOffTarget = new Vector2();
    }


    public followObject(o : GameObject, ev : GameEvent) {

        const EPS = 0.1;
        const FORWARD = 32;
        const MOVE_SPEED_X = 0.5;
        const VERTICAL_DEADZONE = 16;

        this.pos.x = o.getPos().x;
        let d = this.pos.y - o.getPos().y;
        if (Math.abs(d) >= VERTICAL_DEADZONE) {

            this.pos.y = o.getPos().y + VERTICAL_DEADZONE * Math.sign(d);
        }

        let target = o.getTarget().x;
        let dir = 0;
        if (Math.abs(target) > EPS) {

            dir = Math.sign(target);
        }
        else if (Math.abs(o.getSpeed().x) < EPS) {

            dir = 0;
        }

        this.centerOffTarget.x = dir * FORWARD;

        this.centerOff.x = updateSpeedAxis(this.centerOff.x, 
            this.centerOffTarget.x, MOVE_SPEED_X * ev.step);
        
    }


    public restrictCamera(x : number, y : number, w : number, h : number) {

        // Left
        let px = this.pos.x + this.centerOff.x;
        if (px < x + this.width/2) {

            if (this.centerOff.x < 0) {

                this.centerOff.x += (x + this.width/2 - px);
            }

            if (this.centerOff.x >= 0) {

                this.centerOff.x = 0;
                this.pos.x = x + this.width/2;
            }
        }

        // Right
        px = this.pos.x + this.centerOff.x;
        if (px > x + w - this.width/2) {

            if (this.centerOff.x > 0) {

                this.centerOff.x -= (px - (x + w - this.width/2));
            }

            if (this.centerOff.x <= 0) {

                this.centerOff.x = 0;
                this.pos.x = x + w - this.width/2;
            }
        }

        // Top
        if (this.pos.y < y + this.height/2) {
            
            this.pos.y = y + this.height/2;
        }
        // Bottom
        if (this.pos.y > (y+h) - this.height/2) {
            
            this.pos.y = (y+h) - this.height/2;
        }
    }


    public use(c : Canvas) {

        c.moveTo(
            Math.round(-this.pos.x - this.centerOff.x + this.width/2), 
            Math.round(-this.pos.y - this.centerOff.y + this.height/2)
        );
    }


    public getPos = () : Vector2 => this.pos.clone();
    public getTopLeftCorner = () : Vector2 => new Vector2(
        this.pos.x + this.centerOff.x - this.width/2, 
        this.pos.y + this.centerOff.y - this.height/2);

}
