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
        this.waitTimer = 0;
    }
    followObject(o, ev) {
        const MAX_WAIT_TIME = 120;
        const WAIT_DELTA = 0.5;
        const EPS = 0.1;
        const FORWARD = 16;
        const MOVE_SPEED_X = 0.5;
        const VERTICAL_DEADZONE = 16;
        let px = Math.floor(o.getPos().x);
        let py = Math.floor(o.getPos().y);
        this.pos.x = px;
        let d = this.pos.y - py;
        if (Math.abs(d) >= VERTICAL_DEADZONE) {
            this.pos.y = py + VERTICAL_DEADZONE * Math.sign(d);
        }
        let target = o.getFacingDirection() * FORWARD;
        if (Math.abs(target) > EPS) {
            if (Math.sign(target) != Math.sign(this.centerOffTarget.x)) {
                this.waitTimer = 0;
            }
            else {
                this.waitTimer = Math.min(this.waitTimer + WAIT_DELTA * Math.abs(ev.getStick().x) * ev.step, MAX_WAIT_TIME);
            }
            this.centerOffTarget.x = Math.round(target);
        }
        else {
            if (this.waitTimer > 0.0) {
                this.waitTimer -= ev.step;
            }
            if (this.waitTimer <= 0)
                this.centerOffTarget.x = 0;
        }
        this.centerOff.x = updateSpeedAxis(this.centerOff.x, this.centerOffTarget.x, MOVE_SPEED_X * ev.step);
    }
    forceCenterOffsetJump(jumpx, jumpy) {
        this.centerOff.x += jumpx;
        this.centerOff.y += jumpy;
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
        c.moveTo(Math.floor(-this.pos.x - this.centerOff.x + this.width / 2), Math.floor(-this.pos.y - this.centerOff.y + this.height / 2));
    }
    setPosition(pos) {
        this.pos = pos.clone();
    }
}
