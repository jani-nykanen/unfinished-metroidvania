import { Camera } from "./camera.js";
import { Canvas } from "./core/canvas.js";
import { GameEvent, Scene } from "./core/core.js";
import { ObjectManager } from "./objectmanager.js";
import { Stage } from "./stage.js";


export class GameScene implements Scene {


    private camera : Camera;
    private stage : Stage;
    private objects : ObjectManager;


    constructor(param : any, ev : GameEvent) {

        this.camera = new Camera(0, 144, 160, 144);
        this.stage = new Stage(ev);
        this.objects = new ObjectManager();
    }   


    public update(ev : GameEvent) {

        this.stage.update(ev);
        this.objects.update(this.stage, this.camera, ev);
        this.stage.restrictCamera(this.camera);
    }


    public redraw(c : Canvas) {

        c.moveTo();

        this.stage.drawBackground(c, this.camera);

        this.camera.use(c);
        this.stage.draw(c, this.camera);
        this.objects.draw(c);

        c.drawText(c.getBitmap("font"), "Hello world!", 2, 2, 0, 0);
    }


    public dispose() : any {

        return null;
    }
}
