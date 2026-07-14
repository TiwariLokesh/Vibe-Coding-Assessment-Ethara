export function getPageCount(total, pageSize) {
  if (!total || !pageSize) return 1
  return Math.max(Math.ceil(total / pageSize), 1)
}
