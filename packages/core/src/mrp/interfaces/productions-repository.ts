import type { Production } from '#mrp/domain/entities/production.ts'

export interface ProductionsRepository {
  add(input: Omit<Production, 'id'>): Promise<Production>
  removeAll(): Promise<void>
}
