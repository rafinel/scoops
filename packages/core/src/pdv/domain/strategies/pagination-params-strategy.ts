import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

type PaginationParamsInput = {
  readonly page?: number
  readonly pageSize?: number
}

type PaginationParams = {
  readonly page: number
  readonly pageSize: number
  readonly isValid: boolean
}

/** Applies the default page and page size and checks them against the list limits. */
export class PaginationParamsStrategy
  implements BusinessRuleStrategy<PaginationParamsInput, PaginationParams>
{
  execute(input: PaginationParamsInput): PaginationParams {
    const page = input.page ?? DEFAULT_PAGE
    const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE
    const isValid =
      this.isPositiveInteger(page) &&
      this.isPositiveInteger(pageSize) &&
      pageSize <= MAX_PAGE_SIZE

    return { page, pageSize, isValid }
  }

  private isPositiveInteger(value: number): boolean {
    return Number.isInteger(value) && value >= 1
  }
}
