export function createRng(seed) {
    let state = seed;
    // mulberry32
    const next = () => {
        let t = state += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    return {
        next,
        intRange(min, max) {
            return Math.floor(next() * (max - min)) + min;
        },
        pick(arr) {
            return arr[Math.floor(next() * arr.length)];
        },
        shuffle(arr) {
            const copy = [...arr];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(next() * (i + 1));
                const temp = copy[i];
                copy[i] = copy[j];
                copy[j] = temp;
            }
            return copy;
        },
        fork() {
            return createRng(next() * 4294967296);
        }
    };
}
//# sourceMappingURL=rng.js.map