import { Camera } from "./camera.js";
import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Vector2 } from "./core/vector.js";
import { CollisionObject } from "./gameobject.js";


// For collisions
const COL_DOWN = 0b0001;
const COL_WALL_LEFT = 0b0010;
const COL_WALL_RIGHT = 0b0100;
const COL_UP = 0b1000;


const COLLISION_TABLE = [
        COL_DOWN,
        COL_WALL_RIGHT,
        COL_UP,
        COL_WALL_LEFT,
        COL_DOWN | COL_UP,
        COL_WALL_LEFT | COL_WALL_RIGHT,
        COL_WALL_LEFT | COL_DOWN,
        COL_WALL_RIGHT | COL_DOWN,
        COL_WALL_RIGHT | COL_UP,
        COL_WALL_LEFT | COL_UP,
        COL_WALL_LEFT | COL_DOWN | COL_WALL_RIGHT,
        COL_WALL_RIGHT | COL_DOWN | COL_UP,
        COL_WALL_LEFT | COL_UP | COL_WALL_RIGHT,
        COL_WALL_LEFT | COL_DOWN | COL_UP,
        COL_WALL_LEFT | COL_DOWN | COL_WALL_RIGHT | COL_UP,
];


export class Stage {


    private layers : Array<Array<number>>;
    private collisionMap : Array<number>;

    private cloudPos : number;

    public readonly width : number;
    public readonly height : number;


    constructor(ev : GameEvent) {

        let baseMap = ev.getTilemap("fields");

        this.layers = baseMap.cloneLayers();
        this.collisionMap = ev.getTilemap("collisions").cloneLayer(0);
        this.width = baseMap.width;
        this.height = baseMap.height;

        this.cloudPos = 0;
    }


    private getTile(l : number, x : number, y : number, def = 0) : number {

        if (l < 0 || l >= this.layers.length ||
            x < 0 || x >= this.width ||
            y < 0 || y >= this.height)
            return def;

        return this.layers[l][y * this.width + x];
    }


    private getCollisionTile(i : number, def = 0) : number {

        if (i < 0 || i >= this.collisionMap.length)
            return def;

        return this.collisionMap[i];
    }


    public update(ev : GameEvent) {

        const CLOUD_SPEED = 0.5;

        this.cloudPos = (this.cloudPos + CLOUD_SPEED*ev.step) % 96;
    }   


    public drawBackground(c : Canvas, cam : Camera) {

        const CLOUD_Y = 64;

        c.drawBitmap(c.getBitmap("sky"), 0, 0);

        let p = -Math.floor(this.cloudPos);
        let bmp = c.getBitmap("background");

        for (let i = 0; i < 3; ++ i) {

            if (i*96 + p > 160 || i*96 + p < -96) continue;

            c.drawBitmapRegion(bmp, 0, 0, 96, 48,
                i*96 + p, CLOUD_Y);

            if (i < 2) {

                c.drawBitmapRegion(bmp, 0, 48, 80, 32, 
                    i*80, CLOUD_Y + 48);
            }
        }
    }


    public draw(c : Canvas, cam : Camera) {

        const OFFSET = 1;

        let tileset = c.getBitmap("tileset");

        let camPos = cam.getTopLeftCorner();

        let startx = Math.floor(camPos.x / 16) - OFFSET;
        let starty = Math.floor(camPos.y / 16) - OFFSET;

        let endx = startx + Math.floor(c.width/16) + OFFSET*2;
        let endy = starty + Math.floor(c.height/16) + OFFSET*2;

        let sx : number;
        let sy : number;

        let tid : number;
        for (let layer = 0; layer < this.layers.length - 1; ++ layer) {

            for (let y = starty; y < endy; ++ y) {

                for (let x = startx; x < endx; ++ x) {

                    tid = this.getTile(layer, x, y, 0);
                    if (tid <= 0) continue;

                    -- tid;

                    sx = tid % 16;
                    sy = Math.floor(tid / 16);

                    c.drawBitmapRegion(tileset, sx * 16, sy * 16, 16, 16,
                        x*16, y*16);
                }
            }
        }
    }


