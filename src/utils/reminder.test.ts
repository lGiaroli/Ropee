import { describe, expect, it } from 'vitest';
import { DEFAULT_REMINDER_TIME, normalizeReminderTime } from '@/utils/reminder';

describe('reminder time', () => {
  it('normalizes valid hours', () => {
    expect(normalizeReminderTime('9:05')).toBe('09:05');
    expect(normalizeReminderTime('23:59')).toBe('23:59');
  });

  it('rejects incomplete and out-of-range values', () => {
    expect(normalizeReminderTime('19:')).toBe(DEFAULT_REMINDER_TIME);
    expect(normalizeReminderTime('24:00')).toBe(DEFAULT_REMINDER_TIME);
    expect(normalizeReminderTime('12:75')).toBe(DEFAULT_REMINDER_TIME);
  });
});
