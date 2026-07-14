export const formatSeconds = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

export const formatMinutes = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return '<1 min';
  return `${minutes} min`;
};

export const percent = (value: number, total: number) => {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, value / total));
};
