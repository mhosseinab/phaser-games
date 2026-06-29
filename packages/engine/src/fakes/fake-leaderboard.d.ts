import { Leaderboard } from '../ports/leaderboard';
export declare class FakeLeaderboard implements Leaderboard {
    private scores;
    submit(board: string, score: number): Promise<void>;
    best(board: string): Promise<number>;
}
//# sourceMappingURL=fake-leaderboard.d.ts.map