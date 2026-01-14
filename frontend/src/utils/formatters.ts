import { format, formatDistance } from 'date-fns';

export function formatTimestamp(timestamp: number): string {
  return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
}

export function formatRelativeTime(timestamp: number): string {
  return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
}

export function formatMetricValue(value: any): string {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

export function formatNumber(value: any): string {
  if (value === undefined || value === null) return '0';
  if (typeof value === 'number') return value.toLocaleString();
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString() : '0';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}




