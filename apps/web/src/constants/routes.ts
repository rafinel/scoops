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
  productDetails: '/products/$productId',
  productDetailsStock: '/products/$productId/stock',
  productDetailsRecipe: '/products/$productId/recipe',
  productDetailsAccompaniments: '/products/$productId/accompaniments',
  productDetailsPrices: '/products/$productId/prices',
  productDetailsSettings: '/products/$productId/settings',
  newSale: '/sales/new',
  orders: '/orders',
  salesChannels: '/sales-channels',
  discounts: '/discounts',
  subscription: '/subscription',
  account: '/account',
  shopSettings: '/shop-settings',
} as const

export function productRecipeRoute(productId: string): string {
  return ROUTES.productDetailsRecipe.replace('$productId', productId)
}

export type RouteName = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteName]
