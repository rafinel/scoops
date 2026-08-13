export interface OnboardingTokenProvider {
  issue(): { token: string; hash: string }
  hash(token: string): string
}
