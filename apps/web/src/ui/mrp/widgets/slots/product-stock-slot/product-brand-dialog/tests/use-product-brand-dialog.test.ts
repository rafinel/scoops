import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BrandFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { useRegisterProductBrandAction } from '@/ui/mrp/hooks/use-register-product-brand-action'
import { useUpdateProductBrandAction } from '@/ui/mrp/hooks/use-update-product-brand-action'
import { showErrorToast } from '@/ui/shared/notifications'

import { useProductBrandDialog } from '../use-product-brand-dialog'

vi.mock('@/ui/mrp/hooks/use-register-product-brand-action', () => ({
  useRegisterProductBrandAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-update-product-brand-action', () => ({
  useUpdateProductBrandAction: vi.fn(),
}))
vi.mock('@/ui/shared/notifications', () => ({ showErrorToast: vi.fn() }))

const useRegisterProductBrandActionMock = vi.mocked(useRegisterProductBrandAction)
const useUpdateProductBrandActionMock = vi.mocked(useUpdateProductBrandAction)
const showErrorToastMock = vi.mocked(showErrorToast)
type ProductBrandDialogHook = ReturnType<typeof useProductBrandDialog>

describe('useProductBrandDialog', () => {
  const baseProps = {
    onOpenChange: vi.fn(),
    onSuccess: vi.fn(),
    open: true,
    productId: 'product-1',
    productName: 'Polpa',
    unit: 'kg' as const,
  }

  function createBrandStock(overrides: Parameters<typeof BrandFaker.fake>[0]) {
    const brand = BrandFaker.fake({ productId: 'product-1', ...overrides })
    return {
      brand,
      stockQuantity: 10,
      unitPrice: brand.packagePrice / brand.packageQuantity,
    }
  }

  async function changeField(
    register: ProductBrandDialogHook['register'],
    name: 'name' | 'packageQuantity' | 'packageValue' | 'initialQuantity',
    value: string,
  ): Promise<void> {
    const input = document.createElement('input')
    const registration = register(name)
    input.name = registration.name
    document.body.append(input)
    registration.ref(input)
    await act(async () => {
      input.value = value
      await registration.onChange({ target: input, type: 'change' })
    })
    input.remove()
  }

  async function submit(result: { current: ProductBrandDialogHook }) {
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as never)
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRegisterProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerProductBrand: vi.fn().mockResolvedValue(undefined),
    })
    useUpdateProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      updateProductBrand: vi.fn().mockResolvedValue(undefined),
    })
  })

  afterEach(cleanup)

  it('returns add defaults and calculates the unit price from watched values', async () => {
    const { result } = renderHook(() =>
      useProductBrandDialog({
        ...baseProps,
        variant: 'add',
      }),
    )

    expect(result.current).toMatchObject({
      actionError: null,
      errors: {},
      isPending: false,
      packageQuantity: '1',
      packageValue: '0',
      brandUnit: 'kg',
      unitPrice: 0,
    })
    expect(result.current.register('name').name).toBe('name')

    await changeField(result.current.register, 'packageValue', '12')
    await changeField(result.current.register, 'packageQuantity', '3')
    await waitFor(() => expect(result.current.unitPrice).toBe(4))

    await changeField(result.current.register, 'packageQuantity', '0')
    await waitFor(() => expect(result.current.unitPrice).toBe(0))
    await changeField(result.current.register, 'packageValue', 'not-a-number')
    await waitFor(() => expect(result.current.unitPrice).toBe(0))
  })

  it('returns edit defaults and resets when opening or changing the brand', async () => {
    const firstBrand = createBrandStock({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Frooty',
      packagePrice: 8,
      packageQuantity: 2,
      unit: 'g',
    })
    const secondBrand = createBrandStock({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Outra marca',
      packagePrice: 15,
      packageQuantity: 3,
      unit: 'ml',
    })
    const initialProps = {
      ...baseProps,
      brand: firstBrand,
      open: false,
      variant: 'edit' as const,
    }
    const { result, rerender } = renderHook(
      (props: typeof initialProps) => useProductBrandDialog(props),
      { initialProps },
    )

    expect(result.current).toMatchObject({
      packageQuantity: '2',
      packageValue: '8',
      brandUnit: 'g',
      unitPrice: 4,
    })
    await changeField(result.current.register, 'name', 'Alterada')

    rerender({ ...initialProps, open: true })
    await waitFor(() => {
      expect(result.current).toMatchObject({
        packageQuantity: '2',
        packageValue: '8',
        brandUnit: 'g',
      })
    })

    rerender({ ...initialProps, brand: secondBrand, open: true })
    await waitFor(() => {
      expect(result.current).toMatchObject({
        packageQuantity: '3',
        packageValue: '15',
        brandUnit: 'ml',
        unitPrice: 5,
      })
    })
  })

  it('changes the unit and submits an add payload with numeric values', async () => {
    const registerProductBrand = vi.fn().mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    const onSuccess = vi.fn()
    useRegisterProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerProductBrand,
    })
    const { result } = renderHook(() =>
      useProductBrandDialog({
        ...baseProps,
        onOpenChange,
        onSuccess,
        variant: 'add',
      }),
    )

    await changeField(result.current.register, 'name', '  Frooty  ')
    await changeField(result.current.register, 'packageQuantity', '2')
    await changeField(result.current.register, 'packageValue', '8')
    await changeField(result.current.register, 'initialQuantity', '10')
    act(() => result.current.setUnit('ml'))

    await waitFor(() => {
      expect(result.current).toMatchObject({ brandUnit: 'ml', unitPrice: 4 })
    })
    await submit(result)

    expect(registerProductBrand).toHaveBeenCalledWith({
      name: 'Frooty',
      unit: 'ml',
      packageQuantity: 2,
      packageValue: 8,
      initialQuantity: 10,
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('submits an edit payload with the current brand id and omits initial stock', async () => {
    const updateProductBrand = vi.fn().mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    const onSuccess = vi.fn()
    const brand = createBrandStock({
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Frooty',
      packagePrice: 8,
      packageQuantity: 2,
      unit: 'kg',
    })
    useUpdateProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      updateProductBrand,
    })
    const { result } = renderHook(() =>
      useProductBrandDialog({
        ...baseProps,
        brand,
        onOpenChange,
        onSuccess,
        variant: 'edit',
      }),
    )

    await changeField(result.current.register, 'name', '  Frooty Premium ')
    await changeField(result.current.register, 'packageQuantity', '4')
    await changeField(result.current.register, 'packageValue', '18')
    act(() => result.current.setUnit('l'))
    await submit(result)

    expect(updateProductBrand).toHaveBeenCalledWith({
      brandId: brand.brand.id,
      name: 'Frooty Premium',
      unit: 'l',
      packageQuantity: 4,
      packageValue: 18,
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('blocks open changes while either action is pending', () => {
    const onOpenChange = vi.fn()
    useRegisterProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: true,
      registerProductBrand: vi.fn(),
    })
    useUpdateProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      updateProductBrand: vi.fn(),
    })
    const { result, rerender } = renderHook(() =>
      useProductBrandDialog({ ...baseProps, onOpenChange, variant: 'add' }),
    )

    expect(result.current.isPending).toBe(true)
    act(() => result.current.handleOpenChange(false))
    expect(onOpenChange).not.toHaveBeenCalled()

    useRegisterProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerProductBrand: vi.fn(),
    })
    useUpdateProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: true,
      updateProductBrand: vi.fn(),
    })
    rerender()
    expect(result.current.isPending).toBe(true)
    act(() => result.current.handleOpenChange(false))
    expect(onOpenChange).not.toHaveBeenCalled()

    useUpdateProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      updateProductBrand: vi.fn(),
    })
    rerender()
    act(() => result.current.handleOpenChange(false))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('exposes validation and action errors without submitting invalid data', async () => {
    const registerProductBrand = vi.fn()
    const registerError = new Error('Marca já cadastrada')
    useRegisterProductBrandActionMock.mockReturnValue({
      error: registerError,
      isPending: false,
      registerProductBrand,
    })
    const { result } = renderHook(() =>
      useProductBrandDialog({ ...baseProps, variant: 'add' }),
    )

    expect(result.current.actionError).toBe(registerError)
    await submit(result)

    expect(registerProductBrand).not.toHaveBeenCalled()
    expect(result.current.errors.name?.message).toBe('Informe o nome da marca.')
  })

  it('shows a toast and keeps the dialog open when saving fails', async () => {
    const registerProductBrand = vi.fn().mockRejectedValue(new Error('Falha'))
    const onOpenChange = vi.fn()
    const onSuccess = vi.fn()
    useRegisterProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerProductBrand,
    })
    const { result } = renderHook(() =>
      useProductBrandDialog({
        ...baseProps,
        onOpenChange,
        onSuccess,
        variant: 'add',
      }),
    )

    await changeField(result.current.register, 'name', 'Frooty')
    await submit(result)

    expect(showErrorToastMock).toHaveBeenCalledWith(
      'Não foi possível salvar a marca. Revise os dados e tente novamente.',
    )
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
