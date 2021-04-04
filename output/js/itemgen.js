import { Collectible } from "./collectible.js";
import { ObjectPool } from "./objectpool.js";
export class CollectibleItemGenerator extends ObjectPool {
    constructor(state) {
        super(Collectible);
        this.state = state;
    }
    spawn(x, y, speedx, speedy, forceId = -1) {
        const HEALTH_PROB = 0.25;
        let healthFactor;
        let id = 0;
        if (forceId >= 0) {
            id = forceId;
        }
        else {
            healthFactor = (1.0 - this.state.getHealth() / this.state.getMaxHealth());
            if (Math.random() <= HEALTH_PROB * healthFactor)
                id = 1;
            // TODO: Ammo
        }
        this.nextObject().spawn(id, x, y, speedx, speedy);
    }
}
