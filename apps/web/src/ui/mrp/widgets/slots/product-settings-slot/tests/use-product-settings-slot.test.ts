import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useProductSettingsQuery } from '@/ui/mrp/hooks/use-product-settings-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useProductSettingsSlot } from '../use-product-settings-slot'

vi.mock('@/ui/mrp/hooks/use-product-settings-query', () => ({
  useProductSettingsQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))

const queryMock = vi.mocked(useProductSettingsQuery)
const navigationMock = vi.mocked(useNavigation)

describe('useProductSettingsSlot', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    queryMock.mockReturnValue({
      settings: undefined,
      settingsError: null,
      hasSettingsError: false,
      isLoadingSettings: false,
      isPendingSettings: false,
      retrySettings: vi.fn(),
    })
    navigationMock.mockReturnValue({ navigateTo: vi.fn(), navigateToPath: vi.fn() })
  })

  it('keeps unit and removal orchestration local and returns focus after cancel', () => {
    const { result } = renderHook(() => useProductSettingsSlot('product-1', {}))
    const unitTrigger = document.createElement('button')
    const removalTrigger = document.createElement('button')
    const unitFocus = vi.spyOn(unitTrigger, 'focus')
    const removalFocus = vi.spyOn(removalTrigger, 'focus')

    act(() => result.current.handleUnitChange('kg', unitTrigger))
    expect(result.current.targetUnit).toBe('kg')
    expect(result.current.isUnitDialogOpen).toBe(true)
    act(() => result.current.handleUnitDialogOpenChange(false))
    expect(unitFocus).toHaveBeenCalledOnce()

    act(() => result.current.handleOpenRemoval(removalTrigger))
    expect(result.current.isRemovalDialogOpen).toBe(true)
    act(() => result.current.handleRemovalOpenChange(false))
    expect(removalFocus).toHaveBeenCalledOnce()
  })

  it('navigates back and retries the settings query through shared wrappers', () => {
    const navigateTo = vi.fn()
    const retrySettings = vi.fn()
    navigationMock.mockReturnValue({ navigateTo, navigateToPath: vi.fn() })
    queryMock.mockReturnValue({
      settings: undefined,
      settingsError: null,
      hasSettingsError: true,
      isLoadingSettings: false,
      isPendingSettings: false,
      retrySettings,
    })
    const { result } = renderHook(() =>
      useProductSettingsSlot('product-1', { retryCategory: 'ingredient' }),
    )
    act(() => result.current.handleBack())
    act(() => result.current.handleRetry())
    expect(navigateTo).toHaveBeenCalledWith('products')
    expect(retrySettings).toHaveBeenCalledOnce()
  })
})
