import { clamp } from "./core/mathext.js";
export class GameState {
    constructor() {
        this.getHealth = () => this.health;
        this.getMaxHealth = () => this.maxHealth;
        this.getBulletCount = () => this.bullets;
        this.getMaxBulletCount = () => this.maxBullets;
        this.getMoney = () => this.money;
        this.maxHealth = 10;
        this.health = this.maxHealth;
        this.maxBullets = 20;
        this.bullets = this.maxBullets;
        this.money = 0;
    }
    addAmmo(count) {
        this.bullets = clamp(this.bullets + count, 0, this.maxBullets);
    }
}