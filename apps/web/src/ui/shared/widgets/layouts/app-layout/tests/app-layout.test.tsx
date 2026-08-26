import { describe, expect, it } from 'vitest'

import { UserProfile } from '@scoops/core/identity/domain/structures'

import { getSidebarItems } from '@/constants/sidebar-items'
import { isSidebarItemActive } from '../index'

describe('AppLayout sidebar profile configuration', () => {
  it('keeps manager-only destinations out of the Operator navigation', () => {
    expect(
      getSidebarItems(UserProfile.Manager).some(
        (item) => item.route === 'accompanimentTypes',
      ),
    ).toBe(false)
    expect(
      getSidebarItems(UserProfile.Operator).some(
        (item) => item.route === 'accompanimentTypes',
      ),
    ).toBe(false)
    expect(
      getSidebarItems(UserProfile.Manager).some((item) => item.route === 'salesChannels'),
    ).toBe(true)
    expect(
      getSidebarItems(UserProfile.Operator).some(
        (item) => item.route === 'salesChannels',
      ),
    ).toBe(false)
    const products = getSidebarItems(UserProfile.Operator).find(
      (item) => item.route === 'products',
    )
    expect(products?.activePrefixes).toContain('/products/')
  })

  it('keeps active navigation accessible when routes include trailing slashes', () => {
    const managerItems = getSidebarItems(UserProfile.Manager)
    const products = managerItems.find((item) => item.route === 'products')

    expect(products && isSidebarItemActive('/products/portion-1/', products)).toBe(true)
    expect(products && isSidebarItemActive('/products-old/', products)).toBe(false)
  })
})
