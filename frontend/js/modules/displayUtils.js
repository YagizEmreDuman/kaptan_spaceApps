export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function formatNumber(value, digits = 1) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('en-US', { maximumFractionDigits: digits }) : '—';
}

export function formatMonth(month, locale = 'en-US') {
  if (!/^\d{4}-\d{2}$/.test(month || '')) return '—';
  const date = new Date(`${month}-01T12:00:00Z`);
  return Number.isNaN(date.valueOf()) ? '—' : date.toLocaleDateString(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) return '—';
  const date = new Date(`${day}T12:00:00Z`);
  return Number.isNaN(date.valueOf()) ? '—' : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
