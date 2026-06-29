import { Leaderboard } from '../ports/leaderboard';
import { Storage } from '../ports/storage';
export interface GpgsProvider {
    submitScore(board: string, score: number): Promise<void>;
    showLeaderboard(board: string): Promise<void>;
}
export declare class LocalLeaderboard implements Leaderboard {
    private storage;
    private gpgs?;
    constructor(storage: Storage, gpgs?: GpgsProvider | undefined);
    submit(board: string, score: number): Promise<void>;
    best(board: string): Promise<number>;
}
//# sourceMappingURL=leaderboard-local.d.ts.map