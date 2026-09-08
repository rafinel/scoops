import type { Combo } from '#pdv/domain/entities/combo.ts'
import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import type { Cart } from '#pdv/domain/structures/cart.ts'
import type { CartDiscount } from '#pdv/domain/structures/cart-discount.ts'
import type { CartLine } from '#pdv/domain/structures/cart-line.ts'
import type { DiscountComponent } from '#pdv/domain/structures/discount-component.ts'
import type { OrderPreviewInput } from '#pdv/domain/structures/order-preview.ts'
import type { OrderRegistrationInput } from '#pdv/domain/structures/order-registration-input.ts'
import type { OrderRegistrationInvalidConfiguration } from '#pdv/domain/structures/order-registration-invalid-configuration.ts'
import type { OrderRegistrationShortage } from '#pdv/domain/structures/order-registration-shortage.ts'
import {
  SaleItemKind,
  type SaleItemKind as SaleItemKindValue,
} from '#pdv/domain/structures/sale-item-kind.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import type { StockConsumption } from '#pdv/domain/structures/stock-consumption.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import { BadRequestError } from '#shared/domain/errors/index.ts'

type RegistrationLine = OrderPreviewInput['lines'][number]

type ComboCandidate = {
  readonly discount: Combo
  readonly requirements: ReadonlyMap<string, number>
  readonly tokenSequence: readonly string[]
  readonly lineProductIds: readonly string[]
  readonly saving: number
}

type CartIssues = {
  readonly cart: Cart
  readonly invalidConfigurations: readonly OrderRegistrationInvalidConfiguration[]
  readonly shortages: readonly OrderRegistrationShortage[]
}

type Allocation = {
  readonly candidates: readonly ComboCandidate[]
  readonly savingCents: number
}

type LineBuild = {
  readonly line: CartLine
  readonly shortages: readonly OrderRegistrationShortage[]
}

type ProductSize = SalesCatalogProduct['sizes'][number]
type ProductBrand = SalesCatalogProduct['resaleBrands'][number]
type ProductAccompaniment = ProductSize['accompaniments'][number]

type LineConfiguration = {
  readonly size: ProductSize | undefined
  readonly brand: ProductBrand | undefined
  readonly selectedAccompaniments: readonly ProductAccompaniment[]
}

/** Round a monetary calculation at the same boundary as the Combo use cases. */
export function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function adjustUnitPrice(baseUnitPrice: number, percentage = 0): number {
  return money(baseUnitPrice * (1 + percentage / 100))
}

export function applyChannelAdjustment(baseUnitPrice: number, percentage = 0): number {
  return adjustUnitPrice(baseUnitPrice, percentage)
}

export function matchDiscountComponent(
  line: RegistrationLine | CartLine,
  component: DiscountComponent,
): boolean {
  if (line.productId !== component.productId || line.kind !== component.kind) return false

  if (component.kind === 'portion') {
    if (line.kind !== 'portion' || line.sizeId !== component.sizeId) return false
    return sameIds(line.accompanimentIds, component.accompanimentIds)
  }

  return line.kind === 'resale' && line.brandId === component.brandId
}

export function matchesConfiguration(
  line: RegistrationLine | CartLine,
  component: DiscountComponent,
): boolean {
  return matchDiscountComponent(line, component)
}

export function expandComboCandidates(
  cart: Cart,
  combos: readonly Combo[],
): readonly ComboCandidate[] {
  const candidates: ComboCandidate[] = []
  const linesByProductId = new Map(cart.lines.map((line) => [line.productId, line]))

  for (const discount of sortCombos(combos)) {
    const requirements = new Map<string, number>()
    const tokenSequence: string[] = []
    const lineProductIds: string[] = []
    let normalPrice = 0
    let isMatch = true

    for (const component of discount.components) {
      const line = linesByProductId.get(component.productId)
      if (!line || !matchDiscountComponent(line, component)) {
        isMatch = false
        break
      }

      const requiredQuantity =
        (requirements.get(component.productId) ?? 0) + component.quantity
      if (requiredQuantity > line.quantity) {
        isMatch = false
        break
      }

      requirements.set(component.productId, requiredQuantity)
      lineProductIds.push(component.productId)
      normalPrice = money(normalPrice + money(line.finalUnitPrice * component.quantity))
      for (let tokenIndex = 0; tokenIndex < component.quantity; tokenIndex += 1) {
        tokenSequence.push(`${component.productId}:${tokenIndex}`)
      }
    }

    if (!isMatch) continue

    const saving = money(normalPrice - money(discount.fixedPrice))
    if (saving <= 0) continue

    candidates.push({
      discount,
      requirements,
      tokenSequence,
      lineProductIds,
      saving,
    })
  }

  return candidates
}

