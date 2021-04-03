import { CollisionObject, WeakGameObject } from "./gameobject.js";
export class InteractionTarget extends WeakGameObject {
    constructor(x, y) {
        super(x, y);
    }
    playerCollision(pl, ev) {
        return false;
    }
}
export class InteractionTargetWithCollisions extends CollisionObject {
    constructor(x, y) {
        super(x, y);
    }
    playerCollision(pl, flyingText, ev) {
        return false;
    }
}
