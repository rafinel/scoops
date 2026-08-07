import type { Entity } from '#shared/domain/entities/entity.ts'

export type AccompanimentType = Entity & {
  establishmentId: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type AccompanimentTypeCreate = Omit<
  AccompanimentType,
  'id' | 'createdAt' | 'updatedAt'
>

export type AccompanimentTypeUpdate = Partial<Pick<AccompanimentType, 'name'>>
