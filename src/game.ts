import { Canvas } from "./core/canvas.js";
import { GameEvent, Scene } from "./core/core.js";


export class GameScene implements Scene {



    constructor(param : any, ev : GameEvent) {

    }


    public update(ev : GameEvent) {

    }


    public redraw(c : Canvas) {

        c.clear(170, 170, 170);
        c.moveTo();

        c.drawText(c.getBitmap("font"), "Hello world!", 2, 2, 0, 0);
    }


    public dispose() : any {

        return null;
    }
}
