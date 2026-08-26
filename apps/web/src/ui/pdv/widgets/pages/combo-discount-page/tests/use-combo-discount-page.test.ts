import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useComboDiscountPage } from '../use-combo-discount-page'
import { useComboQuery } from '@/ui/pdv/hooks/use-combo-query'
import { useCreateComboAction } from '@/ui/pdv/hooks/use-create-combo-action'
import { useUpdateComboAction } from '@/ui/pdv/hooks/use-update-combo-action'

import { comboDetails } from './combo-test-fixtures'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))
vi.mock('@/ui/pdv/hooks/use-combo-query', () => ({ useComboQuery: vi.fn() }))
vi.mock('@/ui/pdv/hooks/use-create-combo-action', () => ({
  useCreateComboAction: vi.fn(),
}))
vi.mock('@/ui/pdv/hooks/use-update-combo-action', () => ({
  useUpdateComboAction: vi.fn(),
}))

describe('useComboDiscountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigation).mockReturnValue({
      navigateTo: vi.fn().mockResolvedValue(undefined),
      navigateToPath: vi.fn(),
    })
    vi.mocked(useComboQuery).mockReturnValue({
      comboDetails: undefined,
      comboDetailsError: null,
      isComboDetailsError: false,
      isLoadingComboDetails: false,
      refetchComboDetails: vi.fn().mockResolvedValue(undefined),
    })
    vi.mocked(useCreateComboAction).mockReturnValue({
      createCombo: vi.fn().mockResolvedValue(comboDetails),
      isPending: false,
    })
    vi.mocked(useUpdateComboAction).mockReturnValue({
      isPending: false,
      updateCombo: vi.fn().mockResolvedValue(comboDetails),
    })
  })

  it('creates a Combo and returns to the discounts list', async () => {
    const createCombo = vi.fn().mockResolvedValue(comboDetails)
    const navigateTo = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateComboAction).mockReturnValue({ createCombo, isPending: false })
    vi.mocked(useNavigation).mockReturnValue({ navigateTo, navigateToPath: vi.fn() })
    const { result } = renderHook(() => useComboDiscountPage({ mode: 'create' }))

    await act(async () =>
      result.current.handleSubmit({
        name: 'Combo',
        status: 'active',
        fixedPrice: 10,
        components: comboDetails.combo.components,
      } as never),
    )
    expect(createCombo).toHaveBeenCalledOnce()
    expect(navigateTo).toHaveBeenCalledWith('discounts')
  })

  it('sends the current version when editing', async () => {
    const updateCombo = vi.fn().mockResolvedValue(comboDetails)
    const refetchComboDetails = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useComboQuery).mockReturnValue({
      comboDetails,
      comboDetailsError: null,
      isComboDetailsError: false,
      isLoadingComboDetails: false,
      refetchComboDetails,
    })
    vi.mocked(useUpdateComboAction).mockReturnValue({ isPending: false, updateCombo })
    const { result } = renderHook(() =>
      useComboDiscountPage({ comboId: 'combo-1', mode: 'edit' }),
    )

    await act(async () =>
      result.current.handleSubmit({
        name: 'Combo revisado',
        status: 'active',
        fixedPrice: 18,
        components: comboDetails.combo.components,
      } as never),
    )
    expect(updateCombo).toHaveBeenCalledWith({
      comboId: 'combo-1',
      input: expect.objectContaining({
        expectedUpdatedAt: comboDetails.combo.updatedAt,
        fixedPrice: 18,
      }),
    })
    expect(refetchComboDetails).toHaveBeenCalledOnce()
  })
})
