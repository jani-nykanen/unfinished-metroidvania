import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Vector2 } from "./core/vector.js";
import { ExistingObject } from "./gameobject.js";

const FLYING_TEXT_MOVE_TIME = 16;
const FLYING_TEXT_WAIT_TIME = 30;


let shiftString = (str : string, shift : number) : string => {

    if (shift == 0) return str;

    let out = "";

    for (let i = 0; i < str.length; ++ i) {

        out += String.fromCharCode(str.charCodeAt(i) + shift);
    }
    return out;
}


export class FlyingText extends ExistingObject {


    private pos : Vector2;
    private speed : number;

    private message : string;

    private moveTimer : number;
    private waitTimer : number;


    constructor() {

        super();

        this.pos = new Vector2();
        this.message = "";
        this.moveTimer = 0;
        this.waitTimer = 0;

        this.exist = false;
    }


    public update(ev : GameEvent) {

        if (!this.exist) return;

        if (this.moveTimer > 0) {
            
            this.pos.y -= this.speed * ev.step;
            if ((this.moveTimer -= ev.step) <= 0) {

                this.speed = 0;
            }
        }
        else {

            if ((this.waitTimer -= ev.step) <= 0) {

                this.exist = false;
            }
        }
    }



    public spawn(value : number, x : number, y : number, speed : number, shift = 0, icon = -1) {

        this.message = shiftString(
            (value < 0 ? "-" : "+") + String(Math.abs(value)), 
            shift*16);
        if (icon >= 0) {

            this.message += String.fromCharCode(icon);
        }

        this.waitTimer = FLYING_TEXT_WAIT_TIME;
        this.moveTimer = FLYING_TEXT_MOVE_TIME;

        this.pos = new Vector2(x, y);
        this.speed = speed;

        this.exist = true;
    }


    public draw(c : Canvas) {

        if (!this.exist) return;

        c.drawText(c.getBitmap("fontSmall"), this.message,
            Math.round(this.pos.x), Math.round(this.pos.y-4), 
            -2, 0, true);
    }

}
