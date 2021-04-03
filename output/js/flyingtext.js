import { Vector2 } from "./core/vector.js";
import { ExistingObject } from "./gameobject.js";
const FLYING_TEXT_MOVE_TIME = 16;
const FLYING_TEXT_WAIT_TIME = 30;
let shiftString = (str, shift) => {
    if (shift == 0)
        return str;
    let out = "";
    for (let i = 0; i < str.length; ++i) {
        out += String.fromCharCode(str.charCodeAt(i) + shift);
    }
    return out;
};
export class FlyingText extends ExistingObject {
    constructor() {
        super();
        this.pos = new Vector2();
        this.message = "";
        this.moveTimer = 0;
        this.waitTimer = 0;
        this.exist = false;
    }
    update(ev) {
        if (!this.exist)
            return;
        if (this.moveTimer > 0) {
            this.pos.y -= this.speed * ev.step;
            if ((this.moveTimer -= ev.step) <= 0) {
                this.speed = 0;
            }
        }
        else {
            if ((this.waitTimer -= ev.step) <= 0) {
                this.exist = false;
            }
        }
    }
    spawn(value, x, y, speed, shift = 0, icon = -1) {
        this.message = shiftString((value < 0 ? "-" : "+") + String(Math.abs(value)), shift * 16);
        if (icon >= 0) {
            this.message += String.fromCharCode(icon);
        }
        this.waitTimer = FLYING_TEXT_WAIT_TIME;
        this.moveTimer = FLYING_TEXT_MOVE_TIME;
        this.pos = new Vector2(x, y);
        this.speed = speed;
        this.exist = true;
    }
    draw(c) {
        if (!this.exist)
            return;
        c.drawText(c.getBitmap("fontSmall"), this.message, Math.round(this.pos.x), Math.round(this.pos.y - 4), -2, 0, true);
    }
}
