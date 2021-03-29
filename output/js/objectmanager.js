import { ObjectPool } from "./objectpool.js";
import { Player } from "./player.js";
import { Projectile } from "./projectile.js";
export class ObjectManager {
    constructor(state) {
        this.projectiles = new ObjectPool(Projectile);
        this.player = new Player(80, 144 - 40, this.projectiles, state);
    }
    update(stage, camera, ev) {
        this.player.update(ev);
        stage.objectCollisions(this.player, ev);
        camera.followObject(this.player, ev);
        this.projectiles.update(stage, camera, ev);
    }
    draw(c) {
        this.player.preDraw(c);
        this.projectiles.draw(c);
        this.player.draw(c);
    }
    setPlayerLocation(x, y) {
        this.player.setPosition(x * 16 + 8, y * 16 + 8);
    }
    setInitialCameraPosition(cam) {
        cam.setPosition(this.player.getPos());
    }
}
