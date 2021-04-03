import { nextObject } from "./gameobject.js";
export class ObjectPool {
    constructor(type) {
        this.type = type;
        this.objects = new Array();
    }
    update(stage, cam, player, ev) {
        for (let o of this.objects) {
            o.cameraCheck(cam);
            o.update(ev);
            stage.objectCollisions(o, ev);
            if (player != null) {
                o.playerCollision(player, ev);
            }
        }
    }
    draw(c) {
        for (let o of this.objects) {
            o.draw(c);
        }
    }
    nextObject() {
        return nextObject(this.objects, this.type);
    }
    event(cb) {
        for (let o of this.objects) {
            cb(o);
        }
    }
    killAll() {
        for (let o of this.objects) {
            o.forceKill();
        }
    }
    clear() {
        this.objects = new Array();
    }
}
