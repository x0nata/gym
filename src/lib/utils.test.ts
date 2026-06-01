import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  getMembershipStatusColor,
  getMembershipStatusLabel,
} from './utils'

describe('utils', () => {
  describe('formatDateTime', () => {
    it('formats a timestamp to MMM d, h:mm a', () => {
      const date = new Date('2024-06-15T14:30:00')
      expect(formatDateTime(date)).toMatch(/Jun 15, \d{1,2}:30/)
    })
  })

  describe('formatDate', () => {
    it('formats a timestamp to MMM d, yyyy', () => {
      const date = new Date('2024-06-15')
      expect(formatDate(date)).toBe('Jun 15, 2024')
    })
  })

  describe('formatCurrency', () => {
    it('formats a number to USD currency', () => {
      expect(formatCurrency(49.99)).toBe('$49.99')
      expect(formatCurrency(1000)).toBe('$1,000.00')
    })
  })

  describe('getMembershipStatusColor', () => {
    it('returns active for dates far in the future', () => {
      const future = Date.now() + 30 * 24 * 60 * 60 * 1000
      expect(getMembershipStatusColor(future)).toBe('active')
    })

    it('returns warning for dates within 7 days', () => {
      const soon = Date.now() + 3 * 24 * 60 * 60 * 1000
      expect(getMembershipStatusColor(soon)).toBe('warning')
    })

    it('returns expired for past dates', () => {
      const past = Date.now() - 24 * 60 * 60 * 1000
      expect(getMembershipStatusColor(past)).toBe('expired')
    })
  })

  describe('getMembershipStatusLabel', () => {
    it('shows days left for active memberships', () => {
      const future = Date.now() + 15 * 24 * 60 * 60 * 1000
      expect(getMembershipStatusLabel(future)).toMatch(/Active \(\d+ days left\)/)
    })

    it('shows expires in X days for soon-to-expire', () => {
      const soon = Date.now() + 3 * 24 * 60 * 60 * 1000
      expect(getMembershipStatusLabel(soon)).toBe('Expires in 3 days')
    })

    it('shows expired for past dates', () => {
      const past = Date.now() - 24 * 60 * 60 * 1000
      expect(getMembershipStatusLabel(past)).toBe('Expired')
    })
  })
})
