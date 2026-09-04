export type OutboxDatabaseListener = {
  unlisten(): Promise<void>
}
