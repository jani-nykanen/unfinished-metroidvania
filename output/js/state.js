import { clamp } from "./core/mathext.js";
export class GameState {
    constructor() {
        this.getHealth = () => this.health;
        this.getMaxHealth = () => this.maxHealth;
        this.getBulletCount = () => this.bullets;
        this.getMaxBulletCount = () => this.maxBullets;
        this.getMoney = () => this.money;
        this.maxHealth = 10;
        this.health = 1; // this.maxHealth;
        this.maxBullets = 20;
        this.bullets = this.maxBullets;
        this.money = 0;
    }
    addHealth(amount) {
        this.health = clamp(this.health + amount, 0, this.maxHealth);
    }
    addAmmo(count) {
        this.bullets = clamp(this.bullets + count, 0, this.maxBullets);
    }
    computeBaseSwordDamage() {
        // Obviously temporary
        return 2;
    }
    computeBaseProjectileDamage() {
        return 1;
    }
    reset() {
        this.health = this.maxHealth;
        // this.bullets = this.maxBullets;
    }
}