export function allocateCombos(
  cart: Cart,
  combos: readonly Combo[],
): readonly CartDiscount[] {
  const candidates = expandComboCandidates(cart, combos)
  if (candidates.length === 0) return []

  const capacities = new Map(cart.lines.map((line) => [line.productId, line.quantity]))
  const memo = new Map<string, Allocation>()
  const allocation = selectAllocation(candidates, capacities, 0, memo)

  return allocation.candidates.map((candidate) => ({
    discountId: candidate.discount.id,
    name: candidate.discount.name,
    type: candidate.discount.type,
    fixedPrice: money(candidate.discount.fixedPrice),
    savings: candidate.saving,
    components: candidate.discount.components,
    lineProductIds: candidate.lineProductIds,
  }))
}

export function compareAllocations(
  left: readonly ComboCandidate[],
  right: readonly ComboCandidate[],
): number {
  const leftSaving = money(left.reduce((sum, candidate) => sum + candidate.saving, 0))
  const rightSaving = money(right.reduce((sum, candidate) => sum + candidate.saving, 0))
  if (leftSaving !== rightSaving) return rightSaving - leftSaving

  const leftIds = new Set(left.map((candidate) => candidate.discount.id))
  const rightIds = new Set(right.map((candidate) => candidate.discount.id))
  const candidateIds = sortCombos(
    [...left, ...right].map((candidate) => candidate.discount),
  ).map((discount) => discount.id)
  for (const candidateId of candidateIds) {
    const leftHas = leftIds.has(candidateId)
    const rightHas = rightIds.has(candidateId)
    if (leftHas !== rightHas) return leftHas ? -1 : 1
  }

  const leftTokens = left.flatMap((candidate) => candidate.tokenSequence).join('|')
  const rightTokens = right.flatMap((candidate) => candidate.tokenSequence).join('|')
  return leftTokens.localeCompare(rightTokens)
}

export function rebuildCart(
  input: OrderPreviewInput,
  products: readonly SalesCatalogProduct[],
  channel?: SalesChannel,
  combos: readonly Combo[] = [],
  establishmentId = '',
): Cart {
  validateOrderPreviewInput(input)
  const productsById = new Map(products.map((product) => [product.productId, product]))
  const lines = input.lines.map((line) => {
    const product = productsById.get(line.productId)
    if (!product?.isActive || product.kind !== line.kind)
      throw new BadRequestError('A configuração selecionada não está disponível.')
    return buildLine(line, product, channel?.percentage ?? 0).line
  })

  return createCart(establishmentId, channel, lines, combos)
}

export function buildCart(
  input: OrderPreviewInput,
  products: readonly SalesCatalogProduct[],
  channel?: SalesChannel,
  combos: readonly Combo[] = [],
  establishmentId = '',
): Cart {
  return rebuildCart(input, products, channel, combos, establishmentId)
}

export function rebuildCartWithIssues(
  input: OrderPreviewInput,
  products: readonly SalesCatalogProduct[],
  channel: SalesChannel | undefined,
  combos: readonly Combo[],
  establishmentId = '',
): CartIssues {
  validateOrderPreviewInput(input)
  const productsById = new Map(products.map((product) => [product.productId, product]))
  const invalidConfigurations: OrderRegistrationInvalidConfiguration[] = []
  const shortages: OrderRegistrationShortage[] = []
  const lines: CartLine[] = []

  for (const inputLine of input.lines) {
    const product = productsById.get(inputLine.productId)
    const invalidProduct = validateProductConfiguration(inputLine, product)
    if (invalidProduct) {
      invalidConfigurations.push(invalidProduct)
      continue
    }

    if (!product) continue

    const built = buildLine(inputLine, product, channel?.percentage ?? 0)
    lines.push(built.line)
    shortages.push(...built.shortages)
  }

  const cart = createCart(establishmentId, channel, lines, combos)
  return { cart, invalidConfigurations, shortages }
}

