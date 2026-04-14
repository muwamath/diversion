import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from './router'

function UrlProbe() {
  const location = useLocation()
  return (
    <span data-testid="url">
      {location.pathname}
      {location.search}
    </span>
  )
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AppRoutes />
      <UrlProbe />
    </MemoryRouter>,
  )
}

describe('AppRoutes URL matrix', () => {
  it('redirects / to /gyrograph/edit', () => {
    renderAt('/')
    expect(screen.getByTestId('url').textContent).toBe('/gyrograph/edit')
    expect(screen.getByRole('button', { name: 'Gyrograph' })).toBeInTheDocument()
  })

  it('redirects / with query params to /gyrograph/edit preserving them', () => {
    renderAt('/?R=180')
    expect(screen.getByTestId('url').textContent).toBe('/gyrograph/edit?R=180')
    expect(screen.getByRole('spinbutton', { name: /R \(outer\)/ })).toHaveValue(180)
  })

  it('redirects bare /gyrograph to /gyrograph/edit', () => {
    renderAt('/gyrograph')
    expect(screen.getByTestId('url').textContent).toBe('/gyrograph/edit')
  })

  it('redirects /gyrograph?R=180 to /gyrograph/edit?R=180', () => {
    renderAt('/gyrograph?R=180')
    expect(screen.getByTestId('url').textContent).toBe('/gyrograph/edit?R=180')
    expect(screen.getByRole('spinbutton', { name: /R \(outer\)/ })).toHaveValue(180)
  })

  it('renders the editor at /gyrograph/edit?R=180', () => {
    renderAt('/gyrograph/edit?R=180')
    expect(screen.getByTestId('url').textContent).toBe('/gyrograph/edit?R=180')
    expect(screen.getByRole('spinbutton', { name: /R \(outer\)/ })).toHaveValue(180)
    expect(screen.getByRole('link', { name: /Open fullscreen/ })).toBeInTheDocument()
  })

  it('renders the live page at /gyrograph/live?R=180 without the experiment sidebar', () => {
    renderAt('/gyrograph/live?R=180')
    expect(screen.getByTestId('url').textContent).toBe('/gyrograph/live?R=180')
    expect(screen.queryByRole('button', { name: 'Gyrograph' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Open fullscreen/ })).not.toBeInTheDocument()
  })

  it('shows an unknown-experiment message for /nonsense/edit', () => {
    renderAt('/nonsense/edit')
    expect(screen.getByTestId('url').textContent).toBe('/nonsense/edit')
    const banner = screen.getByText(/Unknown experiment:/)
    expect(banner).toBeInTheDocument()
    expect(banner.textContent).toContain('nonsense')
  })
})
