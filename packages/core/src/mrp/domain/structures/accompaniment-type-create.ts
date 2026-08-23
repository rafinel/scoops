import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'

export type AccompanimentTypeCreate = Omit<
  AccompanimentType,
  'id' | 'createdAt' | 'updatedAt'
>
