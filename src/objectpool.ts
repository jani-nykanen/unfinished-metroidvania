import { Camera } from "./camera.js";
import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { CollisionObject, ExistingObject, nextObject } from "./gameobject.js";
import { Stage } from "./stage.js";


export class ObjectPool<T extends CollisionObject> {


    private objects : Array<T>;
    private type : Function;


    constructor(type : Function) {

        this.type = type;
        this.objects = new Array<T> ();
    }


    public update(stage : Stage, cam : Camera, ev : GameEvent) {

        for (let o of this.objects) {

            o.cameraCheck(cam);
            o.update(ev);
            stage.objectCollisions(o, ev);
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
}
