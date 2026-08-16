export const ROUTES = {
  root: '/',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  accessDenied: '/access-denied',
  app: '/',
  onboarding: '/onboarding',
  onboardingConfirm: '/onboarding/confirm',
  users: '/users',
  userDetails: '/users/$userId',
  invitationAccept: '/invitation/accept',
  products: '/products',
  newSale: '/sales/new',
  orders: '/orders',
  salesChannels: '/sales-channels',
  discounts: '/discounts',
  subscription: '/subscription',
  account: '/account',
  shopSettings: '/shop-settings',
} as const

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]
