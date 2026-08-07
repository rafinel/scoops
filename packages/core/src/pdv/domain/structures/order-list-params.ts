export type OrderListParams = {
  readonly establishmentId: string
  readonly createdFrom?: Date
  readonly createdTo?: Date
  readonly channelId?: string
  readonly page: number
  readonly pageSize: number
}
