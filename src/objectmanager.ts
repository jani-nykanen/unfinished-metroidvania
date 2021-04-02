import { Camera } from "./camera.js";
import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { TransitionEffectManager } from "./core/transition.js";
import { Enemy } from "./enemy.js";
import { getEnemyType } from "./enemytypes.js";
import { FlyingText } from "./flyingtext.js";
import { ObjectPool } from "./objectpool.js";
import { Player } from "./player.js";
import { Projectile } from "./projectile.js";
import { Stage } from "./stage.js";
import { GameState } from "./state.js";


export class ObjectManager {


    private player : Player;
    private projectiles : ObjectPool<Projectile>;
    private enemies : Array<Enemy>;
    private flyingMessages : Array<FlyingText>;


    constructor(state : GameState) {

        this.projectiles = new ObjectPool<Projectile> (Projectile);
        this.player = new Player(80, 144 - 40, this.projectiles, state);
        this.enemies = new Array<Enemy>();
        this.flyingMessages = new Array<FlyingText> ();
    }


    public update(stage : Stage, camera : Camera, ev : GameEvent) {

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

                this.projectiles.event(
                    p => {
                        e.projectileCollision(p, this.flyingMessages, ev);
                    }
                );
            }
        }

        camera.followObject(this.player, ev);

        for (let m of this.flyingMessages) {

            m.update(ev);
        }
    }


    public draw(c : Canvas) {

        this.player.preDraw(c);
        
        for (let e of this.enemies) {

            e.draw(c);
        }

        this.projectiles.draw(c);
        this.player.draw(c);

        for (let m of this.flyingMessages) {

            m.draw(c);
        }
    }


    public setPlayerLocation(x : number, y : number) {

        this.player.setPosition(x*16 + 8, y*16 + 8);
    }


    public addEnemy(index : number, x : number, y : number) {

        this.enemies.push(new (getEnemyType(index).prototype.constructor) (x*16 + 8, y*16 + 8));
    } 


    public setInitialCameraPosition(cam : Camera) {

        cam.setPosition(this.player.getPos());
    }


    public focusOnPlayer(tr : TransitionEffectManager, cam : Camera) {

        tr.setCenter(cam.getObjectRelativePosition(this.player));
    }


    public reset() {

        this.player.reset();

        this.enemies = new Array<Enemy>();
        this.projectiles.killAll();
    }


    public initialCameraCheck(cam : Camera) {

        for (let e of this.enemies) {

            e.cameraCheck(cam);
        }
    }


    public isPlayerDead = () : boolean => !this.player.doesExist();
}
