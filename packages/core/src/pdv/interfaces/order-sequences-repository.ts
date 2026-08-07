export interface OrderSequencesRepository {
  next(establishmentId: string): Promise<number>
}
