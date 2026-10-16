import type { Combo } from '#pdv/domain/entities/combo.ts'
import type { Cart } from '#pdv/domain/structures/cart.ts'
import type { CartDiscount } from '#pdv/domain/structures/cart-discount.ts'
import type { CartLine } from '#pdv/domain/structures/cart-line.ts'
import type { DiscountComponent } from '#pdv/domain/structures/discount-component.ts'
import type { OrderPreviewInput } from '#pdv/domain/structures/order-preview.ts'
import { OrderMoneyRoundingStrategy } from '#pdv/domain/strategies/order-money-rounding-strategy.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

type RegistrationLine = OrderPreviewInput['lines'][number]

type ComboCandidate = {
  readonly discount: Combo
  readonly requirements: ReadonlyMap<string, number>
  readonly tokenSequence: readonly string[]
  readonly lineProductIds: readonly string[]
  readonly saving: number
}

type Allocation = {
  readonly candidates: readonly ComboCandidate[]
  readonly savingCents: number
}

type ComboAllocationInput = {
  readonly cart: Cart
  readonly combos: readonly Combo[]
}

type CandidateContext = {
  readonly linesByConfiguration: ReadonlyMap<string, CartLine>
  readonly capacities: ReadonlyMap<string, number>
}

type CandidateDetails = {
  readonly requirements: ReadonlyMap<string, number>
  readonly tokenSequence: readonly string[]
  readonly lineProductIds: readonly string[]
  readonly normalPrice: number
}

