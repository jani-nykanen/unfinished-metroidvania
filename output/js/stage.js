import { Checkpoint } from "./checkpoint.js";
import { Vector2 } from "./core/vector.js";
import { ObjectPool } from "./objectpool.js";
import { Particle } from "./particles.js";
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
    constructor(ev) {
        let baseMap = ev.getTilemap("fields");
        this.layers = baseMap.cloneLayers();
        this.collisionMap = ev.getTilemap("collisions").cloneLayer(0);
        this.width = baseMap.width;
        this.height = baseMap.height;
        this.particles = new ObjectPool(Particle);
        this.cloudPos = 0;
    }
    getTile(l, x, y, def = 0) {
        if (l < 0 || l >= this.layers.length ||
            x < 0 || x >= this.width ||
            y < 0 || y >= this.height)
            return def;
        return this.layers[l][y * this.width + x];
    }
    getCollisionTile(i, def = 0) {
        if (i < 0 || i >= this.collisionMap.length)
            return def;
        return this.collisionMap[i];
    }
    update(cam, ev) {
        const CLOUD_SPEED = 0.5;
        this.cloudPos = (this.cloudPos + CLOUD_SPEED * ev.step) % 96;
        this.particles.update(this, cam, ev);
    }
    drawBackground(c, cam) {
        const CLOUD_Y = 48;
        const DISTANCE_MOD = 4;
        let camPos = cam.getTopLeftCorner();
        let shifty = Math.floor((camPos.y - (this.height * 16 - c.height)) / DISTANCE_MOD);
        c.drawBitmap(c.getBitmap("sky"), 0, 0);
        let p = -Math.floor((this.cloudPos + camPos.x / DISTANCE_MOD) % 96);
        let bmp = c.getBitmap("background");
        for (let i = 0; i < 3; ++i) {
            if (i * 96 + p > 160 || i * 96 + p < -96)
                continue;
            // Cloud
            c.drawBitmapRegion(bmp, 0, 0, 96, 48, i * 96 + p, CLOUD_Y - shifty);
            // Water
            if (i < 2) {
                c.drawBitmapRegion(bmp, 0, 48, 80, 48, i * 80, CLOUD_Y + 48 - shifty);
            }
        }
    }
    draw(c, cam) {
        const OFFSET = 1;
        let tileset = c.getBitmap("tileset");
        let camPos = cam.getTopLeftCorner();
        let startx = Math.floor(camPos.x / 16) - OFFSET;
        let starty = Math.floor(camPos.y / 16) - OFFSET;
        let endx = startx + Math.floor(c.width / 16) + OFFSET * 2;
        let endy = starty + Math.floor(c.height / 16) + OFFSET * 2;
        let sx;
        let sy;
        let tid;
        for (let layer = 0; layer < this.layers.length - 1; ++layer) {
            for (let y = starty; y < endy; ++y) {
                for (let x = startx; x < endx; ++x) {
                    tid = this.getTile(layer, x, y, 0);
                    if (tid <= 0)
                        continue;
                    --tid;
                    sx = tid % 16;
                    sy = Math.floor(tid / 16);
                    c.drawBitmapRegion(tileset, sx * 16, sy * 16, 16, 16, x * 16, y * 16);
                }
            }
        }
        this.particles.draw(c);
    }
    handleBaseTileCollision(o, layer, x, y, colId, ev) {
        let c = COLLISION_TABLE[colId];
        // Constant surfaces
        if ((c & COL_DOWN) == COL_DOWN) {
            o.verticalCollision(x * 16, y * 16, 16, 1, ev);
        }
        if ((c & COL_UP) == COL_UP) {
            o.verticalCollision(x * 16, (y + 1) * 16, 16, -1, ev);
        }
        if ((c & COL_WALL_RIGHT) == COL_WALL_RIGHT) {
            o.wallCollision((x + 1) * 16, y * 16, 16, -1, ev);
        }
        if ((c & COL_WALL_LEFT) == COL_WALL_LEFT) {
            o.wallCollision(x * 16, y * 16, 16, 1, ev);
        }
    }
    spawnParticles(x, y) {
        const PARTICLE_COUNT = 4;
        const ANGLE_STEP = Math.PI * 2 / PARTICLE_COUNT;
        const SPEED_MIN = 1.75;
        const SPEED_MAX = 2.25;
        const JUMP_Y = -1.0;
        const ANGLE_START = Math.PI / 4;
        const PARTICLE_TIME = 300;
        let angle, speed;
        for (let i = 0; i < PARTICLE_COUNT; ++i) {
            angle = ANGLE_START + i * ANGLE_STEP;
            speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
            this.particles.nextObject()
                .spawn(x, y, new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed + JUMP_Y), Math.floor(Math.random() * 4), 0, PARTICLE_TIME);
        }
    }
    handleSpecialTileCollision(o, layer, x, y, colId, ev) {
        const LADDER_WIDTH = 8;
        const BREAK_TOP_OFFSET = 2;
        let ladderOff = (16 - LADDER_WIDTH) / 2;
        switch (colId) {
            // Ladder top
            case 15:
                o.ladderCollision(x * 16 + ladderOff, y * 16 + 15, LADDER_WIDTH, 1, true, ev);
                o.verticalCollision(x * 16, (y + 1) * 16, 16, 1, ev);
                break;
            // Breaking tile
            case 16:
                if (o.breakCollision(x * 16, y * 16 + BREAK_TOP_OFFSET, 16, 16, ev)) {
                    this.layers[layer][y * this.width + x] = 0;
                    this.spawnParticles(x * 16 + 8, y * 16 + 8);
                }
                else {
                    this.handleBaseTileCollision(o, layer, x, y, 14, ev);
                }
                break;
            // Ladder bottom
            case 31:
                o.ladderCollision(x * 16 + ladderOff, y * 16 + 1, LADDER_WIDTH, 15, false, ev);
                break;
        }
    }
    objectCollisions(o, ev) {
        const BOUND_COLLISION_Y_MARGIN = 256;
        const RADIUS = 2;
        const BASE_TILE_MAX = 15;
        if (!o.doesExist() || (o.isDying() && !o.doesCollideIfDying()) || !o.isInCamera())
            return;
        let px = Math.floor(o.getPos().x / 16);
        let py = Math.floor(o.getPos().y / 16);
        let tid;
        let colId;
        for (let layer = 0; layer < this.layers.length - 1; ++layer) {
            for (let y = py - RADIUS; y <= py + RADIUS; ++y) {
                for (let x = px - RADIUS; x <= px + RADIUS; ++x) {
                    tid = this.getTile(layer, x, y);
                    if (tid <= 0)
                        continue;
                    colId = this.getCollisionTile(tid - 1);
                    if (colId <= 0)
                        continue;
                    if (colId <= BASE_TILE_MAX)
                        this.handleBaseTileCollision(o, layer, x, y, colId - 1, ev);
                    else
                        this.handleSpecialTileCollision(o, layer, x, y, colId - 1, ev);
                }
            }
        }
        o.wallCollision(0, -BOUND_COLLISION_Y_MARGIN, this.height * 16 + BOUND_COLLISION_Y_MARGIN * 2, -1, ev, true);
        o.wallCollision(this.width * 16, -BOUND_COLLISION_Y_MARGIN, this.height * 16 + BOUND_COLLISION_Y_MARGIN * 2, 1, ev, true);
    }
    restrictCamera(cam) {
        cam.restrictCamera(0, 0, this.width * 16, this.height * 16);
    }
    parseObjects(objects) {
        const FIRST_OBJECT_INDEX = 257;
        let tid;
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                tid = this.layers[this.layers.length - 1][y * this.width + x];
                if (tid < FIRST_OBJECT_INDEX)
                    continue;
                tid -= FIRST_OBJECT_INDEX;
                switch (tid) {
                    // Player
                    case 0:
                        objects.setPlayerInitialPosition(x, y);
                        break;
                    // Checkpoint
                    case 1:
                        objects.addInteractionObject(new Checkpoint(x * 16 + 8, y * 16 + 8));
                        break;
                    default:
                        break;
                }
                if (tid >= 16 && tid < 32) {
                    objects.addEnemy(tid - 16, x, y);
                }
            }
        }
    }
}
