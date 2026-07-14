export function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0))
}

export function toTitleCase(value) {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
