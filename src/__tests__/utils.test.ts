import { formatCurrency, formatDate, getInitials, cn } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'not-applied', 'applied')).toBe('base applied')
  })

  it('deduplicates Tailwind classes', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })
})

describe('formatCurrency', () => {
  it('formats PLN amounts', () => {
    expect(formatCurrency(25)).toContain('25')
    expect(formatCurrency(25)).toContain('zł')
  })

  it('formats decimal amounts', () => {
    expect(formatCurrency(25.5)).toContain('25,50')
  })
})

describe('getInitials', () => {
  it('returns two-letter initials', () => {
    expect(getInitials('Jane Doe')).toBe('JD')
  })

  it('handles single name', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('handles three-part names', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })
})

describe('formatDate', () => {
  it('returns a formatted date string', () => {
    const result = formatDate('2024-01-15T10:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
