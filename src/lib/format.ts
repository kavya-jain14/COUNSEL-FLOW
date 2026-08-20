export function formatINR(value: number): string {
  if (value >= 100000) {
    const lakh = value / 100000
    const text = Number.isInteger(lakh) ? lakh.toFixed(0) : lakh.toFixed(2).replace(/0$/, '')
    return `₹${text} lakh`
  }
  return `₹${value.toLocaleString('en-IN')}`
}

export function formatINRExact(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

export function formatKm(value: number): string {
  if (value === 0) return 'Same city'
  return `${value.toLocaleString('en-IN')} km`
}

export function formatRank(value: number): string {
  return value.toLocaleString('en-IN')
}
