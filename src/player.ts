import { Canvas, Flip } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { boxOverlay, boxOverlayRect, CollisionObject, nextObject } from "./gameobject.js";
import { Sprite } from "./core/sprite.js";
import { Rect, Vector2 } from "./core/vector.js";
import { State } from "./core/types.js";
import { ObjectPool } from "./objectpool.js";
import { Projectile } from "./projectile.js";
import { GameState } from "./state.js";
import { Dust } from "./dust.js";
import { Camera } from "./camera.js";

enum ChargeType {
    Sword = 0,
    Gun = 1
};


export class Player extends CollisionObject {

    private checkpoint : Vector2;

    private renderOffset : Vector2;

    private jumpTimer : number;
    private jumpMargin : number;
    private canJump : boolean;
    private downAttackJumpMargin : number;

    private boostJump : boolean;
    private dust : Array<Dust>;
    private dustTimer : number;

    private climbing : boolean;
    private touchLadder : boolean;
    private isLadderTop : boolean;
    private climbX : number;

    private canAttack : boolean;
    private attacking : boolean;
    private chargeAttack : boolean;
    private chargeAttackTimer : number;
    private swordHitbox : Rect;
    private swordHitId : number;

    private sprWeapon : Sprite;
    private sprWeaponEffect : Sprite;

    private shooting : boolean;
    private bulletId : number;

    private downAttacking : boolean;
    private downAttackWait : number;

    private charging : boolean;
    private chargeType : ChargeType;
    private chargeTimer : number;

    private hurtTimer : number;
    private knockbackTimer : number;

    private flip : Flip;
    private dir : number;

    private cameraJumpDelta : number;

    private deathTimer : number;

    private readonly projectiles : ObjectPool<Projectile>;
    private readonly state : GameState;


    constructor(x : number, y : number, 
        projectiles : ObjectPool<Projectile>,
        state : GameState) {

        super(x, y);

        this.checkpoint = null;

        this.friction = new Vector2(0.1, 0.1);
        this.hitbox = new Vector2(8, 12);
        this.collisionBox = new Vector2(8, 12);
        this.center = new Vector2(0, 2);
        this.renderOffset = new Vector2();

        this.dust = new Array<Dust> ();

        this.sprWeapon = new Sprite(16, 16);
        this.sprWeaponEffect = new Sprite(32, 32);
        this.spr = new Sprite(16, 16);

        this.projectiles = projectiles;
        this.state = state;

        this.resetProperties();
    }


    private resetProperties() {

        this.inCamera = true;

        this.canJump = false;
        this.jumpTimer = 0;
        this.jumpMargin = 0;
        this.downAttackJumpMargin = 0;

        this.boostJump = false;
        this.dustTimer = 0;

        this.touchLadder = false;
        this.climbing = false;
        this.climbX = 0;
        this.isLadderTop = false;

        this.canAttack = false;
        this.attacking = false;
        this.chargeAttack = false;
        this.chargeAttackTimer = 0;
        this.swordHitbox = new Rect();
        this.swordHitId = 0;

        this.spr.setFrame(3, 3);

        this.shooting = false;
        this.bulletId = 0;

        this.hurtTimer = 0;
        this.knockbackTimer = 0;
      
        this.flip = Flip.None;
        this.dir = 1;

        this.cameraJumpDelta = 0;
    
        this.downAttacking = false;
        this.downAttackWait = 0;

        this.deathTimer = 0;
        this.dying = false;
        this.exist = true;
    }


    // Why do I even call them flags?
    private resetFlags() {

        this.jumpTimer = 0;
        this.climbing = false;
        this.downAttacking = false;
        this.attacking = false;
        this.shooting = false;
        this.chargeAttack = false;
        this.charging = false;
    }


    protected die(ev : GameEvent) {

        const MAX_DEATH_TIME = 120;
        const FLICKER_SPEED = 3;

        this.spr.animate(4, 0, 2, FLICKER_SPEED, ev.step);

        return (this.deathTimer += ev.step) >= MAX_DEATH_TIME;
    }


