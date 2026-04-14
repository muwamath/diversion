import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ShareBar from './ShareBar'

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ShareBar slug="gyrograph" />
    </MemoryRouter>,
  )
}

describe('ShareBar', () => {
  it('constructs the fullscreen link from slug and current search params', () => {
    renderAt('/gyrograph/edit?R=200&r=60')
    const link = screen.getByRole('link', { name: /Open fullscreen/ })
    const href = link.getAttribute('href') ?? ''
    expect(href).toMatch(/\/gyrograph\/live\?R=200&r=60$/)
  })

  it('reflects the current window location in the readonly input', () => {
    renderAt('/gyrograph/edit?R=200&r=60')
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.readOnly).toBe(true)
    expect(input.value).toBe(window.location.href)
  })

  it('updates the fullscreen link when search params change', () => {
    renderAt('/gyrograph/edit?R=180&r=55')
    const link = screen.getByRole('link', { name: /Open fullscreen/ })
    const href = link.getAttribute('href') ?? ''
    expect(href).toMatch(/\/gyrograph\/live\?R=180&r=55$/)
  })
})