function createCart(
  establishmentId: string,
  channel: SalesChannel | undefined,
  lines: readonly CartLine[],
  combos: readonly Combo[],
): Cart {
  const subtotal = money(lines.reduce((sum, line) => sum + line.subtotal, 0))
  const discounts = allocateCombos(
    {
      establishmentId,
      ...(channel ? { channelId: channel.id } : {}),
      lines,
      discounts: [],
      subtotal,
      totalDiscount: 0,
      total: subtotal,
    },
    combos,
  )
  const totalDiscount = money(
    discounts.reduce((sum, discount) => sum + discount.savings, 0),
  )

  return {
    establishmentId,
    ...(channel ? { channelId: channel.id } : {}),
    lines,
    discounts,
    subtotal,
    totalDiscount,
    total: Math.max(0, money(subtotal - totalDiscount)),
  }
}

function buildLine(
  inputLine: RegistrationLine,
  product: SalesCatalogProduct,
  channelPercentage: number,
): LineBuild {
  const configuration = resolveLineConfiguration(inputLine, product)
  const baseUnitPrice = calculateBaseUnitPrice(inputLine, product, configuration)
  const finalUnitPrice = adjustUnitPrice(baseUnitPrice, channelPercentage)

  return {
    line: createLine(inputLine, product, configuration, baseUnitPrice, finalUnitPrice),
    shortages: collectShortages(inputLine, product, configuration),
  }
}

function resolveLineConfiguration(
  inputLine: RegistrationLine,
  product: SalesCatalogProduct,
): LineConfiguration {
  const size =
    inputLine.kind === 'portion'
      ? product.sizes.find((candidate) => candidate.sizeId === inputLine.sizeId)
      : undefined
  const brand =
    inputLine.kind === 'resale' && inputLine.brandId
      ? product.resaleBrands.find((candidate) => candidate.brandId === inputLine.brandId)
      : undefined

  return {
    size,
    brand,
    selectedAccompaniments:
      inputLine.kind === 'portion'
        ? (size?.accompaniments.filter((item) =>
            inputLine.accompanimentIds.includes(item.accompanimentId),
          ) ?? [])
        : [],
  }
}

function collectShortages(
  inputLine: RegistrationLine,
  product: SalesCatalogProduct,
  configuration: LineConfiguration,
): readonly OrderRegistrationShortage[] {
  return [
    ...collectProductShortages(inputLine, product, configuration),
    ...collectConfigurationShortages(inputLine, product, configuration),
  ]
}

function collectProductShortages(
  inputLine: RegistrationLine,
  product: SalesCatalogProduct,
  configuration: LineConfiguration,
): readonly OrderRegistrationShortage[] {
  const hasConfigurationAvailability =
    inputLine.kind === 'portion'
      ? Boolean(configuration.size)
      : Boolean(configuration.brand)
  if (product.isAvailable || hasConfigurationAvailability) return []

  return [
    {
      productId: product.productId,
      productName: product.name,
      unit: ProductUnit.Unit,
      requiredQuantity: inputLine.quantity,
      availableQuantity: product.availableQuantity ?? 0,
    },
  ]
}

function collectConfigurationShortages(
  inputLine: RegistrationLine,
  product: SalesCatalogProduct,
  configuration: LineConfiguration,
): readonly OrderRegistrationShortage[] {
  const shortages: OrderRegistrationShortage[] = []
  if (configuration.size && !configuration.size.isAvailable) {
    shortages.push({
      productId: product.productId,
      productName: product.name,
      unit: ProductUnit.Unit,
      requiredQuantity: configuration.size.quantity * inputLine.quantity,
      availableQuantity: configuration.size.availableQuantity ?? 0,
    })
  }
  if (configuration.brand && !configuration.brand.isAvailable) {
    shortages.push({
      productId: product.productId,
      productName: product.name,
      brandId: configuration.brand.brandId,
      brandName: configuration.brand.name,
      unit: ProductUnit.Unit,
      requiredQuantity: inputLine.quantity,
      availableQuantity: configuration.brand.availableQuantity ?? 0,
    })
  }

  shortages.push(...collectAccompanimentShortages(inputLine.quantity, configuration))
  return shortages
}

function collectAccompanimentShortages(
  quantity: number,
  configuration: LineConfiguration,
): readonly OrderRegistrationShortage[] {
  const shortages: OrderRegistrationShortage[] = []
  for (const accompaniment of configuration.selectedAccompaniments) {
    if (accompaniment.isAvailable) continue
    shortages.push({
      productId: accompaniment.productId ?? accompaniment.accompanimentId,
      productName: accompaniment.name,
      ...(accompaniment.brandId ? { brandId: accompaniment.brandId } : {}),
      unit: ProductUnit.Unit,
      requiredQuantity: accompaniment.quantityPerPortion * quantity,
      availableQuantity: accompaniment.availableQuantity ?? 0,
    })
  }
  return shortages
}

