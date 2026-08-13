import type { User, UserCreate, UserUpdate } from '#identity/domain/entities/user.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { UsersListParams } from '#identity/domain/structures/users-list-params.ts'

export interface UsersRepository {
  add(input: UserCreate): Promise<User>
  addMany(inputs: UserCreate[]): Promise<User[]>
  findById(userId: string): Promise<User | undefined>
  findByIdInEstablishment(
    establishmentId: string,
    userId: string,
  ): Promise<User | undefined>
  findByProviderSubject(providerSubject: string): Promise<User | undefined>
  findByEmail(email: string): Promise<User | undefined>
  findMany(input: UsersListParams): Promise<PaginationResponse<User>>
  countActiveManagers(establishmentId: string): Promise<number>
  replace(establishmentId: string, userId: string, changes: UserUpdate): Promise<User>
  removeAll(): Promise<void>
  remove(establishmentId: string, userId: string): Promise<void>
}
