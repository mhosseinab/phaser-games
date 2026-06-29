import { Preferences } from '@capacitor/preferences';
export class CapacitorStorage {
    async getItem(key) {
        const { value } = await Preferences.get({ key });
        return value;
    }
    async setItem(key, value) {
        await Preferences.set({ key, value });
    }
    async remove(key) {
        await Preferences.remove({ key });
    }
}
//# sourceMappingURL=storage-capacitor.js.map