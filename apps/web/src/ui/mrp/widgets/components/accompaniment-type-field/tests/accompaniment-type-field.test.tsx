import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccompanimentTypeFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { AccompanimentTypeField, type AccompanimentTypeFieldProps } from '../index'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))

const type = AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' })

function renderField(overrides: Partial<AccompanimentTypeFieldProps> = {}) {
  return render(
    <AccompanimentTypeField
      onTypeChange={vi.fn()}
      selectedTypeName={type.name}
      typeId={type.id}
      types={[{ type, usageCount: 0 }]}
      typesError={false}
      typesLoading={false}
      {...overrides}
    />,
  )
}

describe('AccompanimentTypeField', () => {
  afterEach(cleanup)

  it('shows the selected type name instead of its identifier and links to type management', () => {
    renderField()

    const selector = screen.getByRole('combobox', { name: 'Tipo' })
    expect(selector.textContent).toContain('Cobertura')
    expect(selector.textContent).not.toContain('type-1')
    expect(
      screen.getByRole('link', { name: 'Gerenciar tipos →' }).getAttribute('href'),
    ).toBe(ROUTES.accompanimentTypes)
  })

  it('shows the placeholder while nothing is selected', () => {
    renderField({ selectedTypeName: undefined, typeId: '' })

    expect(screen.getByRole('combobox', { name: 'Tipo' }).textContent).toContain(
      'Selecione um tipo',
    )
  })

  it('shows a loading label for a selected type whose name is not loaded yet', () => {
    renderField({ selectedTypeName: undefined })

    expect(screen.getByRole('combobox', { name: 'Tipo' }).textContent).toContain(
      'Carregando tipo…',
    )
  })

  it('announces loading, load failure and validation feedback', () => {
    renderField({ typeError: 'Selecione um tipo.', typesError: true, typesLoading: true })

    expect(screen.getByText('Carregando tipos…')).toBeTruthy()
    expect(screen.getByText('Não foi possível carregar os tipos.')).toBeTruthy()
    expect(screen.getByText('Selecione um tipo.')).toBeTruthy()
  })

  it('renders no feedback when everything is loaded and valid', () => {
    renderField()

    expect(screen.queryByText('Carregando tipos…')).toBeNull()
    expect(screen.queryByText('Não foi possível carregar os tipos.')).toBeNull()
  })
})
