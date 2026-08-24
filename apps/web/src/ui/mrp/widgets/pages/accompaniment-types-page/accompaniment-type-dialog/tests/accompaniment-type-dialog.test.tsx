import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AccompanimentTypeFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AccompanimentTypeDialog } from '../index'
import { useAccompanimentTypeDialog } from '../use-accompaniment-type-dialog'

vi.mock('../use-accompaniment-type-dialog', () => ({
  useAccompanimentTypeDialog: vi.fn(),
}))
const useAccompanimentTypeDialogMock = vi.mocked(useAccompanimentTypeDialog)
const item = {
  type: AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' }),
  usageCount: 2,
}

describe('AccompanimentTypeDialog', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    useAccompanimentTypeDialogMock.mockReturnValue({
      actionError: null,
      errors: {},
      handleSubmit: vi.fn((event: { preventDefault: () => void }) =>
        event.preventDefault(),
      ),
      isEdit: false,
      isPending: false,
      register: vi.fn((name: string) => ({ name })),
    } as never)
  })

  it('renders the create form and delegates submission and cancellation', () => {
    const onOpenChange = vi.fn()
    render(
      <AccompanimentTypeDialog onOpenChange={onOpenChange} onSuccess={vi.fn()} open />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Novo tipo de acompanhamento' }),
    ).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Nome do tipo' })).toBeTruthy()
    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(
      useAccompanimentTypeDialogMock.mock.results[0].value.handleSubmit,
    ).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders edit and error states', () => {
    useAccompanimentTypeDialogMock.mockReturnValue({
      actionError: 'Nome já cadastrado',
      errors: { name: { message: 'Nome inválido' } },
      handleSubmit: vi.fn(),
      isEdit: true,
      isPending: false,
      register: vi.fn((name: string) => ({ name })),
    } as never)
    render(
      <AccompanimentTypeDialog
        item={item}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Editar tipo de acompanhamento' }),
    ).toBeTruthy()
    expect(screen.getByText('Nome inválido')).toBeTruthy()
    expect(screen.getByText('Nome já cadastrado')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeTruthy()
  })
})
