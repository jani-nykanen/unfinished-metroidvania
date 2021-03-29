import { Camera } from "./camera.js";
import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Enemy } from "./enemy.js";
import { ObjectPool } from "./objectpool.js";
import { Player } from "./player.js";
import { Projectile } from "./projectile.js";
import { Stage } from "./stage.js";
import { GameState } from "./state.js";


export class ObjectManager {


    private player : Player;
    private projectiles : ObjectPool<Projectile>;
    private enemies : Array<Enemy>;


    constructor(state : GameState) {

        this.projectiles = new ObjectPool<Projectile> (Projectile);
        this.player = new Player(80, 144 - 40, this.projectiles, state);
    }


    public update(stage : Stage, camera : Camera, ev : GameEvent) {

        this.player.update(ev);
        stage.objectCollisions(this.player, ev);
        camera.followObject(this.player, ev);
    
        this.projectiles.update(stage, camera, ev);
    }


    public draw(c : Canvas) {

        this.player.preDraw(c);
        
        this.projectiles.draw(c);
        this.player.draw(c);
    }


    public setPlayerLocation(x : number, y : number) {

        this.player.setPosition(x*16 + 8, y*16 + 8);
    }


    public setInitialCameraPosition(cam : Camera) {

        cam.setPosition(this.player.getPos());
    }
}
