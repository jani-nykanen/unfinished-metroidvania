import { Player } from "./player.js";
export class ObjectManager {
    constructor() {
        this.player = new Player(80, 144 - 40);
    }
    update(stage, camera, ev) {
        this.player.update(ev);
        stage.objectCollisions(this.player, ev);
        camera.followObject(this.player, ev);
    }
    draw(c) {
        this.player.draw(c);
    }
}
