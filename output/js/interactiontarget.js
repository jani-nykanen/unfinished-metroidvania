import { Vector2 } from "./core/vector.js";
import { WeakGameObject } from "./gameobject.js";
export class InteractionTarget extends WeakGameObject {
    constructor(x, y) {
        super(x, y);
        this.hitbox = new Vector2(12, 12);
    }
    playerCollision(pl, ev) {
        return false;
    }
}
