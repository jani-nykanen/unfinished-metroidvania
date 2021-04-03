import { Camera } from "./camera.js";
import { Collectible } from "./collectible.js";
import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { TransitionEffectManager } from "./core/transition.js";
import { Enemy } from "./enemy.js";
import { getEnemyType } from "./enemytypes.js";
import { FlyingText } from "./flyingtext.js";
import { InteractionTarget } from "./interactiontarget.js";
import { ObjectPool } from "./objectpool.js";
import { Player } from "./player.js";
import { Projectile } from "./projectile.js";
import { Stage } from "./stage.js";
import { GameState } from "./state.js";


export class ObjectManager {


    private player : Player;
    private projectiles : ObjectPool<Projectile>;
    private collectibles : ObjectPool<Collectible>;
    private enemies : Array<Enemy>;
    private interactionObjects : Array<InteractionTarget>;
    private flyingMessages : Array<FlyingText>;


    constructor(state : GameState) {

        this.projectiles = new ObjectPool<Projectile> (Projectile);
        this.player = new Player(80, 144 - 40, this.projectiles, state);
        this.enemies = new Array<Enemy>();
        this.interactionObjects = new Array<InteractionTarget> ();
        this.flyingMessages = new Array<FlyingText> ();
        this.collectibles = new ObjectPool<Collectible> (Collectible);
    }


    public update(stage : Stage, camera : Camera, ev : GameEvent) {

        this.player.update(ev);
        this.player.cameraCheck(camera);
        stage.objectCollisions(this.player, ev); 
    
        this.projectiles.update(stage, camera, null, ev);
        this.collectibles.update(stage, camera, this.player, ev);

        for (let e of this.enemies) {

            e.cameraCheck(camera);
            e.update(ev);
            e.playerCollision(this.player,
                this.flyingMessages, this.collectibles, ev);
            stage.objectCollisions(e, ev);

            if (!e.isDeactivated()) {

                this.projectiles.event(
                    p => {
                        e.projectileCollision(p, 
                            this.flyingMessages, this.collectibles, ev);
                    }
                );

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


    public draw(c : Canvas) {

        this.player.preDraw(c);

        for (let o of this.interactionObjects) {

            o.draw(c);
        }
        
        for (let e of this.enemies) {

            e.draw(c);
        }
        
        this.collectibles.draw(c);
        this.projectiles.draw(c);
        this.player.draw(c);

        for (let m of this.flyingMessages) {

            m.draw(c);
        }
    }


    public setPlayerInitialPosition(x : number, y : number) {

        this.player.setInitialPosition(x*16 + 8, y*16 + 8);
    }


    public addEnemy(index : number, x : number, y : number) {

        this.enemies.push(new (getEnemyType(index).prototype.constructor) (x*16 + 8, y*16 + 8));
    } 


    public addInteractionObject(object : InteractionTarget) {

        this.interactionObjects.push(object);
    }


    public setInitialCameraPosition(cam : Camera) {

        cam.setPosition(this.player.getPos());
    }


    public focusOnPlayer(tr : TransitionEffectManager, cam : Camera) {

        tr.setCenter(cam.getObjectRelativePosition(this.player));
    }


    public reset() {

        this.player.reset();

        this.enemies = new Array<Enemy> ();
        this.interactionObjects = new Array<InteractionTarget> ();
        this.projectiles.killAll();
    }


    public initialCameraCheck(cam : Camera) {

        for (let e of this.enemies) {

            e.cameraCheck(cam);
        }

        for (let o of this.interactionObjects) {

            o.cameraCheck(cam);
            o.playerCollision(this.player, null);
        }
    }


    public isPlayerDead = () : boolean => !this.player.doesExist();
}
