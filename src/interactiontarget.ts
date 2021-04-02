import { GameEvent } from "./core/core.js";
import { Vector2 } from "./core/vector.js";
import { WeakGameObject } from "./gameobject.js";
import { Player } from "./player.js";


export class InteractionTarget extends WeakGameObject {


    constructor(x : number, y : number) {

        super(x, y);
    
        this.hitbox = new Vector2(12, 12);
    }


    public playerCollision(pl : Player, ev : GameEvent) : boolean {

        return false;
    }
}
