import { Camera } from "./camera.js";
import { TransitionEffectType } from "./core/transition.js";
import { ObjectManager } from "./objectmanager.js";
import { Stage } from "./stage.js";
import { GameState } from "./state.js";
export class GameScene {
    constructor(param, ev) {
        this.camera = new Camera(0, 144, 160, 144);
        this.stage = new Stage(ev);
        this.state = new GameState();
        this.objects = new ObjectManager(this.state);
        this.stage.parseObjects(this.objects);
        this.objects.setInitialCameraPosition(this.camera);
        this.stage.restrictCamera(this.camera);
        this.objects.initialCameraCheck(this.camera);
        ev.transition.activate(false, TransitionEffectType.CirleIn, 1.0 / 30.0, null);
        this.objects.focusOnPlayer(ev.transition, this.camera);
    }
    update(ev) {
        if (ev.transition.isActive())
            return;
        if (this.objects.isPlayerDead()) {
            ev.transition.activate(true, TransitionEffectType.CirleIn, 1.0 / 30.0, (ev) => {
                this.objects.reset();
                this.stage.parseObjects(this.objects);
                this.objects.setInitialCameraPosition(this.camera);
                this.stage.restrictCamera(this.camera);
                this.objects.initialCameraCheck(this.camera);
            });
            this.objects.focusOnPlayer(ev.transition, this.camera);
            return;
        }
        this.stage.update(this.camera, ev);
        this.objects.update(this.stage, this.camera, ev);
        this.camera.update(ev);
        this.stage.restrictCamera(this.camera);
    }
    genItemString(count, max, icon) {
        let str = String.fromCharCode(icon, icon + 1);
        if (max > 10 && count < 10)
            str += "0";
        str += String(count) + "/" + String(max);
        return str;
    }
    drawHUD(c) {
        let font = c.getBitmap("font");
        c.setFillColor(0, 0, 0, 0.33);
        c.fillRect(0, 0, c.width, 10);
        c.drawText(font, this.genItemString(this.state.getHealth(), this.state.getMaxHealth(), 4), -3, 1, -1);
        c.drawText(font, this.genItemString(this.state.getBulletCount(), this.state.getMaxBulletCount(), 6), c.width / 2 + 4, 1, -1, 0, true);
        let str = String.fromCharCode(8, 2) + String(this.state.getMoney());
        c.drawText(font, str, c.width - str.length * 8 - 2, 1);
    }
    redraw(c) {
        c.moveTo();
        this.stage.drawBackground(c, this.camera);
        this.camera.use(c);
        this.stage.draw(c, this.camera);
        this.objects.draw(c);
        c.moveTo();
        this.drawHUD(c);
    }
    dispose() {
        return null;
    }
}