function calculateBaseUnitPrice(
  inputLine: RegistrationLine,
  product: SalesCatalogProduct,
  configuration: LineConfiguration,
): number {
  if (inputLine.kind === 'portion')
    return calculatePortionUnitPrice(
      configuration.size,
      configuration.selectedAccompaniments,
    )

  return money(configuration.brand?.basePrice ?? product.resalePrice ?? 0)
}

function calculatePortionUnitPrice(
  size: ProductSize | undefined,
  accompaniments: readonly ProductAccompaniment[],
): number {
  const accompanimentsPrice = accompaniments.reduce(
    (sum, accompaniment) =>
      sum + accompaniment.basePrice * accompaniment.quantityPerPortion,
    0,
  )
  return money((size?.basePrice ?? 0) + accompanimentsPrice)
}

function createLine(
  inputLine: RegistrationLine,
  product: SalesCatalogProduct,
  configuration: LineConfiguration,
  baseUnitPrice: number,
  finalUnitPrice: number,
): CartLine {
  const configurationFields =
    inputLine.kind === 'portion'
      ? { sizeId: inputLine.sizeId, accompanimentIds: [...inputLine.accompanimentIds] }
      : {
          ...(inputLine.brandId ? { brandId: inputLine.brandId } : {}),
          accompanimentIds: [],
        }

  return {
    productId: product.productId,
    kind: inputLine.kind,
    quantity: inputLine.quantity,
    ...configurationFields,
    baseUnitPrice,
    finalUnitPrice,
    subtotal: money(finalUnitPrice * inputLine.quantity),
    consumptions: buildConsumptions(inputLine, product, configuration),
  }
}

function buildConsumptions(
  inputLine: RegistrationLine,
  product: SalesCatalogProduct,
  configuration: LineConfiguration,
): readonly StockConsumption[] {
  if (inputLine.kind === 'portion')
    return buildPortionConsumptions(inputLine, product, configuration)

  return [
    {
      productId: product.productId,
      ...(configuration.brand ? { brandId: configuration.brand.brandId } : {}),
      quantity: inputLine.quantity,
    },
  ]
}

function buildPortionConsumptions(
  inputLine: RegistrationLine,
  product: SalesCatalogProduct,
  configuration: LineConfiguration,
): readonly StockConsumption[] {
  return [
    {
      productId: product.productId,
      quantity: (configuration.size?.quantity ?? 0) * inputLine.quantity,
    },
    ...configuration.selectedAccompaniments.map((accompaniment) => ({
      productId: accompaniment.productId ?? accompaniment.accompanimentId,
      accompanimentId: accompaniment.accompanimentId,
      ...(accompaniment.brandId ? { brandId: accompaniment.brandId } : {}),
      quantity: accompaniment.quantityPerPortion * inputLine.quantity,
    })),
  ]
}

export function validateOrderRegistrationInput(input: OrderRegistrationInput): void {
  validateOrderPreviewInput(input)
  if (!input.idempotencyKey || typeof input.idempotencyKey !== 'string')
    throw new BadRequestError('A chave de idempotência é obrigatória.')
  if (!input.previewToken || typeof input.previewToken !== 'string')
    throw new BadRequestError('O token da prévia é obrigatório.')
}

export function validateOrderPreviewInput(input: OrderPreviewInput): void {
  if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > 50)
    throw new BadRequestError('O pedido deve possuir entre 1 e 50 itens.')

  const productIds = new Set<string>()
  for (const line of input.lines) {
    if (productIds.has(line.productId))
      throw new BadRequestError('Um produto só pode aparecer uma vez no pedido.')
    productIds.add(line.productId)
    if (!Object.values(SaleItemKind).includes(line.kind))
      throw new BadRequestError('O tipo do item é inválido.')
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 999)
      throw new BadRequestError('A quantidade deve estar entre 1 e 999.')
    if (line.kind === 'portion') {
      if (
        !line.sizeId ||
        !Array.isArray(line.accompanimentIds) ||
        new Set(line.accompanimentIds).size !== line.accompanimentIds.length
      )
        throw new BadRequestError('A configuração da porção é inválida.')
    } else if (line.accompanimentIds?.length || line.sizeId) {
      throw new BadRequestError('Revendas não aceitam tamanho ou acompanhamento.')
    }
  }
}

