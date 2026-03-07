import dayjs from 'dayjs';

export function formatDateTime(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '-';
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      if (Number.isFinite(n)) {
        const ms = n < 1e12 ? n * 1000 : n;
        const d = dayjs(ms);
        return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : '-';
      }
    }
    const d = dayjs(trimmed);
    return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : '-';
  }

  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = dayjs(ms);
    return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : '-';
  }

  const d = dayjs(value);
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : '-';
}
