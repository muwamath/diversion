import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useExperimentConfig } from './useExperimentConfig'
import { gyrograph } from '../experiments/gyrograph'

function Harness() {
  const [config, updateConfig] = useExperimentConfig(gyrograph)
  const location = useLocation()
  return (
    <div>
      <span data-testid="r-value">{config.R}</span>
      <span data-testid="search">{location.search}</span>
      <button onClick={() => updateConfig({ R: 250 })}>bump R</button>
    </div>
  )
}

describe('useExperimentConfig', () => {
  it('updates config without leaking an experiment query param', () => {
    render(
      <MemoryRouter initialEntries={['/gyrograph/edit?R=200&r=60']}>
        <Harness />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('r-value').textContent).toBe('200')

    act(() => {
      screen.getByText('bump R').click()
    })

    expect(screen.getByTestId('r-value').textContent).toBe('250')

    const search = screen.getByTestId('search').textContent ?? ''
    const params = new URLSearchParams(search)
    expect(params.get('R')).toBe('250')
    expect(params.has('experiment')).toBe(false)
  })
})
