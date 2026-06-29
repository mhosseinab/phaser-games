export class LocalLeaderboard {
    storage;
    gpgs;
    constructor(storage, gpgs) {
        this.storage = storage;
        this.gpgs = gpgs;
    }
    async submit(board, score) {
        const currentStr = await this.storage.getItem(`lb_${board}`);
        const current = currentStr ? parseInt(currentStr, 10) : 0;
        if (score > current) {
            await this.storage.setItem(`lb_${board}`, score.toString());
        }
        if (this.gpgs) {
            await this.gpgs.submitScore(board, score).catch(console.error);
        }
    }
    async best(board) {
        const val = await this.storage.getItem(`lb_${board}`);
        return val ? parseInt(val, 10) : 0;
    }
}
//# sourceMappingURL=leaderboard-local.js.map