import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'
import type { AccompanimentTypeCreate } from '#mrp/domain/structures/accompaniment-type-create.ts'
import type { AccompanimentTypeListParams } from '#mrp/domain/structures/accompaniment-type-list-params.ts'
import type { AccompanimentTypePage } from '#mrp/domain/structures/accompaniment-type-page.ts'
import type { AccompanimentTypeUpdate } from '#mrp/domain/structures/accompaniment-type-update.ts'

export interface AccompanimentTypesRepository {
  add(input: AccompanimentTypeCreate): Promise<AccompanimentType>
  findById(
    establishmentId: string,
    typeId: string,
  ): Promise<AccompanimentType | undefined>
  findByName(
    establishmentId: string,
    name: string,
  ): Promise<AccompanimentType | undefined>
  findPage(input: AccompanimentTypeListParams): Promise<AccompanimentTypePage>
  replace(
    establishmentId: string,
    typeId: string,
    changes: AccompanimentTypeUpdate,
  ): Promise<AccompanimentType>
  remove(establishmentId: string, typeId: string): Promise<void>
  removeAll(): Promise<void>
}
