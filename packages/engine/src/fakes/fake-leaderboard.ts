import { Leaderboard } from '../ports/leaderboard';

export class FakeLeaderboard implements Leaderboard {
  private scores = new Map<string, number>();
  async submit(board: string, score: number): Promise<void> {
    const current = this.scores.get(board) || 0;
    if (score > current) {
      this.scores.set(board, score);
    }
  }
  async best(board: string): Promise<number> {
    return this.scores.get(board) || 0;
  }
}
