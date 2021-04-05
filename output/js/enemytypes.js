import { Flip } from "./core/canvas.js";
import { clamp } from "./core/mathext.js";
import { Vector2 } from "./core/vector.js";
import { Enemy } from "./enemy.js";
// If I make it a pure array, it will complain that "Slime" used
// before declared
const ENEMY_TYPES = () => [Slime, Bat, Spider, Fly, GuineaPig];
export const getEnemyType = (index) => ENEMY_TYPES()[clamp(index, 0, ENEMY_TYPES().length - 1) | 0];
export class Slime extends Enemy {
    constructor(x, y) {
        super(x, y, 0, 3, 2);
        const BASE_GRAVITY = 2.0;
        this.collisionBox = new Vector2(8, 8);
        this.hitbox = new Vector2(10, 10);
        this.friction.x = 0.05;
        this.center.y = 3;
        this.mass = 0.75;
        this.target.y = BASE_GRAVITY;
        this.jumpTimer = Slime.JUMP_TIME +
            (Math.floor((x / 16) | 0) % 2) * Slime.JUMP_TIME / 2;
    }
    updateAI(ev) {
        const JUMP_HEIGHT = -2.0;
        const MOVE_SPEED = 0.5;
        const ANIM_EPS = 0.5;
        if (this.canJump) {
            this.target.x = 0;
            if ((this.jumpTimer -= ev.step) <= 0) {
                this.speed.y = JUMP_HEIGHT;
                this.jumpTimer += Slime.JUMP_TIME;
                this.speed.x = MOVE_SPEED * this.dir;
                this.target.x = this.speed.x;
                this.flip = this.dir > 0 ? Flip.Horizontal : Flip.None;
            }
        }
        let frame = 0;
        if (this.speed.y < -ANIM_EPS)
            frame = 1;
        else if (this.speed.y > ANIM_EPS)
            frame = 2;
        this.spr.setFrame(frame, this.spr.getRow());
    }
    playerEvent(pl, ev) {
        this.dir = pl.getPos().x > this.pos.x ? 1 : -1;
    }
}
Slime.JUMP_TIME = 60;
export class Bat extends Enemy {
    constructor(x, y) {
        super(x, y, 1, 3, 2);
        this.collisionBox = new Vector2(8, 8);
        this.hitbox = new Vector2(12, 8);
        this.mass = 0.75;
        // For "sleeping" effect
        this.pos.y -= 4;
        this.fallTimer = 0;
        this.awake = false;
        this.moveDir = new Vector2(0, 0);
        this.friction = new Vector2(0.05, 0.05);
    }
    updateAI(ev) {
        const ANIM_SPEED = 6.0;
        const MOVE_SPEED = 0.33;
        if (!this.awake)
            return;
        if (this.fallTimer > 0) {
            this.spr.setFrame(1, this.spr.getRow());
            this.fallTimer -= ev.step;
            return;
        }
        this.spr.animate(this.spr.getRow(), 2, 5, ANIM_SPEED, ev.step);
        this.target = Vector2.scalarMultiply(this.moveDir, MOVE_SPEED);
    }
    playerEvent(pl, ev) {
        const WAKE_UP_DISTANCE = 32;
        const DELTA_Y = 8;
        const FALL_TIME = 30;
        const FALL_SPEED = 1.0;
        let p = pl.getPos();
        if (this.awake) {
            if (this.fallTimer <= 0) {
                this.moveDir = Vector2.direction(this.pos, p);
            }
            return;
        }
        if (this.health < this.maxHealth ||
            (p.y > this.pos.y + DELTA_Y &&
                Math.abs(p.x - this.pos.x) < WAKE_UP_DISTANCE)) {
            this.awake = true;
            this.fallTimer = FALL_TIME;
            this.speed.y = FALL_SPEED;
            this.target.y = this.speed.y;
        }
    }
}
export class Spider extends Enemy {
    constructor(x, y) {
        super(x, y, 2, 3, 2);
        const BASE_GRAVITY = 2.0;
        this.collisionBox = new Vector2(6, 8);
        this.hitbox = new Vector2(12, 8);
        this.friction.x = 0.05;
        this.center.y = 3;
        this.mass = 0.75;
        this.target.y = BASE_GRAVITY;
        this.dir = ((x / 16) | 0) % 2 == 0 ? 1 : -1;
        this.initialSpeedSet = false;
    }
    updateAI(ev) {
        const ANIM_SPEED = 6;
        const MOVE_SPEED = 0.25;
        this.spr.animate(this.spr.getRow(), 0, 3, ANIM_SPEED, ev.step);
        if (!this.isHurt() && !this.canJump && this.oldCanJump) {
            this.dir *= -1;
            this.speed.x *= -1;
        }
        this.target.x = MOVE_SPEED * this.dir;
        if (!this.initialSpeedSet) {
            this.speed.x = this.target.x;
            this.initialSpeedSet = true;
        }
        this.flip = this.dir < 0 ? Flip.None : Flip.Horizontal;
        this.oldCanJump = this.canJump;
    }
    wallCollisionEvent(dir, ev) {
        this.dir = -dir;
        this.speed.x *= -1;
    }
}
export class Fly extends Enemy {
    constructor(x, y) {
        0;
        super(x, y, 3, 2, 2);
        this.collisionBox = new Vector2(8, 8);
        this.hitbox = new Vector2(10, 10);
        this.mass = 0.25;
        this.moveDir = new Vector2(0, 0);
        this.friction = new Vector2(0.010, 0.010);
        this.waitTimer = Fly.WAIT_TIME +
            (Math.floor((x / 16) | 0) % 2) * Fly.WAIT_TIME / 2;
        this.rushing = false;
        this.bounceFactor = 1.0;
        this.waveTimer = 0.0;
    }
    updateAI(ev) {
        const ANIM_SPEED = 3.0;
        const MOVE_SPEED = 1.0;
        const WAVE_SPEED = 0.05;
        const AMPLITUDE = 0.5;
        this.spr.animate(this.spr.getRow(), 0, 3, ANIM_SPEED, ev.step);
        this.target.zeros();
        if (!this.rushing) {
            this.waveTimer += WAVE_SPEED * ev.step;
            this.waveTimer %= Math.PI * 2;
            this.target.y = Math.sin(this.waveTimer) * AMPLITUDE;
        }
        if ((this.waitTimer -= ev.step) <= 0) {
            if (!this.rushing) {
                this.speed = Vector2.scalarMultiply(this.moveDir, MOVE_SPEED);
                this.waitTimer += Fly.RUSH_TIME;
                // this.waveTimer = 0.0;
            }
            else {
                this.waitTimer += Fly.WAIT_TIME;
            }
        }
    }
    playerEvent(pl, ev) {
        this.moveDir = Vector2.direction(this.pos, pl.getPos());
    }
}
Fly.WAIT_TIME = 60;
Fly.RUSH_TIME = 120;
export class GuineaPig extends Enemy {
    constructor(x, y) {
        super(x, y, 4, 4, 2);
        const BASE_GRAVITY = 2.0;
        this.collisionBox = new Vector2(6, 8);
        this.hitbox = new Vector2(12, 10);
        this.friction.x = 0.015;
        this.center.y = 3;
        this.mass = 0.35;
        this.target.y = BASE_GRAVITY;
        this.dir = 0;
    }
    updateAI(ev) {
        const ANIM_SPEED = 5;
        const MOVE_SPEED = 0.5;
        if (this.canJump)
            this.spr.animate(this.spr.getRow(), 0, 3, ANIM_SPEED, ev.step);
        else
            this.spr.setFrame(4, this.spr.getRow());
        this.target.x = MOVE_SPEED * this.dir;
        this.flip = this.dir < 0 ? Flip.None : Flip.Horizontal;
    }
    playerEvent(pl, ev) {
        this.dir = Math.sign(pl.getPos().x - this.pos.x);
    }
}
