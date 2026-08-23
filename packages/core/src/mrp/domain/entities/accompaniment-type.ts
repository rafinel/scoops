import type { Entity } from '#shared/domain/entities/entity.ts'

export type AccompanimentType = Entity & {
  establishmentId: string
  name: string
  createdAt: Date
  updatedAt: Date
}