function validateProductConfiguration(
  line: RegistrationLine,
  product: SalesCatalogProduct | undefined,
): OrderRegistrationInvalidConfiguration | undefined {
  const selectedId =
    line.kind === 'portion' ? line.sizeId : (line.brandId ?? line.productId)
  if (!product)
    return invalid(line, 'product', selectedId, 'O produto não está mais disponível.')
  if (!product.isActive)
    return invalid(line, 'product', selectedId, 'O produto está inativo.', product.name)
  if (product.kind !== line.kind)
    return invalid(line, 'kind', selectedId, 'O tipo do produto mudou.', product.name)

  if (line.kind === 'portion') {
    const size = product.sizes.find((candidate) => candidate.sizeId === line.sizeId)
    if (!size?.isActive)
      return invalid(
        line,
        'size',
        line.sizeId,
        'O tamanho selecionado não está mais disponível.',
        product.name,
      )
    for (const accompanimentId of line.accompanimentIds) {
      const accompaniment = size.accompaniments.find(
        (candidate) => candidate.accompanimentId === accompanimentId,
      )
      if (!accompaniment?.isActive)
        return invalid(
          line,
          'accompaniment',
          accompanimentId,
          'O acompanhamento selecionado não está mais disponível.',
          product.name,
        )
    }
    return undefined
  }

  if (product.stockControl === ProductStockControl.Single) {
    if (line.brandId || product.resalePrice === undefined)
      return invalid(
        line,
        'resale',
        line.brandId ?? line.productId,
        'A configuração de revenda mudou.',
        product.name,
      )
    return undefined
  }

  const brand = line.brandId
    ? product.resaleBrands.find((candidate) => candidate.brandId === line.brandId)
    : undefined
  if (!brand?.isActive)
    return invalid(
      line,
      'brand',
      line.brandId ?? line.productId,
      'A marca selecionada não está mais disponível.',
      product.name,
    )
  return undefined
}

function invalid(
  line: RegistrationLine,
  reason: string,
  selectedId: string,
  message: string,
  productName = 'Produto não encontrado',
): OrderRegistrationInvalidConfiguration {
  return {
    productId: line.productId,
    productName,
    selectedKind: line.kind as SaleItemKindValue,
    selectedId,
    reason,
    correctiveMessage: message,
  }
}

function selectAllocation(
  candidates: readonly ComboCandidate[],
  capacities: ReadonlyMap<string, number>,
  index: number,
  memo: Map<string, Allocation>,
): Allocation {
  const stateKey = `${index}|${[...capacities.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([productId, quantity]) => `${productId}:${quantity}`)
    .join(',')}`
  const remembered = memo.get(stateKey)
  if (remembered) return remembered
  if (index >= candidates.length) {
    const empty = { candidates: [], savingCents: 0 }
    memo.set(stateKey, empty)
    return empty
  }

  const candidate = candidates[index]
  const without = selectAllocation(candidates, capacities, index + 1, memo)
  let best = without
  if (fits(candidate, capacities)) {
    const remaining = new Map(capacities)
    for (const [productId, quantity] of candidate.requirements)
      remaining.set(productId, (remaining.get(productId) ?? 0) - quantity)
    const withCandidate = selectAllocation(candidates, remaining, index + 1, memo)
    const including: Allocation = {
      candidates: [candidate, ...withCandidate.candidates],
      savingCents: money(candidate.saving + withCandidate.savingCents / 100) * 100,
    }
    if (isPreferred(including, best, candidates)) best = including
  }

  memo.set(stateKey, best)
  return best
}

function fits(
  candidate: ComboCandidate,
  capacities: ReadonlyMap<string, number>,
): boolean {
  for (const [productId, quantity] of candidate.requirements) {
    if ((capacities.get(productId) ?? 0) < quantity) return false
  }
  return true
}

function isPreferred(
  left: Allocation,
  right: Allocation,
  candidates: readonly ComboCandidate[],
): boolean {
  if (left.savingCents !== right.savingCents) return left.savingCents > right.savingCents
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

function sortCombos(combos: readonly Combo[]): readonly Combo[] {
  return [...combos].sort((left, right) => {
    const createdAt = left.createdAt.getTime() - right.createdAt.getTime()
    return createdAt || left.id.localeCompare(right.id)
  })
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const rightIds = new Set(right)
  return left.every((id) => rightIds.has(id))
}