    private jump(ev : GameEvent) {

        const JUMP_TIME = 15;
        const BOOST_TIME = 60;
        const DOWN_ATTACK_JUMP_BONUS = 8;

        let jumpButtonState = ev.getAction("fire1");

        if (this.downAttackJumpMargin > 0 && 
            (jumpButtonState & State.DownOrPressed) == 1) {

            this.jumpTimer = this.downAttackJumpMargin + DOWN_ATTACK_JUMP_BONUS;
            this.downAttackJumpMargin = 0;
            this.jumpMargin = 0;
        }
        else if ( (this.jumpMargin > 0 || !this.boostJump) && 
            jumpButtonState == State.Pressed) {

            if (this.jumpMargin <= 0) {

                this.jumpTimer =  BOOST_TIME;
                this.boostJump = true;
                this.canAttack = true;
            }
            else {

                this.jumpTimer =  JUMP_TIME;
                this.jumpMargin = 0;
            }
        }
        else if (this.jumpTimer > 0 && (jumpButtonState & State.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }
    }


    private attack(ev : GameEvent) {

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
                this.jumpTimer = 0;
                this.chargeAttackTimer = CHARGE_ATTACK_TIME;

                this.sprWeaponEffect.setFrame(0, 0);

                this.stopMovement();

                ++ this.swordHitId;
            }
            return;
        }

