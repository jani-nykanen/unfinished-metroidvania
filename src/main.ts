import { Core } from "./core/core.js"
import { GameScene } from "./game.js";


window.onload = () : void => (new Core(160, 144))
    .addInputAction("fire1", "KeyZ", 0)
    .addInputAction("fire2", "KeyX", 2)
    .addInputAction("fire3", "KeyC", 1)
    .addInputAction("start", "Enter", 9, 7)
    .addInputAction("back", "Escape", 8, 6)
    .addInputAction("select", "ShiftLeft", 4, 5)
    .loadAssets("assets/index.json")
    .run(GameScene);

