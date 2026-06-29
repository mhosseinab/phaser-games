export class Pool {
    factory;
    active = new Set();
    inactive = [];
    constructor(factory) {
        this.factory = factory;
    }
    acquire() {
        let item = this.inactive.pop();
        if (!item) {
            item = this.factory();
        }
        this.active.add(item);
        return item;
    }
    release(item) {
        if (this.active.has(item)) {
            this.active.delete(item);
            this.inactive.push(item);
        }
    }
    getActive() {
        return Array.from(this.active);
    }
}
//# sourceMappingURL=pool.js.map