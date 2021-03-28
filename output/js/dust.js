import { ExistingObject } from "./gameobject.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
export class Dust extends ExistingObject {
    constructor() {
        super();
        this.exist = false;
    }
    spawn(x, y, speed, id = 0) {
        this.pos = new Vector2(x, y);
        this.spr = new Sprite(16, 16);
        this.speed = speed;
        this.id = id;
        this.exist = true;
    }
    update(ev) {
        if (!this.exist)
            return;
        this.spr.animate(this.id, 0, 4, this.speed, ev.step);
        if (this.spr.getColumn() == 4) {
            this.exist = false;
        }
    }
    draw(c) {
        if (!this.exist)
            return;
        let bmp = c.getBitmap("dust");
        let px = Math.round(this.pos.x) - this.spr.width / 2;
        let py = Math.round(this.pos.y) - this.spr.height / 2;
        c.drawSprite(this.spr, bmp, px, py);
    }
}
