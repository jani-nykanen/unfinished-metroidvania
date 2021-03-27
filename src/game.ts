import { Camera } from "./camera.js";
import { Canvas } from "./core/canvas.js";
import { GameEvent, Scene } from "./core/core.js";
import { ObjectManager } from "./objectmanager.js";
import { Stage } from "./stage.js";
import { GameState } from "./state.js";


export class GameScene implements Scene {


    private camera : Camera;
    private stage : Stage;
    private objects : ObjectManager;
    private state : GameState;


    constructor(param : any, ev : GameEvent) {

        this.camera = new Camera(0, 144, 160, 144);
        this.stage = new Stage(ev);
        this.state = new GameState();
        this.objects = new ObjectManager(this.state);
    }   


    public update(ev : GameEvent) {

        this.stage.update(ev);
        this.objects.update(this.stage, this.camera, ev);
        this.stage.restrictCamera(this.camera);
    }


    private genItemString(count : number, max : number, icon : number) {

        let str = String.fromCharCode(icon, icon+1);
        
        if (max > 10 && count < 10)
            str += "0";

        str += String(count) + "/" + String(max);
        
        return str;
    }


    private drawHUD(c : Canvas) {

        let font = c.getBitmap("font");

        c.setFillColor(0, 0, 0, 0.33);
        c.fillRect(0, 0, c.width, 10);

        c.drawText(font, 
            this.genItemString(this.state.getHealth(), this.state.getMaxHealth(), 4), 
            -3, 1, -1);

        c.drawText(font, 
            this.genItemString(this.state.getBulletCount(), this.state.getMaxBulletCount(), 6), 
            c.width/2 + 4, 1, -1, 0, true);

        let str = String.fromCharCode(8, 2) + String(this.state.getMoney());
        c.drawText(font, str, c.width - str.length*8 - 2, 1);  
    }


    public redraw(c : Canvas) {

        c.moveTo();

        this.stage.drawBackground(c, this.camera);

        this.camera.use(c);
        this.stage.draw(c, this.camera);
        this.objects.draw(c);

        c.moveTo();
        this.drawHUD(c);
    }


    public dispose() : any {

        return null;
    }
}
