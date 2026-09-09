import { NotificationKind } from '@scoops/core/communication/domain/structures'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { CommunicationModuleFixture } from '@/communication/fixtures/communication-module-fixture'

export async function prepareCommunicationFixture() {
  const auth = new BetterAuthFixture()
  const fixture = await CommunicationModuleFixture.register(auth)
  return { auth, fixture }
}

export async function resetCommunicationFixture(
  fixture: CommunicationModuleFixture,
  auth: BetterAuthFixture,
) {
  await auth.clear()
  await fixture.resetDatabase()
  await fixture.seedAccounts()
  fixture.authenticate(auth.setUser.bind(auth))
}

export function managerRequestAuthorization() {
  return `scoops.session_token=${CommunicationModuleFixture.accounts.managerToken}`
}

export function foreignManagerRequestAuthorization() {
  return `scoops.session_token=${CommunicationModuleFixture.accounts.foreignManagerToken}`
}

export function notificationInput(
  overrides: Partial<
    Parameters<CommunicationModuleFixture['seedNotifications']>[0][number]
  > = {},
) {
  const now = new Date('2026-09-05T12:00:00.000Z')
  return {
    sourceEventId: `source-${crypto.randomUUID()}`,
    establishmentId: CommunicationModuleFixture.accounts.establishmentId,
    recipientUserId: CommunicationModuleFixture.accounts.managerId,
    kind: NotificationKind.StockBelowIdeal,
    title: 'Estoque abaixo do ideal',
    message: 'Chocolate está com 2 kg disponíveis. Ideal: 10 kg.',
    occurredAt: now,
    createdAt: now,
    ...overrides,
  }
}
