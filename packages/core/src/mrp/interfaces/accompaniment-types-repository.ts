import type {
  AccompanimentType,
  AccompanimentTypeCreate,
  AccompanimentTypeUpdate,
} from '#mrp/domain/entities/accompaniment-type.ts'

export interface AccompanimentTypesRepository {
  add(input: AccompanimentTypeCreate): Promise<AccompanimentType>
  findById(typeId: string): Promise<AccompanimentType | undefined>
  findByName(
    establishmentId: string,
    name: string,
  ): Promise<AccompanimentType | undefined>
  findMany(establishmentId: string): Promise<readonly AccompanimentType[]>
  replace(typeId: string, changes: AccompanimentTypeUpdate): Promise<AccompanimentType>
  remove(typeId: string): Promise<void>
}
