export class MemoryStorage {
    data = new Map();
    async getItem(key) {
        return this.data.get(key) || null;
    }
    async setItem(key, value) {
        this.data.set(key, value);
    }
    async remove(key) {
        this.data.delete(key);
    }
}
//# sourceMappingURL=memory-storage.js.map