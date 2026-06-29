import { expect, it, describe } from 'vitest';
import { FakeAnalytics } from './fake-analytics';

describe('FakeAnalytics', () => {
  it('drops events before consent', () => {
    const a = new FakeAnalytics();
    a.log('test');
    expect(a.events.length).toBe(0);
  });

  it('records events after consent', () => {
    const a = new FakeAnalytics();
    a.setConsent(true);
    a.log('test');
    expect(a.events.length).toBe(1);
    expect(a.events[0].event).toBe('test');
  });
});
