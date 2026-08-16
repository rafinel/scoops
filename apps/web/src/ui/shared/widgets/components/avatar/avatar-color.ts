export const AVATAR_COLORS = [
  { backgroundClass: 'bg-success-soft', foregroundClass: 'text-success' },
  { backgroundClass: 'bg-info-soft', foregroundClass: 'text-info' },
  { backgroundClass: 'bg-warning-soft', foregroundClass: 'text-warning' },
  { backgroundClass: 'bg-danger-soft', foregroundClass: 'text-danger' },
  { backgroundClass: 'bg-accent', foregroundClass: 'text-primary' },
] as const

export type AvatarColor = (typeof AVATAR_COLORS)[number]

export function getAvatarColor(name: string): AvatarColor {
  let hash = 0

  for (const character of name.trim().toLowerCase()) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) | 0
  }

  return AVATAR_COLORS[(hash >>> 0) % AVATAR_COLORS.length]
}

export function getAvatarInitials(name: string): string {
  const nameParts = name.trim().split(/\s+/).filter(Boolean)

  return (
    nameParts
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'
  )
}