export class ComboAllocationStrategy
  implements BusinessRuleStrategy<ComboAllocationInput, readonly CartDiscount[]>
{
  private readonly money = new OrderMoneyRoundingStrategy()

  execute({ cart, combos }: ComboAllocationInput): readonly CartDiscount[] {
    const candidates = this.expandCandidates(cart, combos)
    if (candidates.length === 0) return []

    const capacities = new Map<string, number>()
    for (const line of cart.lines) {
      const key = this.getConfigurationKey(line)
      capacities.set(key, (capacities.get(key) ?? 0) + line.quantity)
    }
    const allocation = this.selectAllocation(candidates, capacities, 0, new Map())

    return allocation.candidates.map((candidate) => ({
      discountId: candidate.discount.id,
      name: candidate.discount.name,
      type: candidate.discount.type,
      fixedPrice: this.money.execute(candidate.discount.fixedPrice),
      savings: candidate.saving,
      components: candidate.discount.components,
      lineProductIds: candidate.lineProductIds,
    }))
  }

  private expandCandidates(
    cart: Cart,
    combos: readonly Combo[],
  ): readonly ComboCandidate[] {
    const context = this.createCandidateContext(cart)
    return this.sortCombos(combos).flatMap((discount) => {
      const candidate = this.createCandidate(discount, context)
      return candidate ? [candidate] : []
    })
  }

  private createCandidateContext(cart: Cart): CandidateContext {
    const linesByConfiguration = new Map<string, CartLine>()
    const capacities = new Map<string, number>()
    for (const line of cart.lines) {
      const key = this.getConfigurationKey(line)
      linesByConfiguration.set(key, line)
      capacities.set(key, (capacities.get(key) ?? 0) + line.quantity)
    }

    return { linesByConfiguration, capacities }
  }

  private createCandidate(
    discount: Combo,
    context: CandidateContext,
  ): ComboCandidate | undefined {
    const details = this.resolveCandidateDetails(discount, context)
    if (!details) return undefined
    const saving = this.money.execute(
      details.normalPrice - this.money.execute(discount.fixedPrice),
    )
    if (saving <= 0) return undefined
    return { discount, ...details, saving }
  }

  private resolveCandidateDetails(
    discount: Combo,
    context: CandidateContext,
  ): CandidateDetails | undefined {
    const requirements = new Map<string, number>()
    const tokenSequence: string[] = []
    const lineProductIds: string[] = []
    let normalPrice = 0

    for (const component of discount.components) {
      const key = this.getConfigurationKey(component)
      const line = this.findMatchingLine(component, key, context)
      if (!line || !this.reserveComponent(component, key, requirements, context))
        return undefined

      lineProductIds.push(component.productId)
      normalPrice = this.money.execute(
        normalPrice + this.money.execute(line.finalUnitPrice * component.quantity),
      )
      tokenSequence.push(...this.createTokenSequence(key, component.quantity))
    }

    return { requirements, tokenSequence, lineProductIds, normalPrice }
  }

  private findMatchingLine(
    component: DiscountComponent,
    key: string,
    context: CandidateContext,
  ): CartLine | undefined {
    const line = context.linesByConfiguration.get(key)
    return line && this.matchDiscountComponent(line, component) ? line : undefined
  }

  private reserveComponent(
    component: DiscountComponent,
    key: string,
    requirements: Map<string, number>,
    context: CandidateContext,
  ): boolean {
    const required = (requirements.get(key) ?? 0) + component.quantity
    if (required > (context.capacities.get(key) ?? 0)) return false
    requirements.set(key, required)
    return true
  }

  private createTokenSequence(key: string, quantity: number): readonly string[] {
    return Array.from({ length: quantity }, (_, index) => `${key}:${index}`)
  }

  private matchDiscountComponent(
    line: RegistrationLine | CartLine,
    component: DiscountComponent,
  ): boolean {
    if (line.productId !== component.productId || line.kind !== component.kind)
      return false

    if (component.kind === 'portion') {
      if (line.kind !== 'portion' || line.sizeId !== component.sizeId) return false
      return this.sameIds(line.accompanimentIds, component.accompanimentIds)
    }

    return line.kind === 'resale' && line.brandId === component.brandId
  }

  private getConfigurationKey(
    line: RegistrationLine | CartLine | DiscountComponent,
  ): string {
    return JSON.stringify([
      line.productId,
      line.kind,
      line.kind === 'portion' ? line.sizeId : (line.brandId ?? null),
      line.kind === 'portion' ? [...line.accompanimentIds].sort() : [],
    ])
  }

  private selectAllocation(
    candidates: readonly ComboCandidate[],
    capacities: ReadonlyMap<string, number>,
    index: number,
    memo: Map<string, Allocation>,
  ): Allocation {
    const stateKey = this.createAllocationStateKey(index, capacities)
    const remembered = memo.get(stateKey)
    if (remembered) return remembered
    if (index >= candidates.length) {
      const empty = { candidates: [], savingCents: 0 }
      memo.set(stateKey, empty)
      return empty
    }

    const candidate = candidates[index]
    const without = this.selectAllocation(candidates, capacities, index + 1, memo)
    let best = without
    if (this.fits(candidate, capacities)) {
      const including = this.selectIncludingCandidate(
        candidate,
        candidates,
        capacities,
        index,
        memo,
      )
      if (this.isPreferred(including, best, candidates)) best = including
    }

    memo.set(stateKey, best)
    return best
  }

  private createAllocationStateKey(
    index: number,
    capacities: ReadonlyMap<string, number>,
  ): string {
    const available = [...capacities.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([productId, quantity]) => `${productId}:${quantity}`)
      .join(',')
    return `${index}|${available}`
  }

  private selectIncludingCandidate(
    candidate: ComboCandidate,
    candidates: readonly ComboCandidate[],
    capacities: ReadonlyMap<string, number>,
    index: number,
    memo: Map<string, Allocation>,
  ): Allocation {
    const remaining = new Map(capacities)
    for (const [productId, quantity] of candidate.requirements)
      remaining.set(productId, (remaining.get(productId) ?? 0) - quantity)
    const tail = this.selectAllocation(candidates, remaining, index + 1, memo)
    return {
      candidates: [candidate, ...tail.candidates],
      savingCents: this.money.execute(candidate.saving + tail.savingCents / 100) * 100,
    }
  }

  private fits(
    candidate: ComboCandidate,
    capacities: ReadonlyMap<string, number>,
  ): boolean {
    for (const [productId, quantity] of candidate.requirements) {
      if ((capacities.get(productId) ?? 0) < quantity) return false
    }
    return true
  }

  private isPreferred(
    left: Allocation,
    right: Allocation,
    candidates: readonly ComboCandidate[],
  ): boolean {
    if (left.savingCents !== right.savingCents)
      return left.savingCents > right.savingCents
    const leftIds = new Set(left.candidates.map((candidate) => candidate.discount.id))
    const rightIds = new Set(right.candidates.map((candidate) => candidate.discount.id))
    for (const candidate of candidates) {
      const leftHas = leftIds.has(candidate.discount.id)
      const rightHas = rightIds.has(candidate.discount.id)
      if (leftHas !== rightHas) return leftHas
    }
    return (
      left.candidates
        .flatMap((candidate) => candidate.tokenSequence)
        .join('|')
        .localeCompare(
          right.candidates.flatMap((candidate) => candidate.tokenSequence).join('|'),
        ) < 0
    )
  }

  private sortCombos(combos: readonly Combo[]): readonly Combo[] {
    return [...combos].sort((left, right) => {
      const createdAt = left.createdAt.getTime() - right.createdAt.getTime()
      return createdAt || left.id.localeCompare(right.id)
    })
  }

  private sameIds(left: readonly string[], right: readonly string[]): boolean {
    if (left.length !== right.length) return false
    const rightIds = new Set(right)
    return left.every((id) => rightIds.has(id))
  }
}
