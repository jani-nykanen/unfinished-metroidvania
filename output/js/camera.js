import { Vector2 } from "./core/vector.js";
import { updateSpeedAxis } from "./gameobject.js";
export class Camera {
    constructor(x, y, width, height) {
        this.getPos = () => this.pos.clone();
        this.getTopLeftCorner = () => new Vector2(this.pos.x + this.centerOff.x - this.width / 2, this.pos.y + this.centerOff.y - this.height / 2);
        this.pos = new Vector2(x + width / 2, y + height / 2);
        this.width = width;
        this.height = height;
        this.centerOff = new Vector2();
        this.centerOffTarget = new Vector2();
    }
    followObject(o, ev) {
        const EPS = 0.1;
        const FORWARD = 32;
        const MOVE_SPEED_X = 0.5;
        const VERTICAL_DEADZONE = 16;
        this.pos.x = o.getPos().x;
        let d = this.pos.y - o.getPos().y;
        if (Math.abs(d) >= VERTICAL_DEADZONE) {
            this.pos.y = o.getPos().y + VERTICAL_DEADZONE * Math.sign(d);
        }
        let target = o.getTarget().x;
        let dir = 0;
        if (Math.abs(target) > EPS) {
            dir = Math.sign(target);
        }
        else if (Math.abs(o.getSpeed().x) < EPS) {
            dir = 0;
        }
        this.centerOffTarget.x = dir * FORWARD;
        this.centerOff.x = updateSpeedAxis(this.centerOff.x, this.centerOffTarget.x, MOVE_SPEED_X * ev.step);
    }
    restrictCamera(x, y, w, h) {
        // Left
        let px = this.pos.x + this.centerOff.x;
        if (px < x + this.width / 2) {
            if (this.centerOff.x < 0) {
                this.centerOff.x += (x + this.width / 2 - px);
            }
            if (this.centerOff.x >= 0) {
                this.centerOff.x = 0;
                this.pos.x = x + this.width / 2;
            }
        }
        // Right
        px = this.pos.x + this.centerOff.x;
        if (px > x + w - this.width / 2) {
            if (this.centerOff.x > 0) {
                this.centerOff.x -= (px - (x + w - this.width / 2));
            }
            if (this.centerOff.x <= 0) {
                this.centerOff.x = 0;
                this.pos.x = x + w - this.width / 2;
            }
        }
        // Top
        if (this.pos.y < y + this.height / 2) {
            this.pos.y = y + this.height / 2;
        }
        // Bottom
        if (this.pos.y > (y + h) - this.height / 2) {
            this.pos.y = (y + h) - this.height / 2;
        }
    }
    use(c) {
        c.moveTo(Math.round(-this.pos.x - this.centerOff.x + this.width / 2), Math.round(-this.pos.y - this.centerOff.y + this.height / 2));
    }
}
