import { Tilemap } from "./tilemap.js";
import { KeyValuePair } from "./types.js";
export class AssetContainer {
    constructor() {
        this.assets = new Array();
    }
    getAsset(name) {
        for (let a of this.assets) {
            if (a.key == name)
                return a.value;
        }
        return null;
    }
    addAsset(name, data) {
        this.assets.push(new KeyValuePair(name, data));
    }
}
export class AssetManager {
    constructor() {
        this.bitmaps = new AssetContainer();
        this.tilemaps = new AssetContainer();
        this.total = 0;
        this.loaded = 0;
    }
    loadTextfile(path, type, cb) {
        let xobj = new XMLHttpRequest();
        xobj.overrideMimeType("text/" + type);
        xobj.open("GET", path, true);
        ++this.total;
        xobj.onreadystatechange = () => {
            if (xobj.readyState == 4) {
                if (String(xobj.status) == "200") {
                    if (cb != undefined)
                        cb(xobj.responseText);
                }
                ++this.loaded;
            }
        };
        xobj.send(null);
    }
    loadBitmap(name, url) {
        ++this.total;
        let image = new Image();
        image.onload = () => {
            ++this.loaded;
            this.bitmaps.addAsset(name, image);
        };
        image.src = url;
    }
    loadTilemap(name, url) {
        ++this.total;
        this.loadTextfile(url, "xml", (str) => {
            this.tilemaps.addAsset(name, new Tilemap(str));
            ++this.loaded;
        });
    }
    parseAssetIndexFile(url) {
        this.loadTextfile(url, "json", (s) => {
            let data = JSON.parse(s);
            let path = data["bitmapPath"];
            for (let o of data["bitmaps"]) {
                this.loadBitmap(o["name"], path + o["path"]);
            }
            path = data["tilemapPath"];
            for (let o of data["tilemaps"]) {
                this.loadTilemap(o["name"], path + o["path"]);
            }
        });
    }
    hasLoaded() {
        return this.loaded >= this.total;
    }
    getBitmap(name) {
        return this.bitmaps.getAsset(name);
    }
    getTilemap(name) {
        return this.tilemaps.getAsset(name);
    }
    dataLoadedUnit() {
        return this.total == 0 ? 1.0 : this.loaded / this.total;
    }
}
