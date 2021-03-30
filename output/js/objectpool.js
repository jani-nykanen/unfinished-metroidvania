import { nextObject } from "./gameobject.js";
export class ObjectPool {
    constructor(type) {
        this.type = type;
        this.objects = new Array();
    }
    update(stage, cam, ev) {
        for (let o of this.objects) {
            o.cameraCheck(cam);
            o.update(ev);
            stage.objectCollisions(o, ev);
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
}
