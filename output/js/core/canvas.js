import { clamp } from "./mathext.js";
import { Vector2 } from "./vector.js";
export var Flip;
(function (Flip) {
    Flip[Flip["None"] = 0] = "None";
    Flip[Flip["Horizontal"] = 1] = "Horizontal";
    Flip[Flip["Vertical"] = 2] = "Vertical";
    Flip[Flip["Both"] = 3] = "Both";
})(Flip || (Flip = {}));
;
export class Canvas {
    constructor(width, height, assets) {
        this.isShaking = () => this.shakeTimer > 0;
        this.width = width;
        this.height = height;
        this.translation = new Vector2();
        this.assets = assets;
        this.createHtml5Canvas(width, height);
        window.addEventListener("resize", () => this.resize(window.innerWidth, window.innerHeight));
        this.shakeTimer = 0;
        this.shakeAmount = 0;
    }
    createHtml5Canvas(width, height) {
        let cdiv = document.createElement("div");
        cdiv.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;");
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;" +
            "image-rendering: optimizeSpeed;" +
            "image-rendering: pixelated;" +
            "image-rendering: -moz-crisp-edges;");
        cdiv.appendChild(this.canvas);
        document.body.appendChild(cdiv);
        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;
        this.resize(window.innerWidth, window.innerHeight);
    }
    getColorString(r, g, b, a = 1.0) {
        return "rgba(" + String(r | 0) + "," +
            String(g | 0) + "," +
            String(b | 0) + "," +
            String(clamp(a, 0.0, 1.0));
    }
    resize(width, height) {
        let c = this.canvas;
        // Find the best multiplier for
        // square pixels (unless too small for that)
        let mul = Math.min(width / c.width, height / c.height);
        if (mul >= 1.0) {
            mul = Math.floor(mul);
        }
        let totalWidth = c.width * mul;
        let totalHeight = c.height * mul;
        let x = width / 2 - totalWidth / 2;
        let y = height / 2 - totalHeight / 2;
        let top = String(y | 0) + "px";
        let left = String(x | 0) + "px";
        c.style.width = String(totalWidth | 0) + "px";
        c.style.height = String(totalHeight | 0) + "px";
        c.style.top = top;
        c.style.left = left;
    }
    moveTo(x = 0.0, y = 0.0) {
        this.translation.x = x | 0;
        this.translation.y = y | 0;
    }
    move(x, y) {
        this.translation.x += x | 0;
        this.translation.y += y | 0;
    }
    clear(r, g, b) {
        this.ctx.fillStyle = this.getColorString(r, g, b);
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    setFillColor(r, g = r, b = g, a = 1.0) {
        let colorStr = this.getColorString(r, g, b, a);
        this.ctx.fillStyle = colorStr;
        // this.ctx.strokeStyle = colorStr;
    }
    setGlobalAlpha(a = 1.0) {
        this.ctx.globalAlpha = clamp(a, 0, 1);
    }
    fillRect(x, y, w, h) {
        x += this.translation.x;
        y += this.translation.y;
        this.ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
    }
    drawBitmap(bmp, dx, dy, flip = Flip.None) {
        this.drawBitmapRegion(bmp, 0, 0, bmp.width, bmp.height, dx, dy, flip);
    }
    drawBitmapRegion(bmp, sx, sy, sw, sh, dx, dy, flip = Flip.None) {
        this.drawScaledBitmapRegion(bmp, sx, sy, sw, sh, dx, dy, sw, sh, flip);
    }
    drawScaledBitmapRegion(bmp, sx, sy, sw, sh, dx, dy, dw, dh, flip = Flip.None) {
        if (bmp == null || sw <= 0 || sh <= 0)
            return;
        let c = this.ctx;
        dx += this.translation.x;
        dy += this.translation.y;
        sx |= 0;
        sy |= 0;
        sw |= 0;
        sh |= 0;
        dx |= 0;
        dy |= 0;
        dw |= 0;
        dh |= 0;
        flip = flip | Flip.None;
        if (flip != Flip.None) {
            c.save();
        }
        if ((flip & Flip.Horizontal) != 0) {
            c.translate(dw, 0);
            c.scale(-1, 1);
            dx *= -1;
        }
        if ((flip & Flip.Vertical) != 0) {
            c.translate(0, dh);
            c.scale(1, -1);
            dy *= -1;
        }
        c.drawImage(bmp, sx, sy, sw, sh, dx, dy, dw, dh);
        if (flip != Flip.None) {
            c.restore();
        }
    }
    drawText(font, str, dx, dy, xoff = 0.0, yoff = 0.0, center = false) {
        let cw = (font.width / 16) | 0;
        let ch = cw;
        let x = dx;
        let y = dy;
        let c;
        if (center) {
            dx -= (str.length * (cw + xoff)) / 2.0;
            x = dx;
        }
        for (let i = 0; i < str.length; ++i) {
            c = str.charCodeAt(i);
            if (c == '\n'.charCodeAt(0)) {
                x = dx;
                y += ch + yoff;
                continue;
            }
            this.drawBitmapRegion(font, (c % 16) * cw, ((c / 16) | 0) * ch, cw, ch, x, y, Flip.None);
            x += cw + xoff;
        }
    }
    drawSpriteFrame(spr, bmp, column, row, dx, dy, flip = Flip.None) {
        spr.drawFrame(this, bmp, column, row, dx, dy, flip);
    }
    drawSprite(spr, bmp, dx, dy, flip = Flip.None) {
        spr.draw(this, bmp, dx, dy, flip);
    }
    getBitmap(name) {
        return this.assets.getBitmap(name);
    }
    shake(shakeTime, shakeAmount) {
        this.shakeTimer = shakeTime;
        this.shakeAmount = shakeAmount;
    }
    update(ev) {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= ev.step;
        }
    }
    applyShake() {
        if (this.shakeTimer <= 0)
            return;
        let rx = Math.round(Math.random() * this.shakeAmount * 2) - this.shakeAmount;
        let ry = Math.round(Math.random() * this.shakeAmount * 2) - this.shakeAmount;
        this.move(rx, ry);
    }
}
