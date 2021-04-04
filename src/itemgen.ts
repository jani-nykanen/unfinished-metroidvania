import { Collectible } from "./collectible.js";
import { ObjectPool } from "./objectpool.js";
import { GameState } from "./state.js";


export class CollectibleItemGenerator extends ObjectPool<Collectible> {


    private readonly state : GameState;


    constructor(state : GameState) {

        super(Collectible);

        this.state = state;
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, forceId = -1) {

        const HEALTH_PROB = 0.25;
        const AMMO_PROB = 0.50;

        let healthFactor : number;
        let ammoFactor : number;

        let id = 0;
        if (forceId >= 0) {

            id = forceId;
        }
        else {

            healthFactor = (1.0 - this.state.getHealth() / this.state.getMaxHealth());
            ammoFactor = (1.0 - this.state.getBulletCount() / this.state.getMaxBulletCount());

            if (Math.random() <= HEALTH_PROB * healthFactor)
                id = 1;
            else if (Math.random() <= AMMO_PROB * ammoFactor)
                id = 2;
        }

        this.nextObject().spawn(id, x, y, speedx, speedy);
    }
}
