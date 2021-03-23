export class GameScene {
    constructor(param, ev) {
    }
    update(ev) {
    }
    redraw(c) {
        c.clear(170, 170, 170);
        c.moveTo();
        c.drawText(c.getBitmap("font"), "Hello world!", 2, 2, 0, 0);
    }
    dispose() {
        return null;
    }
}
