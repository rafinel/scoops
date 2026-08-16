import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Avatar } from '../index'
import { getAvatarColor, getAvatarInitials } from '../avatar-color'

describe('Avatar', () => {
  it('renders initials and derives a stable color from the name', () => {
    const { rerender } = render(<Avatar name='Scoops Manager' />)
    const avatar = screen.getByText('SM')
    const initialClassName = avatar.className

    rerender(<Avatar name='  scoops manager  ' />)

    expect(screen.getByText('SM').className).toBe(initialClassName)
    expect(getAvatarColor('Scoops Manager')).toEqual(getAvatarColor('  scoops manager  '))
    expect(getAvatarColor('Scoops Manager')).not.toEqual(
      getAvatarColor('Scoops Operator'),
    )
  })

  it('falls back to a placeholder for an empty name', () => {
    expect(getAvatarInitials('')).toBe('?')
  })
})
