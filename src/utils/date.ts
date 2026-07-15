import { startOfWeek } from 'date-fns';

const asDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

export const localDateKey = (value: Date | string) => {
  const date = asDate(value);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const localWeekKey = (value: Date | string) =>
  localDateKey(startOfWeek(asDate(value), { weekStartsOn: 1 }));
