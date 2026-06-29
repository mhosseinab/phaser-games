export interface Leaderboard {
  submit(board: string, score: number): Promise<void>;
  best(board: string): Promise<number>;
}
