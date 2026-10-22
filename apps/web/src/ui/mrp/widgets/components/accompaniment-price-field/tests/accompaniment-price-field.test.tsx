import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccompanimentPriceField, type AccompanimentPriceFieldProps } from '../index'

function renderField(overrides: Partial<AccompanimentPriceFieldProps> = {}) {
  return render(
    <AccompanimentPriceField
      accompanimentPriceError={false}
      accompanimentPriceIsSaved={false}
      accompanimentPriceLoading={false}
      accompanimentPriceSuggestion={null}
      priceDescribedBy='accompaniment-price-help'
      priceHelpVariant='all-portions'
      priceRegistration={
        {
          name: 'accompanimentPrice',
          onBlur: async () => undefined,
          onChange: async () => undefined,
          ref: () => undefined,
        } as AccompanimentPriceFieldProps['priceRegistration']
      }
      retryAccompanimentPrice={vi.fn()}
      {...overrides}
    />,
  )
}

describe('AccompanimentPriceField', () => {
  afterEach(cleanup)

  it('renders the price input with the currency prefix and the help of its owner', () => {
    renderField()

    const input = screen.getByRole('textbox', { name: 'Preço do acompanhamento' })
    expect(input.getAttribute('name')).toBe('accompanimentPrice')
    expect(input.getAttribute('aria-describedby')).toBe('accompaniment-price-help')
    expect(input.getAttribute('aria-invalid')).toBe('false')
    expect(screen.getByText('R$')).toBeTruthy()
    expect(screen.getByText(/Este preço vale para todas as porções\./)).toBeTruthy()
  })

  it.each([
    ['selected-portions', 'Este preço vale para as porções selecionadas.'],
    ['single-link', 'Este preço vale só para este vínculo.'],
    ['all-portions', 'Este preço vale para todas as porções.'],
  ] as const)('explains the %s scope of the price', (priceHelpVariant, text) => {
    renderField({ priceHelpVariant })

    expect(screen.getByText(text, { exact: false }).id).toBe('accompaniment-price-help')
    expect(screen.getAllByText(/Este preço vale/)).toHaveLength(1)
  })

  it('shows that the price is already configured instead of a suggestion', () => {
    renderField({ accompanimentPriceIsSaved: true, accompanimentPriceSuggestion: 3 })

    expect(screen.getByText('Preço já configurado.')).toBeTruthy()
    expect(screen.queryByText(/Sugestão baseada/)).toBeNull()
  })

  it.each([
    ['resale-single', 'Sugestão baseada no preço de revenda único.'],
    ['resale-by-brand', 'Sugestão baseada no preço de revenda da marca principal.'],
  ] as const)('explains a %s suggestion', (mode, text) => {
    renderField({
      accompanimentPriceSuggestion: 3,
      accompanimentPriceSuggestionMode: mode,
    })

    expect(screen.getByText(text)).toBeTruthy()
  })

  it('announces loading, validation and read failure with a retry', () => {
    const retryAccompanimentPrice = vi.fn()
    renderField({
      accompanimentPriceError: true,
      accompanimentPriceLoading: true,
      priceError: 'Informe um preço válido.',
      retryAccompanimentPrice,
    })

    expect(screen.getByText('Carregando preço do acompanhamento…')).toBeTruthy()
    expect(screen.getByText('Informe um preço válido.').getAttribute('id')).toBe(
      'accompaniment-price-validation-error',
    )
    expect(
      screen
        .getByRole('textbox', { name: 'Preço do acompanhamento' })
        .getAttribute('aria-invalid'),
    ).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(
      screen.getByText('Não foi possível carregar o preço do acompanhamento.'),
    ).toBeTruthy()
    expect(retryAccompanimentPrice).toHaveBeenCalledTimes(1)
  })
})
