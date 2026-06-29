export class FakeLeaderboard {
    scores = new Map();
    async submit(board, score) {
        const current = this.scores.get(board) || 0;
        if (score > current) {
            this.scores.set(board, score);
        }
    }
    async best(board) {
        return this.scores.get(board) || 0;
    }
}
//# sourceMappingURL=fake-leaderboard.js.map