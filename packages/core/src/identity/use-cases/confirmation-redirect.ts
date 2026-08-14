/**
 * Builds the provider callback URL without ever putting the continuation token
 * in a link. The raw confirmation nonce is single-purpose and is only retained
 * in the provider email URL; persistence stores its hash instead.
 */
export function confirmationRedirectUrl(
  baseUrl: string,
  confirmationToken: string,
): string {
  const url = new URL(baseUrl)
  url.searchParams.set('confirmationToken', confirmationToken)
  return url.toString()
}
