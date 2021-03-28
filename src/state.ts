import { clamp } from "./core/mathext.js";



export class GameState {


    private health : number;
    private maxHealth : number;

    private maxBullets : number;
    private bullets : number;

    private money : number;


    constructor() {

        this.maxHealth = 10;
        this.health = this.maxHealth;

        this.maxBullets = 20;
        this.bullets = this.maxBullets;

        this.money = 0;
    }


    public getHealth = () : number => this.health;
    public getMaxHealth = () : number => this.maxHealth;

    public getBulletCount = () : number => this.bullets;
    public getMaxBulletCount = () : number => this.maxBullets;

    public getMoney = () : number => this.money;


    public addAmmo(count : number) {

        this.bullets = clamp(this.bullets + count, 0, this.maxBullets);
    }
}