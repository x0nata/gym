import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DetailedErrorPanel } from './DetailedErrorPanel'
import type { AppErrorDetails } from '../../lib/errorHandling'

describe('DetailedErrorPanel', () => {
  it('renders title and message', () => {
    const error: AppErrorDetails = {
      title: 'Login Failed',
      message: 'Invalid credentials.',
    }
    render(<DetailedErrorPanel error={error} />)
    expect(screen.getByText('Login Failed')).toBeInTheDocument()
    expect(screen.getByText('Invalid credentials.')).toBeInTheDocument()
  })

  it('renders hint when provided', () => {
    const error: AppErrorDetails = {
      title: 'Error',
      message: 'Something broke',
      hint: 'Try again later',
    }
    render(<DetailedErrorPanel error={error} />)
    expect(screen.getByText('Try again later')).toBeInTheDocument()
  })

  it('renders error details when code or requestId is present', () => {
    const error: AppErrorDetails = {
      title: 'Error',
      message: 'Bad request',
      code: 'INVALID_INPUT',
      requestId: 'req-123',
    }
    render(<DetailedErrorPanel error={error} />)
    expect(screen.getByText(/Error details/i)).toBeInTheDocument()
    expect(screen.getByText(/Code: INVALID_INPUT/)).toBeInTheDocument()
    expect(screen.getByText(/Request ID: req-123/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const error: AppErrorDetails = {
      title: 'Error',
      message: 'Oops',
    }
    const { container } = render(<DetailedErrorPanel error={error} className="my-class" />)
    expect(container.firstChild).toHaveClass('my-class')
  })
})
