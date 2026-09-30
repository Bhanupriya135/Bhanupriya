export function formatCurrency(amount, decimals = 0) {
  if (amount === null || amount === undefined) return '₹0'
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function formatLakhs(amount) {
  if (!amount) return '₹0'
  const lakhs = amount / 100000
  if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(2)} Cr`
  return `₹${lakhs.toFixed(2)} L`
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function formatFileSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined) return '-'
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