    private handleBaseTileCollision(o : CollisionObject, 
        layer : number, x : number, y : number, 
        colId : number, ev : GameEvent) {

        let c = COLLISION_TABLE[colId];

        let left = this.getCollisionTile(this.getTile(layer, x-1, y)-1);
        let right = this.getCollisionTile(this.getTile(layer, x+1, y)-1);


        // Constant surfaces
        if ((c & COL_DOWN) == COL_DOWN) {

            o.verticalCollision(x*16, y*16, 16, 1, ev);
        }
        if ((c & COL_UP) == COL_UP) {

            o.verticalCollision(x*16, (y+1)*16, 16, -1,  ev);
        }
        if ((c & COL_WALL_RIGHT) == COL_WALL_RIGHT) {

            o.wallCollision((x+1)*16, y*16, 16, -1, ev);
        }
        if ((c & COL_WALL_LEFT) == COL_WALL_LEFT) {

            o.wallCollision(x*16, y*16, 16, 1, ev);
        }
    }

    
    public objectCollisions(o : CollisionObject, ev : GameEvent) {

        const BOUND_COLLISION_Y_MARGIN = 256;
        const RADIUS = 2;
        const BASE_TILE_MAX = 16;

        if (!o.doesExist() || o.isDying() || !o.isInCamera()) 
            return;

        let px = Math.floor(o.getPos().x / 16);
        let py = Math.floor(o.getPos().y / 16);

        let tid : number;
        let colId : number;

        for (let layer = 0; layer < this.layers.length - 1; ++ layer) {

            for (let y = py - RADIUS; y <= py + RADIUS; ++ y) {

                for (let x = px - RADIUS; x <= px + RADIUS; ++ x) {

                    tid = this.getTile(layer, x, y);
                    if (tid <= 0) continue;

                    colId = this.getCollisionTile(tid-1);
                    if (colId <= 0) continue;

                    if (colId <= BASE_TILE_MAX)
                        this.handleBaseTileCollision(o, layer,  x, y, colId-1, ev);
                }
            }
        }

        o.wallCollision(0, -BOUND_COLLISION_Y_MARGIN,
            this.height*16 + BOUND_COLLISION_Y_MARGIN*2, -1, ev, 
            true);
        o.wallCollision(this.width*16, -BOUND_COLLISION_Y_MARGIN,
            this.height*16 + BOUND_COLLISION_Y_MARGIN*2, 1, ev, 
            true);
    }
    

    public restrictCamera(cam : Camera) {

        cam.restrictCamera(0, 0, this.width*16, this.height*16);
    }


/*
    public parseObjects(objects : ObjectManager) {

        const FIRST_OBJECT_INDEX = 257;
        // I could as well move the checkpoint tile after the collectibles
        // TODO: Maybe do that
        const COLLECTIBLE_IDS = [0, 0, 1, 2, 3];

        let tid : number;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                tid = this.layers[this.layers.length-1][y * this.width + x];
                if (tid < FIRST_OBJECT_INDEX) continue;

                tid -= FIRST_OBJECT_INDEX;

                switch(tid) {

                // Player
                case 0:

                    objects.setPlayerPosition(x, y);
                    objects.addCheckpoint(x, y, true);
                    break;
                
                // Collectible
                case 1:
                case 3:
                case 4:
                case 5:

                    objects.addCollectible(x, y, 
                        COLLECTIBLE_IDS[tid-1]);
                    break;

                // Checkpoint
                case 2:
                    
                    objects.addCheckpoint(x, y);
                    break;
                
                default:
                    break;
                }

                if (tid >= 16 && tid < 32) {

                    objects.addEnemy(x, y, tid-16);
                }
            }
        }
    }
    */
}
