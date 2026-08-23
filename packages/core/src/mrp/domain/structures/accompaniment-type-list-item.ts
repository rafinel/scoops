import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'

export type AccompanimentTypeListItem = {
  readonly type: AccompanimentType
  readonly usageCount: number
}
