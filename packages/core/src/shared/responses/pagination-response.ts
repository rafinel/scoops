export class PaginationResponse<Item> {
  constructor(
    readonly items: readonly Item[],
    readonly page: number,
    readonly pageSize: number,
    readonly total: number,
    readonly totalPages: number,
  ) {}
}
