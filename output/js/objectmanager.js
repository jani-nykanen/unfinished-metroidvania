import { getEnemyType } from "./enemytypes.js";
import { ObjectPool } from "./objectpool.js";
import { Player } from "./player.js";
import { Projectile } from "./projectile.js";
export class ObjectManager {
    constructor(state) {
        this.isPlayerDead = () => !this.player.doesExist();
        this.projectiles = new ObjectPool(Projectile);
        this.player = new Player(80, 144 - 40, this.projectiles, state);
        this.enemies = new Array();
        this.interactionObjects = new Array();
        this.flyingMessages = new Array();
    }
    update(stage, camera, ev) {
        this.player.update(ev);
        this.player.cameraCheck(camera);
        stage.objectCollisions(this.player, ev);
        this.projectiles.update(stage, camera, ev);
        for (let e of this.enemies) {
            e.cameraCheck(camera);
            e.update(ev);
            e.playerCollision(this.player, this.flyingMessages, ev);
            stage.objectCollisions(e, ev);
            if (!e.isDeactivated()) {
                this.projectiles.event(p => {
                    e.projectileCollision(p, this.flyingMessages, ev);
                });
                for (let e2 of this.enemies) {
                    if (e2 != e) {
                        e.enemyCollision(e2, ev);
                    }
                }
            }
        }
        for (let o of this.interactionObjects) {
            o.cameraCheck(camera);
            o.update(ev);
            o.playerCollision(this.player, ev);
        }
        camera.followObject(this.player, ev);
        for (let m of this.flyingMessages) {
            m.update(ev);
        }
    }
    draw(c) {
        this.player.preDraw(c);
        for (let o of this.interactionObjects) {
            o.draw(c);
        }
        for (let e of this.enemies) {
            e.draw(c);
        }
        this.projectiles.draw(c);
        this.player.draw(c);
        for (let m of this.flyingMessages) {
            m.draw(c);
        }
    }
    setPlayerInitialPosition(x, y) {
        this.player.setInitialPosition(x * 16 + 8, y * 16 + 8);
    }
    addEnemy(index, x, y) {
        this.enemies.push(new (getEnemyType(index).prototype.constructor)(x * 16 + 8, y * 16 + 8));
    }
    addInteractionObject(object) {
        this.interactionObjects.push(object);
    }
    setInitialCameraPosition(cam) {
        cam.setPosition(this.player.getPos());
    }
    focusOnPlayer(tr, cam) {
        tr.setCenter(cam.getObjectRelativePosition(this.player));
    }
    reset() {
        this.player.reset();
        this.enemies = new Array();
        this.interactionObjects = new Array();
        this.projectiles.killAll();
    }
    initialCameraCheck(cam) {
        for (let e of this.enemies) {
            e.cameraCheck(cam);
        }
        for (let o of this.interactionObjects) {
            o.cameraCheck(cam);
            o.playerCollision(this.player, null);
        }
    }
}
