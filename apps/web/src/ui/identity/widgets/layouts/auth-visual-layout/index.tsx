import { AuthVisual, type AuthVisualProps, type AuthVisualVariant } from '../auth-visual'

export type AuthVisualLayoutVariant = AuthVisualVariant
export type AuthVisualLayoutProps = AuthVisualProps

export const AuthVisualLayout = ({ variant }: AuthVisualLayoutProps) => (
  <AuthVisual variant={variant} />
)
