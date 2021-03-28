import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { ExistingObject } from "./gameobject.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";


export class Dust extends ExistingObject {


    private pos : Vector2;
    private spr : Sprite;
    private speed : number;
    private id : number;


    constructor() {

        super();

        this.exist = false;
    } 


    public spawn(x : number, y : number, speed : number, id = 0) {

        this.pos = new Vector2(x, y);
        this.spr = new Sprite(16, 16);
        this.speed = speed;
        this.id = id;

        this.exist = true;
    }


    public update(ev : GameEvent) {

        if (!this.exist) return;
        
        this.spr.animate(this.id, 0, 4, this.speed, ev.step);
        if (this.spr.getColumn() == 4) {

            this.exist = false;
        }
    }


    public draw(c : Canvas) {

        if (!this.exist) return;

        let bmp = c.getBitmap("dust");

        let px = Math.round(this.pos.x) - this.spr.width/2;
        let py = Math.round(this.pos.y) - this.spr.height/2;

        c.drawSprite(this.spr, bmp, px, py);
    }
}
