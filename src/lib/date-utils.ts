export type DatePeriod = 'DAY' | 'MONTH' | 'YEAR';

export function formatDate(referenceDate: Date | string, period: DatePeriod): string {
  const date = new Date(referenceDate);

  switch (period) {
    case 'DAY':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'MONTH':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
    case 'YEAR':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
      });
    default:
      return date.toLocaleDateString('en-US');
  }
}
