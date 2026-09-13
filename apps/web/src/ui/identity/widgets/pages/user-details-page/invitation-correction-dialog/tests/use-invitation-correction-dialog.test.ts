import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useInvitationCorrectionDialog } from '../use-invitation-correction-dialog'

describe('useInvitationCorrectionDialog', () => {
  afterEach(cleanup)

  it('blocks submission and exposes the form errors for invalid values', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useInvitationCorrectionDialog({
        email: 'ana@example.com',
        name: 'Ana Operator',
        onSubmit,
      }),
    )
    result.current.register('name')
    result.current.register('email')

    act(() => {
      result.current.reset({ name: '   ', email: 'not-an-email' })
    })

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
        persist: vi.fn(),
      } as never)
    })
    expect(result.current.getFieldState('name').error?.message).toBe(
      'Informe o nome completo.',
    )
    expect(result.current.getFieldState('email').error?.message).toBe(
      'Informe um e-mail válido.',
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('trims the form values before passing the corrected invitation to the page', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useInvitationCorrectionDialog({
        email: 'ana@example.com',
        name: 'Ana Operator',
        onSubmit,
      }),
    )

    act(() => {
      result.current.reset({ name: '  Beatriz Lima  ', email: '  beatriz@example.com  ' })
    })

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
        persist: vi.fn(),
      } as never)
    })

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'beatriz@example.com',
      name: 'Beatriz Lima',
    })
  })

  it('resets the form when the invitation details change', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const initialProps = {
      email: 'ana@example.com',
      name: 'Ana Operator',
      onSubmit,
    }
    const { result, rerender } = renderHook(
      (props: typeof initialProps) => useInvitationCorrectionDialog(props),
      { initialProps },
    )

    act(() => {
      result.current.reset({ name: 'Altered Name', email: initialProps.email })
    })
    rerender({ ...initialProps, email: 'bia@example.com', name: 'Beatriz Lima' })

    await waitFor(() => {
      expect(result.current.getValues()).toMatchObject({
        email: 'bia@example.com',
        name: 'Beatriz Lima',
      })
    })
  })
})
