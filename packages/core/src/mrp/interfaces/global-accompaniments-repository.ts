import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { GlobalAccompanimentCreate } from '#mrp/domain/structures/global-accompaniment-create.ts'
import type { GlobalAccompanimentUpdate } from '#mrp/domain/structures/global-accompaniment-update.ts'

export interface GlobalAccompanimentsRepository {
  add(input: GlobalAccompanimentCreate): Promise<GlobalAccompaniment>
  addMany(inputs: readonly GlobalAccompanimentCreate[]): Promise<GlobalAccompaniment[]>
  findById(
    establishmentId: string,
    globalAccompanimentId: string,
  ): Promise<GlobalAccompaniment | undefined>
  findByAccompanimentProductId(
    establishmentId: string,
    accompanimentProductId: string,
  ): Promise<GlobalAccompaniment | undefined>
  findManyByEstablishmentId(
    establishmentId: string,
  ): Promise<readonly GlobalAccompaniment[]>
  countByTypeId(establishmentId: string, typeId: string): Promise<number>
  replace(
    establishmentId: string,
    globalAccompanimentId: string,
    changes: GlobalAccompanimentUpdate,
  ): Promise<GlobalAccompaniment>
  remove(establishmentId: string, globalAccompanimentId: string): Promise<void>
  removeAll(): Promise<void>
}
