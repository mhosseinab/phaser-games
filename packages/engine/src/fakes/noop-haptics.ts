import { Haptics } from '../ports/haptics';

export class NoopHaptics implements Haptics {
  impact(kind: string): void {}
}
