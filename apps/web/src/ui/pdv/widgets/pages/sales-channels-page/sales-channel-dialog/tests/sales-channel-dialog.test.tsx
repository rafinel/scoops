import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SalesChannelDialog } from '..'
import { useSalesChannelDialog } from '../use-sales-channel-dialog'

import { makeSalesChannel } from '../../tests/sales-channel-test-fixtures'

vi.mock('../use-sales-channel-dialog', () => ({ useSalesChannelDialog: vi.fn() }))

const useSalesChannelDialogMock = vi.mocked(useSalesChannelDialog)
const channel = makeSalesChannel()

describe('SalesChannelDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useSalesChannelDialogMock.mockReturnValue({
      actionError: null,
      adjustedExample: 20,
      currentStatus: 'active',
      errors: {},
      formatCurrency: () => 'R$ 20,00',
      handleStatusChange: vi.fn(),
      handleSubmit: vi.fn((event: { preventDefault: () => void }) =>
        event.preventDefault(),
      ),
      isPending: false,
      register: vi.fn((name: string) => ({ name })),
    } as never)
  })

  it('renders the add form with status, preview and recoverable cancel', () => {
    const onOpenChange = vi.fn()
    render(
      <SalesChannelDialog
        mode='add'
        onOpenChange={onOpenChange}
        onRequestStatusChange={vi.fn()}
        onSuccess={vi.fn()}
        open
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Novo canal' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Nome do canal' })).toBeTruthy()
    expect(
      screen
        .getByRole('switch', { name: 'Status do canal' })
        .getAttribute('aria-checked'),
    ).toBe('true')
    expect(screen.getByText('R$ 20 → R$ 20,00')).toBeTruthy()
    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(
      useSalesChannelDialogMock.mock.results[0].value.handleSubmit,
    ).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders edit values, field errors and pending duplicate guard', () => {
    useSalesChannelDialogMock.mockReturnValue({
      actionError: 'Nome já cadastrado',
      adjustedExample: 22.4,
      currentStatus: 'active',
      errors: {
        name: { message: 'Informe um nome.' },
        percentage: { message: 'Informe uma porcentagem válida.' },
      },
      formatCurrency: () => 'R$ 22,40',
      handleStatusChange: vi.fn(),
      handleSubmit: vi.fn(),
      isPending: true,
      register: vi.fn((name: string) => ({
        name,
        value: name === 'name' ? channel.name : '+12,00',
      })),
    } as never)
    render(
      <SalesChannelDialog
        channel={channel}
        mode='edit'
        onOpenChange={vi.fn()}
        onRequestStatusChange={vi.fn()}
        onSuccess={vi.fn()}
        open
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Editar canal' })).toBeTruthy()
    expect(screen.getByText('Informe um nome.')).toBeTruthy()
    expect(screen.getByText('Nome já cadastrado')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Salvando…' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('switch', { name: 'Status do canal' }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
