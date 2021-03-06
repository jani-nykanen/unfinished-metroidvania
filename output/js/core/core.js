import { AssetManager } from "./assets.js";
import { Canvas } from "./canvas.js";
import { InputManager } from "./input.js";
import { TransitionEffectManager } from "./transition.js";
export class GameEvent {
    constructor(step, core, canvas, input, assets, transition) {
        this.leftPress = () => this.input.leftPress();
        this.rightPress = () => this.input.rightPress();
        this.upPress = () => this.input.upPress();
        this.downPress = () => this.input.downPress();
        this.isShaking = () => this.canvas.isShaking();
        this.getTilemap = (name) => this.assets.getTilemap(name);
        this.core = core;
        this.step = step;
        this.canvas = canvas;
        this.input = input;
        this.assets = assets;
        this.transition = transition;
    }
    getStick() {
        return this.input.getStick();
    }
    getAction(name) {
        return this.input.getAction(name);
    }
    changeScene(newScene) {
        this.core.changeScene(newScene);
    }
    shake(shakeTime, magnitude) {
        this.canvas.shake(shakeTime, magnitude);
    }
}
export class Core {
    constructor(canvasWidth, canvasHeight, frameSkip = 0) {
        this.assets = new AssetManager();
        this.canvas = new Canvas(canvasWidth, canvasHeight, this.assets);
        this.input = new InputManager();
        this.input.addAction("left", "ArrowLeft", 14)
            .addAction("up", "ArrowUp", 12)
            .addAction("right", "ArrowRight", 15)
            .addAction("down", "ArrowDown", 13),
            this.transition = new TransitionEffectManager();
        this.ev = new GameEvent(frameSkip + 1, this, this.canvas, this.input, this.assets, this.transition);
        this.timeSum = 0.0;
        this.oldTime = 0.0;
        this.initialized = false;
        this.activeScene = null;
        this.activeSceneType = null;
    }
    drawLoadingScreen(c) {
        let barWidth = c.width / 4;
        let barHeight = barWidth / 8;
        c.clear(0, 0, 0);
        let t = this.assets.dataLoadedUnit();
        let x = c.width / 2 - barWidth / 2;
        let y = c.height / 2 - barHeight / 2;
        x |= 0;
        y |= 0;
        // Outlines
        c.setFillColor(255);
        c.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
        c.setFillColor(0);
        c.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
        // Bar
        let w = (barWidth * t) | 0;
        c.setFillColor(255);
        c.fillRect(x, y, w, barHeight);
    }
    loop(ts) {
        const MAX_REFRESH_COUNT = 5;
        const FRAME_WAIT = 16.66667 * this.ev.step;
        this.timeSum += ts - this.oldTime;
        this.timeSum = Math.min(MAX_REFRESH_COUNT * FRAME_WAIT, this.timeSum);
        this.oldTime = ts;
        let refreshCount = (this.timeSum / FRAME_WAIT) | 0;
        while ((refreshCount--) > 0) {
            if (!this.initialized && this.assets.hasLoaded()) {
                if (this.activeSceneType != null)
                    this.activeScene = new this.activeSceneType.prototype.constructor(null, this.ev);
                this.initialized = true;
            }
            this.input.preUpdate();
            if (this.initialized && this.activeScene != null) {
                this.activeScene.update(this.ev);
            }
            this.canvas.update(this.ev);
            this.transition.update(this.ev);
            this.input.postUpdate();
            this.timeSum -= FRAME_WAIT;
        }
        if (this.initialized) {
            if (this.activeScene != null)
                this.activeScene.redraw(this.canvas);
            this.transition.draw(this.canvas);
        }
        else {
            this.drawLoadingScreen(this.canvas);
        }
        window.requestAnimationFrame(ts => this.loop(ts));
    }
    addInputAction(name, key, button1, button2 = -1) {
        this.input.addAction(name, key, button1, button2);
        return this;
    }
    loadAssets(indexFilePath) {
        this.assets.parseAssetIndexFile(indexFilePath);
        return this;
    }
    run(initialScene) {
        this.activeSceneType = initialScene;
        this.loop(0);
    }
    changeScene(newScene) {
        let param = this.activeScene.dispose();
        this.activeScene = new newScene.prototype.constructor(param, this.ev);
    }
}
