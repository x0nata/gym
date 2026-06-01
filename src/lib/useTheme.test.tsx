import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from './useTheme'

function TestComponent() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  )
}

describe('useTheme', () => {
  it('defaults to light theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('toggles between light and dark', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    fireEvent.click(screen.getByText('Toggle'))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    fireEvent.click(screen.getByText('Toggle'))
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('persists theme to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    fireEvent.click(screen.getByText('Toggle'))
    expect(window.localStorage.getItem('theme')).toBe('dark')
  })
})
