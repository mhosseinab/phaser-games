import { Leaderboard } from '../ports/leaderboard';
import { Storage } from '../ports/storage';

export interface GpgsProvider {
  submitScore(board: string, score: number): Promise<void>;
  showLeaderboard(board: string): Promise<void>;
}

export class LocalLeaderboard implements Leaderboard {
  constructor(private storage: Storage, private gpgs?: GpgsProvider) {}

  async submit(board: string, score: number): Promise<void> {
    const currentStr = await this.storage.getItem(`lb_${board}`);
    const current = currentStr ? parseInt(currentStr, 10) : 0;
    
    if (score > current) {
      await this.storage.setItem(`lb_${board}`, score.toString());
    }

    if (this.gpgs) {
      await this.gpgs.submitScore(board, score).catch(console.error);
    }
  }

  async best(board: string): Promise<number> {
    const val = await this.storage.getItem(`lb_${board}`);
    return val ? parseInt(val, 10) : 0;
  }
}
