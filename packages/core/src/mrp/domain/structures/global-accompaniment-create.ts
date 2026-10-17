import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'

export type GlobalAccompanimentCreate = Omit<
  GlobalAccompaniment,
  'id' | 'createdAt' | 'updatedAt'
>
