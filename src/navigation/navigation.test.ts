import { describe, expect, it } from 'vitest';
import { popRoute, pushRoute, RouteState } from '@/navigation/navigation';

describe('navigation history', () => {
  it('returns from a detail to its root tab', () => {
    const routines: RouteState[] = [{ name: 'home' }, { name: 'routines' }];
    const withDetail = pushRoute(routines, { name: 'routineDetail', routineId: 'initial-6x20' });

    expect(popRoute(withDetail).at(-1)?.name).toBe('routines');
  });

  it('replaces a finished timer with its summary', () => {
    const timer: RouteState[] = [{ name: 'home' }, { name: 'timer', routineId: 'initial-6x20' }];
    const summary = pushRoute(timer, { name: 'summary', routineId: 'initial-6x20' });

    expect(summary.some((route) => route.name === 'timer')).toBe(false);
    expect(popRoute(summary).at(-1)?.name).toBe('home');
  });

  it('makes each tab a predictable root', () => {
    const nested: RouteState[] = [{ name: 'home' }, { name: 'profile' }, { name: 'settings' }];

    expect(pushRoute(nested, { name: 'stats' })).toEqual([{ name: 'home' }, { name: 'stats' }]);
  });
});
