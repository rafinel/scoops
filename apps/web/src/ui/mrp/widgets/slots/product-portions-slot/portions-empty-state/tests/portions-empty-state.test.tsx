import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { PortionsEmptyState, type PortionsEmptyStateProps } from '../index'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))

function renderState(overrides: Partial<PortionsEmptyStateProps> = {}) {
  const props: PortionsEmptyStateProps = {
    canManage: true,
    inactiveNoticeId: 'inactive-notice',
    isActive: true,
    onClearSearch: vi.fn(),
    onLink: vi.fn(),
    variant: 'no-link',
    ...overrides,
  }
  render(<PortionsEmptyState {...props} />)
  return props
}

describe('PortionsEmptyState', () => {
  afterEach(cleanup)

  it('offers Managers to link Portions when none is linked', () => {
    const { onLink } = renderState()

    expect(screen.getByRole('heading', { name: 'Nenhuma porção vinculada' })).toBeTruthy()
    expect(
      screen.getByText(
        'Vincule porções para que este acompanhamento apareça nelas no PDV. Você pode escolher várias de uma vez.',
      ),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Vincular porções' }))

    expect(onLink).toHaveBeenCalledTimes(1)
  })

  it('disables the call to action for an inactive Accompaniment and describes it by the notice', () => {
    renderState({ isActive: false })

    const button = screen.getByRole('button', { name: 'Vincular porções' })
    expect(button.hasAttribute('disabled')).toBe(true)
    expect(button.getAttribute('aria-describedby')).toBe('inactive-notice')
  })

  it('guides Managers to register a Portion when none exists', () => {
    renderState({ variant: 'no-portion-registered' })

    expect(
      screen.getByRole('heading', { name: 'Nenhuma porção cadastrada' }),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Cadastre um produto com a categoria Porção para vincular este acompanhamento.',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Cadastrar produto' }).getAttribute('href'),
    ).toBe(ROUTES.newProduct)
    expect(screen.queryByRole('button', { name: 'Vincular porções' })).toBeNull()
  })

  it('explains a global without rows and has no Link call to action for Managers', () => {
    renderState({ variant: 'global-empty' })

    expect(
      screen.getByRole('heading', { name: 'Nenhuma porção com este acompanhamento' }),
    ).toBeTruthy()
    expect(
      screen.getByText('Ele continua global: novas porções o receberão.'),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Vincular porções' })).toBeNull()
  })

  it('shows the search state with the searched text and clears the search', () => {
    const { onClearSearch } = renderState({ search: 'pistache', variant: 'search-empty' })

    expect(
      screen.getByRole('heading', { name: 'Nenhuma porção encontrada' }),
    ).toBeTruthy()
    expect(screen.getByText('Nenhuma porção corresponde a “pistache”.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }))

    expect(onClearSearch).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Vincular porções' })).toBeNull()
  })

  it.each(['no-link', 'no-portion-registered'] as const)(
    'shows Operators the ordinary copy without actions for %s',
    (variant) => {
      renderState({ canManage: false, variant })

      expect(
        screen.getByRole('heading', { name: 'Nenhuma porção vinculada' }),
      ).toBeTruthy()
      expect(
        screen.getByText('Este acompanhamento ainda não aparece em nenhuma porção.'),
      ).toBeTruthy()
      expect(screen.queryByRole('button')).toBeNull()
      expect(screen.queryByRole('link')).toBeNull()
    },
  )

  it('shows Operators the global empty copy without actions', () => {
    renderState({ canManage: false, variant: 'global-empty' })

    expect(
      screen.getByRole('heading', { name: 'Nenhuma porção com este acompanhamento' }),
    ).toBeTruthy()
    expect(
      screen.getByText('Ele continua global: novas porções o receberão.'),
    ).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('announces every state politely', () => {
    renderState()

    expect(screen.getByRole('status')).toBeTruthy()
  })
  it.each(['no-link', 'no-portion-registered', 'global-empty'] as const)(
    'draws the %s block with the soft border token',
    (variant) => {
      renderState({ variant })

      expect(screen.getByRole('status').className).toContain(
        '!border-[color:var(--border-soft)]',
      )
    },
  )

  it('draws the search block with the soft border token', () => {
    renderState({ search: 'pistache', variant: 'search-empty' })

    expect(screen.getByRole('status').className).toContain(
      '!border-[color:var(--border-soft)]',
    )
  })
})
