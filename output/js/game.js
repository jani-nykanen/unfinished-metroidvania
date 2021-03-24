import { Camera } from "./camera.js";
import { ObjectManager } from "./objectmanager.js";
import { Stage } from "./stage.js";
export class GameScene {
    constructor(param, ev) {
        this.camera = new Camera(0, 144, 160, 144);
        this.stage = new Stage(ev);
        this.objects = new ObjectManager();
    }
    update(ev) {
        this.stage.update(ev);
        this.objects.update(this.stage, this.camera, ev);
        this.stage.restrictCamera(this.camera);
    }
    redraw(c) {
        c.moveTo();
        this.stage.drawBackground(c, this.camera);
        this.camera.use(c);
        this.stage.draw(c, this.camera);
        this.objects.draw(c);
        c.drawText(c.getBitmap("font"), "Hello world!", 2, 2, 0, 0);
    }
    dispose() {
        return null;
    }
}
