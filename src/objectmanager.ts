import { Camera } from "./camera.js";
import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";


export class ObjectManager {


    private player : Player;


    constructor() {

        this.player = new Player(80, 144 - 40);
    }


    public update(stage : Stage, camera : Camera, ev : GameEvent) {

        this.player.update(ev);
        stage.objectCollisions(this.player, ev);

        camera.followObject(this.player, ev);
    }


    public draw(c : Canvas) {

        this.player.draw(c);
    }
}