        // Attack
        if ((this.canAttack || (!this.canJump && down)) &&
            attackButton == State.Pressed) {
            
            ++ this.swordHitId;

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


    private shootBullet(id : number, reduceAmmo : number, ev : GameEvent) {

        const BULLET_SPEED = 4;
        const FORWARD_OFF = 6;

        let dmg = this.state.computeBaseProjectileDamage();
        if (this.charging) {
            
            dmg += 2;
        }

        this.charging = false;
        this.shooting = true;

        if (this.climbing && this.dir < 0) {

            this.spr.setFrame(this.spr.getColumn() == 3 ? 4 : 3, 
                this.spr.getRow());
        }
        this.sprWeapon.setFrame(0, 1);

        this.projectiles.nextObject().spawn(
            this.pos.x + FORWARD_OFF * this.dir, 
            this.pos.y, 
            this.dir * BULLET_SPEED, 0, id, dmg, true,
            ++ this.bulletId)
            .setInitialOldPos(this.pos.clone());
        
        this.state.addAmmo(-reduceAmmo);
    }


    private shoot(ev : GameEvent) {

        let attackButton = ev.getAction("fire3");

        // Charge attack bullet
        // Charge attack
        if (this.charging && this.chargeType == ChargeType.Gun) {

            if ((attackButton & State.DownOrPressed) == 0) {

                this.shootBullet(1, 2, ev);
                this.charging = false;
            }
            return;
        }

        // Normal bullet
        if (this.state.getBulletCount() > 0 &&
            (!this.shooting || (this.sprWeapon.getRow() == 1 && this.sprWeapon.getColumn() == 3)) &&
            attackButton == State.Pressed) {

            this.shootBullet(0, 1, ev);
        }
    }


    private startClimbing(ev : GameEvent) {

        if (!this.climbing &&
            this.touchLadder && 
            (!this.isLadderTop && ev.upPress() || 
            (this.isLadderTop && ev.downPress()))) {

            this.climbing = true;
            this.charging = false;
            this.shooting = false;

            this.cameraJumpDelta = this.climbX - this.pos.x;

            this.pos.x = this.climbX;

            if (this.isLadderTop) {

                this.pos.y += 6;
            }
            this.stopMovement();
            this.jumpTimer = 0;
        }
    }


    private climb(ev : GameEvent) {

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

                    this.jumpTimer =  CLIB_JUMP_TIME;
                }
            }
        }
    }

    
    private control(ev : GameEvent) {

        const EPS = 0.1;
        const BASE_GRAVITY = 4.0;
        const BASE_SPEED = 1.0;

        if (this.knockbackTimer > 0) {

            this.target.x = 0;
            this.target.y = BASE_GRAVITY;
            return;
        }

        if (this.chargeAttack) return;

        this.friction.y = 0.1;
        if (this.downAttacking)
            this.friction.y = 0.25;

        if (this.attacking || this.downAttacking) return;

        this.startClimbing(ev);
        
        if (this.climbing) {

            this.climb(ev);
        }
        else {

            this.target.x = ev.getStick().x * BASE_SPEED;
            this.target.y = BASE_GRAVITY;

            if (Math.abs(this.target.x) > EPS) {

                this.flip = this.target.x > 0 ? Flip.None : Flip.Horizontal;
                this.dir = Math.sign(this.target.x);
            }

            this.jump(ev);
        }

        this.shoot(ev);
        this.attack(ev);
    }


    private stopAttackAnimation() {

        this.attacking = false;
        if (this.climbing) {

            this.spr.setFrame(3, 1);
        }
    }


    private animateAttack(ev : GameEvent) : boolean {

        const SWORD_SPEED = 4;
        const SWORD_RELEASE_TIME = 8;
        const SWORD_WAIT_TIME = 20;
        const EFFECT_SPEED = 4;

        if (this.downAttacking) {

            this.spr.setFrame(3, 2);
            this.sprWeapon.setFrame(3, 0);
            
            return true;
        }

        if (this.attacking) {

            if (this.chargeAttack) {

                this.spr.setFrame(1, 2);
                this.sprWeapon.setFrame(4, 0);
                this.sprWeaponEffect.animate(0, 0, 1, EFFECT_SPEED, ev.step);

                return true;
            }

            this.spr.animate(2, 0, 3, 
                this.spr.getColumn() == 2 ? SWORD_WAIT_TIME : SWORD_SPEED, 
                ev.step);

            if (this.spr.getColumn() == 2 && 
                this.spr.getTimer() >= SWORD_RELEASE_TIME &&
                (ev.getAction("fire2") & State.DownOrPressed) == 0) {

                this.stopAttackAnimation();
            }
            else if (this.spr.getColumn() < 3) {
                
                this.sprWeapon.setFrame(this.spr.getColumn(), 0);
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


    private animateShooting(ev: GameEvent) {

        const BASE_SPEED = 4;
        const FINAL_FRAME_MIN_WAIT = 8;
        const FINAL_FRAME_MAX_WAIT = 24;
        
        this.sprWeapon.animate(1, 0, 4, 
            this.sprWeapon.getColumn() == 3 ? FINAL_FRAME_MAX_WAIT : BASE_SPEED, 
            ev.step);

        if (this.sprWeapon.getColumn() == 4 ||
            (this.sprWeapon.getColumn() == 3 && 
            this.sprWeapon.getTimer() >= FINAL_FRAME_MIN_WAIT &&
            (ev.getAction("fire3") & State.DownOrPressed) == 0)) {

            this.shooting = false;
            if (this.climbing && this.dir < 0) {

                this.spr.setFrame(this.spr.getColumn() == 3 ? 4 : 3, 
                    this.spr.getRow());
            }

            if (this.sprWeapon.getColumn() == 4) {

                this.charging = true;
                this.chargeTimer = 0;
                this.chargeType = ChargeType.Gun;
            }
        }
    }


    private animateJump(ev : GameEvent) {

        const JUMP_EPS = 0.5;

        let row = (this.jumpTimer > 0 && this.boostJump) ? 3 : 1;
        let frame = 1;
        if (this.speed.y < -JUMP_EPS)
            frame = 0;
        else if (this.speed.y > JUMP_EPS)
            frame = 2;

        this.spr.setFrame(frame, row);
    }


    private animate(ev : GameEvent) {

        const EPS = 0.01;
        const BASE_SPEED = 12;
        const CLIMB_SPEED = 10;
        const SPEED_MOD = 6;

        let speed : number;

        if (this.knockbackTimer > 0) {

            this.spr.setFrame(4, 2);
            return;
        }

        // TODO: Split to multiple methods

        if (this.shooting) {

            this.animateShooting(ev);
        }
        else if (this.animateAttack(ev))
            return;

        // Climbing
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

        // Walking & jumping
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

            this.animateJump(ev);
        }
    }


    private updateTimers(ev : GameEvent) {

        const JUMP_SPEED = -2.0;
        const BOOST_SPEED = 0.175;
        const BOOST_CAP = -1.5;
        const CHARGE_TIME_MAX = 8;
        const CHARGE_SPEED = 1.5;

        if (this.knockbackTimer > 0) {

            if ((this.knockbackTimer -= ev.step) <= 0 &&
                this.state.getHealth() <= 0) {

                this.dying = true;
                this.deathTimer = 0;
                return;
            }

        }
        else if (this.hurtTimer > 0) {

            this.hurtTimer -= ev.step;
        }

        if (this.jumpMargin > 0) {

            this.jumpMargin -= ev.step;
        }
        
        if (this.jumpTimer > 0 || this.downAttackJumpMargin > 0) {

            if (this.jumpTimer > 0)
                this.jumpTimer -= ev.step;
            if (this.downAttackJumpMargin > 0)
                this.downAttackJumpMargin -= ev.step;

            if (this.boostJump) {

                this.speed.y = Math.max(BOOST_CAP, this.speed.y - BOOST_SPEED * ev.step);
            }
            else {
            
                this.speed.y = JUMP_SPEED;
            }
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
    }


    private updateDust(ev : GameEvent) {

        const DUST_TIME = 6;
        const DUST_SPEED = 8;
        const DUST_OFFSET = 2;

        for (let d of this.dust) {

            d.update(ev);
        }

        if (this.jumpTimer <= 0 || !this.boostJump) {

            this.dustTimer = 0;
            return;
        }            

        if ((this.dustTimer += ev.step) >= DUST_TIME) {

            nextObject<Dust>(this.dust, Dust)   
                .spawn(this.pos.x - Math.sign(this.speed.x) * DUST_OFFSET, 
                    this.pos.y + 6, DUST_SPEED);

            this.dustTimer -= DUST_TIME;
        }
    }


    private computeSwordHitbox() {

        const X_OFFSET = 14;
        const Y_OFFSET = 0;
        const WIDTH = 12;
        const HEIGHT = 16;
        const CHARGE_WIDTH = 16;
        const CHARGE_HEIGHT = 20;
        const DOWN_ATTACK_XOFF = 2;
        const DOWN_ATTACK_YOFF = 10;
        const DOWN_ATTACK_WIDTH = 10;
        const DOWN_ATTACK_HEIGHT = 12;

        if (this.attacking) {

            this.swordHitbox.x = this.pos.x + X_OFFSET * this.dir;
            this.swordHitbox.y = this.pos.y + Y_OFFSET;

            this.swordHitbox.w = this.chargeAttack ? CHARGE_WIDTH : WIDTH;
            this.swordHitbox.h = this.chargeAttack ? CHARGE_HEIGHT : HEIGHT;
        }
        else if (this.downAttacking) {

            this.swordHitbox.x = this.pos.x + DOWN_ATTACK_XOFF * this.dir;
            this.swordHitbox.y = this.pos.y + DOWN_ATTACK_YOFF;

            this.swordHitbox.w = DOWN_ATTACK_WIDTH;
            this.swordHitbox.h = DOWN_ATTACK_HEIGHT;
        }
    }


    private computeFacingDirection(ev : GameEvent) {

        const EPS = 0.1;

        this.facingDir = ev.getStick().x;
    
        if (this.canJump && Math.abs(this.facingDir) < EPS) {

            if (this.attacking || this.shooting)
                this.facingDir = 0.5 * this.dir;
        }
    }


    protected updateLogic(ev : GameEvent) {

        this.control(ev);
        this.animate(ev);
        this.updateTimers(ev);
        this.updateDust(ev);
        this.computeSwordHitbox();
        this.computeFacingDirection(ev);

        this.canJump = false;
        this.touchLadder = false;
        this.isLadderTop = false;
    }


    private drawSwordEffect(c : Canvas) {

        let bmp = c.getBitmap("weaponEffect");

        let px = Math.floor(this.pos.x) + this.renderOffset.x;
        let py = Math.floor(this.pos.y) + 1 + this.renderOffset.y;

        c.drawSprite(this.sprWeaponEffect, bmp, 
            px - 16 + 8 * this.dir, 
            py - 16, 
            this.flip);
        
    }


    private drawSword(c : Canvas) {

        const X_OFFSET = [12, 14, 12, 3, 14];
        const Y_OFFSET = [-6, 1, 6, 7, 1];

        let bmp = c.getBitmap("weapons");
        
        let dir = this.dir;

        let px = Math.floor(this.pos.x) + this.renderOffset.x;
        let py = Math.floor(this.pos.y) + 1 + this.renderOffset.y;

        px += X_OFFSET[this.sprWeapon.getColumn()] * dir;
        py += Y_OFFSET[this.sprWeapon.getColumn()];

        c.drawSprite(this.sprWeapon, bmp, 
            px - this.spr.width/2, 
            py - this.spr.height/2, 
            this.flip);
    }


    private drawGun(c : Canvas) {

        let bmp = c.getBitmap("weapons");

        let px = Math.floor(this.pos.x) + this.renderOffset.x;
        let py = Math.floor(this.pos.y) + 1 + this.renderOffset.y;

        if (this.climbing)
            -- py;

        let jump = this.flip == Flip.None ? 0 : 1;

        c.drawSprite(this.sprWeapon, bmp, 
            px + 2 - 20 * jump, py - 7, this.flip);
    }


    private drawDeath(c : Canvas) {

        const BALL_SPEED = 1.0;
        const BALL_COUNT = 8;

        let bmp = c.getBitmap("player");

        let r = this.deathTimer * BALL_SPEED;
        let x : number;
        let y : number;

        let angle = 0;
        for (let i = 0; i < BALL_COUNT; ++ i) {

            angle = Math.PI*2 / BALL_COUNT * i;

            x = this.pos.x + this.center.x + Math.cos(angle) * r;
            y = this.pos.y + this.center.y + Math.sin(angle) * r;

            c.drawSprite(this.spr, bmp, Math.floor(x)-8, Math.floor(y)-8);
        }
    }


    public preDraw(c : Canvas) {

        for (let d of this.dust) {

            d.draw(c);
        }
    }


    public draw(c : Canvas) {

        if (!this.exist) return;

        if (this.dying) {

            this.drawDeath(c);
            return;
        }

        if (this.knockbackTimer <= 0 && this.hurtTimer > 0 &&
            Math.floor(this.hurtTimer / 4) % 2 == 1) {

            return;
        }

        let bmpName = (this.charging && 
            Math.floor(this.chargeTimer/4) % 2 == 0) ?
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

        c.drawSpriteFrame(this.spr, bmp,
            frame, this.spr.getRow(),
            px - this.spr.width/2, 
            py - this.spr.height/2, 
            this.flip);

        if (this.attacking || this.downAttacking)
            this.drawSword(c);

        // TEMP
        /*
        if (this.attacking || this.downAttacking) {

            c.setFillColor(255, 0, 0);
            c.fillRect(this.swordHitbox.x - this.swordHitbox.w/2,
                this.swordHitbox.y - this.swordHitbox.h/2,
                this.swordHitbox.w,
                this.swordHitbox.h);
        }
        */
    }


    public reset() {

        this.pos = this.checkpoint.clone();
        this.resetProperties();

        this.state.reset();
    }


    public setInitialPosition(x : number, y : number) {

        if (this.checkpoint != null) return;

        this.pos = new Vector2(x, y);
        this.checkpoint = this.pos.clone();
    }


    public setCheckpointReference(posRef : Vector2) {

        // Note that we don't copy the vector, just store
        // the reference to it
        this.checkpoint = posRef;
    }


    public compareCheckpointReference(compPos : Vector2) : boolean {

        return compPos === this.checkpoint;
    }


    public hurt(dmg : number, ev : GameEvent) {

        const HURT_TIME = 60;

        if (this.dying || this.hurtTimer > 0) return;
        
        this.hurtTimer = HURT_TIME;
        this.state.addHealth(-dmg);

        this.resetFlags();
    }


    protected verticalCollisionEvent(dir : number, ev : GameEvent) {

        const JUMP_MARGIN = 12;
        const DOWN_ATTACK_WAIT = 30;

        if (dir > 0) {

            if (this.downAttacking && 
                this.downAttackWait <= 0) {

                this.downAttackWait = DOWN_ATTACK_WAIT;
            }

            this.climbing = false;

            this.canJump = true;
            this.boostJump = false;
            this.jumpMargin = JUMP_MARGIN;
            this.jumpTimer = 0;

            this.canAttack = true;
        }
        else {

            this.jumpTimer = 0;
        }
    }


    public ladderCollision(x : number, y : number, w : number, h : number, 
        ladderTop : boolean, ev : GameEvent) : boolean {

        if (boxOverlay(this.pos, this.center, this.collisionBox, x, y, w, h)) {

            this.climbX = x + w/2;
            this.touchLadder = !ladderTop || !this.climbing;
            this.isLadderTop = this.isLadderTop || ladderTop;

            return true;
        }
        return false;
    }


    public cameraCheck(cam : Camera) {

        const ATTACK_CAM_FORCE_WAIT = 30;

        if (Math.abs(this.cameraJumpDelta) > 0) {

            cam.forceCenterOffsetJump(-this.cameraJumpDelta, 0);
            this.cameraJumpDelta = 0;
        }

        if (this.attacking || this.shooting) {

            cam.forceMinimumWaitTime(ATTACK_CAM_FORCE_WAIT);
        }
    }


    public canHurt() : boolean {

        return (this.attacking && (
            (!this.chargeAttack && this.spr.getColumn() < 2) || this.chargeAttack)) ||
            (this.downAttacking && this.downAttackWait <= 0);
    }


    public downAttackBoost() {

        const DOWN_ATTACK_JUMP_TIME = 7;

        if (!this.downAttacking || this.downAttackWait > 0) return;

        this.downAttackJumpMargin = DOWN_ATTACK_JUMP_TIME;
        this.jumpMargin = 0;
        this.boostJump = false;
        this.downAttacking = false;
    }


    public getSwordHitbox() : Rect {

        return this.swordHitbox.clone();
    }


    public breakCollision(x : number, y : number, w : number, h : number, 
        strong : boolean, ev : GameEvent) : boolean {

        const TOP_OFFSET = 2;

        return this.canHurt && 
            boxOverlayRect(this.swordHitbox, x, y + TOP_OFFSET, w, h);
    }


    public hurtCollision(x : number, y : number, w : number, h : number, 
        dmg : number, knockback : number, ev : GameEvent) : boolean {

        const KNOCKBACK_TIME = 30;

        if (this.dying || this.hurtTimer > 0) return;

        if (boxOverlay(this.pos, this.center, this.hitbox,
            x, y, w, h)) {
            
            this.hurt(dmg, ev);
            
            this.knockbackTimer = KNOCKBACK_TIME;
            this.speed.x = knockback;
            this.flip = knockback < 0 ? Flip.None : Flip.Horizontal;
            this.dir = -Math.sign(knockback);

            // TODO: Reduce damage

            return true;
        }

        return false;
    }


    public getAttackDamage() : number {

        let dmg = this.state.computeBaseSwordDamage();

        if (this.chargeAttack) {

            dmg += 2;
        }
        else if (this.downAttacking) {

            ++ dmg;
        }

        return dmg;
    }


    public addCoins(count : number) {

        this.state.addMoney(count);
    }


    public addHealth(amount : number) {

        this.state.addHealth(amount);
    }


    public addAmmo(amount : number) {

        this.state.addAmmo(amount);
    }


    // Random getters, might need to organize them better later
    public getSwordHitId = () : number => this.swordHitId;
    public isDownAttack = () : boolean => this.downAttacking;
}
