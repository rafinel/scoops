export interface AuthenticationSessionsRepository {
  removeAllByProviderSubject(providerSubject: string): Promise<void>
}
