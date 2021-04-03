import { Camera } from "./camera.js";
import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { nextObject } from "./gameobject.js";
import { InteractionTargetWithCollisions } from "./interactiontarget.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";


export class ObjectPool<T extends InteractionTargetWithCollisions> {


    private objects : Array<T>;
    private type : Function;


    constructor(type : Function) {

        this.type = type;
        this.objects = new Array<T> ();
    }


    public update(stage : Stage, cam : Camera, player : Player, ev : GameEvent) {

        for (let o of this.objects) {

            o.cameraCheck(cam);
            o.update(ev);
            stage.objectCollisions(o, ev);

            if (player != null) {

                o.playerCollision(player, ev);
            }
        }
    }


    public draw(c : Canvas) {

        for (let o of this.objects) {

            o.draw(c);
        }
    }


    public nextObject() : T {

        return nextObject<T>(this.objects, this.type);
    }


    public event(cb : ((o : T) => void)) {

        for (let o of this.objects) {

            cb(o);
        }
    }


    public killAll() {

        for (let o of this.objects) {

            o.forceKill();
        }
    }


    public clear() {

        this.objects = new Array<T> ();
    }
}
