import { describe, it, expect } from 'vitest'
import { toDisplayError } from './errorHandling'

describe('errorHandling', () => {
  it('returns fallback message for unknown errors', () => {
    const result = toDisplayError(null, {
      title: 'Test Error',
      fallbackMessage: 'Something went wrong.',
    })
    expect(result.title).toBe('Test Error')
    expect(result.message).toBe('Something went wrong.')
  })

  it('extracts message from string error', () => {
    const result = toDisplayError('Connection failed', {
      title: 'Network Error',
      fallbackMessage: 'Fallback',
    })
    expect(result.message).toBe('Connection failed')
  })

  it('extracts code and message from ConvexError payload', () => {
    const error = new Error('ConvexError: {"code":"INVALID_EMAIL","message":"Bad email"}')
    const result = toDisplayError(error, {
      title: 'Validation Error',
      fallbackMessage: 'Fallback',
    })
    expect(result.code).toBe('INVALID_EMAIL')
    expect(result.message).toBe('Bad email')
    expect(result.hint).toBe('Enter a valid email address.')
  })

  it('includes requestId when present', () => {
    const error = 'Server crashed [Request ID: abc-123]'
    const result = toDisplayError(error, {
      title: 'Crash',
      fallbackMessage: 'Fallback',
    })
    expect(result.requestId).toBe('abc-123')
  })

  it('extracts from object with data property', () => {
    const error = { message: 'Wrapper', data: { code: 'WEAK_PASSWORD', message: 'Too short' } }
    const result = toDisplayError(error, {
      title: 'Auth Error',
      fallbackMessage: 'Fallback',
    })
    expect(result.code).toBe('WEAK_PASSWORD')
    expect(result.message).toBe('Too short')
    expect(result.hint).toBe('Use a longer password with at least 8 characters.')
  })
})
