import { Flip } from "./core/canvas.js";
import { boxOverlay, CollisionObject } from "./gameobject.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { State } from "./core/types.js";
var ChargeType;
(function (ChargeType) {
    ChargeType[ChargeType["Sword"] = 0] = "Sword";
    ChargeType[ChargeType["Gun"] = 1] = "Gun";
})(ChargeType || (ChargeType = {}));
;
export class Player extends CollisionObject {
    constructor(x, y) {
        super(x, y);
        this.friction = new Vector2(0.1, 0.1);
        this.hitbox = new Vector2(12, 16);
        this.collisionBox = new Vector2(8, 12);
        this.center = new Vector2();
        this.renderOffset = new Vector2(0, -2);
        this.inCamera = true;
        this.canJump = false;
        this.jumpTimer = 0;
        this.jumpMargin = 0;
        this.touchLadder = false;
        this.climbing = false;
        this.climbX = 0;
        this.isLadderTop = false;
        this.canAttack = false;
        this.attacking = false;
        this.chargeAttack = false;
        this.chargeAttackTimer = 0;
        this.sprSword = new Sprite(16, 16);
        this.sprWeaponEffect = new Sprite(32, 32);
        this.shooting = false;
        this.shootTimer = 0;
        this.spr = new Sprite(16, 16);
        this.hurtTimer = 0;
        this.flip = Flip.None;
        this.dir = 1;
        this.downAttacking = false;
        this.downAttackWait = 0;
    }
    die(ev) {
        return true;
    }
    jump(ev) {
        const EPS = 0.1;
        const JUMP_TIME = 15;
        let jumpButtonState = ev.getAction("fire1");
        if (Math.abs(this.target.x) > EPS) {
            this.flip = this.target.x > 0 ? Flip.None : Flip.Horizontal;
            this.dir = Math.sign(this.target.x);
        }
        // Jump
        if (this.jumpMargin > 0 && jumpButtonState == State.Pressed) {
            this.jumpTimer = JUMP_TIME;
            this.jumpMargin = 0;
        }
        else if (this.jumpTimer > 0 && (jumpButtonState & State.DownOrPressed) == 0) {
            this.jumpTimer = 0;
        }
    }
    attack(ev) {
        const EPS = 0.25;
        const SWORD_RUSH = 1.0;
        const DOWN_ATTACK_GRAVITY = 8.0;
        const DOWN_ATTACK_JUMP = -1.5;
        const CHARGE_ATTACK_TIME = 20.0;
        let down = ev.getStick().y > EPS;
        let attackButton = ev.getAction("fire2");
        // Charge attack
        if (this.charging && this.chargeType == ChargeType.Sword) {
            if ((attackButton & State.DownOrPressed) == 0) {
                this.charging = false;
                this.chargeAttack = true;
                this.attacking = true;
                this.chargeAttackTimer = CHARGE_ATTACK_TIME;
                this.sprWeaponEffect.setFrame(0, 0);
                this.stopMovement();
            }
            return;
        }
        // Attack
        if ((this.canAttack || (!this.canJump && down)) &&
            attackButton == State.Pressed) {
            this.stopMovement();
            this.jumpTimer = 0;
            if (!this.climbing && !this.canJump && down) {
                this.downAttacking = true;
                this.downAttackWait = 0;
                this.speed.y = DOWN_ATTACK_JUMP;
                this.target.y = DOWN_ATTACK_GRAVITY;
                return;
            }
            this.attacking = true;
            this.canAttack = false;
            this.charging = false;
            this.shooting = false;
            this.spr.setFrame(0, 2);
            if (this.canJump)
                this.speed.x = SWORD_RUSH * this.dir;
            if (this.climbing) {
                this.flip = this.dir > 0 ? Flip.None : Flip.Horizontal;
            }
        }
    }
    shoot(ev) {
        const SHOOT_TIME = 30;
        let attackButton = ev.getAction("fire3");
        if (!this.shooting &&
            attackButton == State.Pressed) {
            this.shootTimer = SHOOT_TIME;
            this.charging = false;
            this.shooting = true;
            if (this.climbing && this.dir < 0) {
                this.spr.setFrame(this.spr.getColumn() == 3 ? 4 : 3, this.spr.getRow());
            }
        }
    }
    startClimbing(ev) {
        if (!this.climbing &&
            this.touchLadder &&
            (!this.isLadderTop && ev.upPress() ||
                (this.isLadderTop && ev.downPress()))) {
            this.climbing = true;
            this.charging = false;
            this.shooting = false;
            this.pos.x = this.climbX;
            if (this.isLadderTop) {
                this.pos.y += 6;
            }
            this.stopMovement();
            this.jumpTimer = 0;
        }
    }
    climb(ev) {
        const EPS = 0.1;
        const CLIMB_SPEED = 0.5;
        const CLIB_JUMP_TIME = 15;
        this.canAttack = true;
        let jumpButtonState = ev.getAction("fire1");
        if (Math.abs(ev.getStick().x) > EPS)
            this.dir = Math.sign(ev.getStick().x);
        if (!this.touchLadder) {
            this.climbing = false;
        }
        else {
            this.target.y = CLIMB_SPEED * ev.getStick().y;
            if (jumpButtonState == State.Pressed) {
                this.climbing = false;
                if (ev.getStick().y < EPS) {
                    this.jumpTimer = CLIB_JUMP_TIME;
                }
            }
        }
    }
    control(ev) {
        const BASE_GRAVITY = 4.0;
        const BASE_SPEED = 1.0;
        if (this.chargeAttack)
            return;
        this.friction.y = 0.1;
        if (this.downAttacking)
            this.friction.y = 0.25;
        if (this.attacking || this.downAttacking)
            return;
        this.startClimbing(ev);
        if (this.climbing) {
            this.climb(ev);
        }
        else {
            this.target.x = ev.getStick().x * BASE_SPEED;
            this.target.y = BASE_GRAVITY;
            this.jump(ev);
        }
        this.shoot(ev);
        this.attack(ev);
    }
    stopAttackAnimation() {
        this.attacking = false;
        if (this.climbing) {
            this.spr.setFrame(3, 1);
        }
    }
    animateAttack(ev) {
        const SWORD_SPEED = 4;
        const SWORD_RELEASE_TIME = 8;
        const SWORD_WAIT_TIME = 20;
        const EFFECT_SPEED = 4;
        if (this.downAttacking) {
            this.spr.setFrame(3, 2);
            this.sprSword.setFrame(3, 0);
            return true;
        }
        if (this.attacking) {
            if (this.chargeAttack) {
                this.spr.setFrame(1, 2);
                this.sprSword.setFrame(4, 0);
                this.sprWeaponEffect.animate(0, 0, 1, EFFECT_SPEED, ev.step);
                return true;
            }
            this.spr.animate(2, 0, 3, this.spr.getColumn() == 2 ? SWORD_WAIT_TIME : SWORD_SPEED, ev.step);
            if (this.spr.getColumn() == 2 &&
                this.spr.getTimer() >= SWORD_RELEASE_TIME &&
                (ev.getAction("fire2") & State.DownOrPressed) == 0) {
                this.stopAttackAnimation();
            }
            else if (this.spr.getColumn() < 3) {
                this.sprSword.setFrame(this.spr.getColumn(), 0);
                return true;
            }
            else {
                this.stopAttackAnimation();
                if (!this.climbing) {
                    this.charging = true;
                    this.chargeTimer = 0;
                    this.chargeType = ChargeType.Sword;
                }
            }
        }
        return false;
    }
    animate(ev) {
        const EPS = 0.01;
        const JUMP_EPS = 0.5;
        const BASE_SPEED = 12;
        const CLIMB_SPEED = 10;
        const SPEED_MOD = 6;
        let frame;
        let speed;
        // TODO: Split to multiple methods
        if (this.animateAttack(ev))
            return;
        if (this.climbing) {
            if (!this.shooting || this.dir > 0)
                this.flip = Flip.None;
            else
                this.flip = Flip.Horizontal;
            if (Math.abs(this.speed.y) > EPS) {
                this.spr.animate(1, 3, 4, CLIMB_SPEED, ev.step);
            }
            return;
        }
        if (this.canJump) {
            if (Math.abs(this.speed.x) < EPS) {
                this.spr.setFrame(0, 0);
            }
            else {
                speed = BASE_SPEED - Math.abs(this.speed.x) * SPEED_MOD;
                this.spr.animate(0, 1, 4, speed, ev.step);
            }
        }
        else {
            frame = 1;
            if (this.speed.y < -JUMP_EPS)
                frame = 0;
            else if (this.speed.y > JUMP_EPS)
                frame = 2;
            this.spr.setFrame(frame, 1);
        }
    }
    updateTimers(ev) {
        const JUMP_SPEED = -2.0;
        const CHARGE_TIME_MAX = 8;
        const CHARGE_SPEED = 1.5;
        if (this.hurtTimer > 0) {
            this.hurtTimer -= ev.step;
        }
        if (this.jumpMargin > 0) {
            this.jumpMargin -= ev.step;
        }
        if (this.jumpTimer > 0) {
            this.jumpTimer -= ev.step;
            this.speed.y = JUMP_SPEED;
        }
        if (this.downAttackWait > 0) {
            if ((this.downAttackWait -= ev.step) <= 0) {
                this.downAttacking = false;
            }
        }
        if (this.charging) {
            this.chargeTimer = (this.chargeTimer + ev.step) % CHARGE_TIME_MAX;
        }
        if (this.chargeAttack) {
            this.speed.x = this.dir * CHARGE_SPEED;
            if ((this.chargeAttackTimer -= ev.step) <= 0) {
                this.chargeAttack = false;
                this.attacking = false;
            }
        }
        if (this.shooting) {
            if ((this.shootTimer -= ev.step) <= 0) {
                this.shooting = false;
                if (this.climbing && this.dir < 0) {
                    this.spr.setFrame(this.spr.getColumn() == 3 ? 4 : 3, this.spr.getRow());
                }
            }
        }
    }
    updateLogic(ev) {
        this.control(ev);
        this.animate(ev);
        this.updateTimers(ev);
        this.canJump = false;
        this.touchLadder = false;
        this.isLadderTop = false;
    }
    drawSwordEffect(c) {
        let bmp = c.getBitmap("weaponEffect");
        let px = Math.floor(this.pos.x) + this.renderOffset.x;
        let py = Math.floor(this.pos.y) + 1 + this.renderOffset.y;
        c.drawSprite(this.sprWeaponEffect, bmp, px - 16 + 8 * this.dir, py - 16, this.flip);
    }
    drawSword(c) {
        const X_OFFSET = [12, 14, 12, 3, 14];
        const Y_OFFSET = [-6, 1, 6, 7, 1];
        let bmp = c.getBitmap("weapons");
        let dir = this.dir;
        let px = Math.floor(this.pos.x) + this.renderOffset.x;
        let py = Math.floor(this.pos.y) + 1 + this.renderOffset.y;
        px += X_OFFSET[this.sprSword.getColumn()] * dir;
        py += Y_OFFSET[this.sprSword.getColumn()];
        c.drawSprite(this.sprSword, bmp, px - this.spr.width / 2, py - this.spr.height / 2, this.flip);
    }
    drawGun(c) {
        let bmp = c.getBitmap("weapons");
        let px = Math.floor(this.pos.x) + this.renderOffset.x;
        let py = Math.floor(this.pos.y) + 1 + this.renderOffset.y;
        if (this.climbing)
            --py;
        let jump = this.flip == Flip.None ? 0 : 1;
        c.drawSpriteFrame(this.sprSword, bmp, 0, 1, px + 2 - 20 * jump, py - 7, this.flip);
    }
    draw(c) {
        let bmpName = (this.charging &&
            Math.floor(this.chargeTimer / 4) % 2 == 0) ?
            "playerWhite" : "player";
        let bmp = c.getBitmap(bmpName);
        let px = Math.floor(this.pos.x) + this.renderOffset.x;
        let py = Math.floor(this.pos.y) + 1 + this.renderOffset.y;
        let frame = this.spr.getColumn();
        if (this.shooting) {
            frame += 5;
        }
        if (this.attacking && this.chargeAttack) {
            this.drawSwordEffect(c);
        }
        if (this.shooting) {
            this.drawGun(c);
        }
        c.drawSpriteFrame(this.spr, bmp, frame, this.spr.getRow(), px - this.spr.width / 2, py - this.spr.height / 2, this.flip);
        if (this.attacking || this.downAttacking)
            this.drawSword(c);
    }
    setPosition(x, y) {
        this.pos = new Vector2(x, y);
    }
    hurt(ev) {
        const HURT_TIME = 60;
        if (this.dying || this.hurtTimer > 0)
            return;
        this.hurtTimer = HURT_TIME;
    }
    verticalCollisionEvent(dir, ev) {
        const JUMP_MARGIN = 12;
        const DOWN_ATTACK_WAIT = 30;
        if (dir > 0) {
            if (this.downAttacking &&
                this.downAttackWait <= 0) {
                this.downAttackWait = DOWN_ATTACK_WAIT;
            }
            this.climbing = false;
            this.canJump = true;
            this.jumpMargin = JUMP_MARGIN;
            this.canAttack = true;
        }
    }
    ladderCollision(x, y, w, h, ladderTop, ev) {
        if (boxOverlay(this.pos, this.center, this.collisionBox, x, y, w, h)) {
            this.climbX = x + w / 2;
            this.touchLadder = !ladderTop || !this.climbing;
            this.isLadderTop = this.isLadderTop || ladderTop;
            return true;
        }
        return false;
    }
}
