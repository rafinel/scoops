import { Get, HttpStatus, Inject, Query as QueryParameter } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { globalSearchQuerySchema } from '@scoops/validation'
import type { Account } from '@scoops/core/identity/domain/entities'
import type {
  IdentityGlobalSearchProvider,
  MrpGlobalSearchProvider,
  PdvGlobalSearchProvider,
} from '@scoops/core/identity/interfaces'
import { SearchGlobalUseCase } from '@scoops/core/identity/use-cases'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import {
  CurrentAccount,
  GlobalSearchController as GlobalSearchRoute,
  RequiredProfiles,
} from '@/identity/decorators'
import { GlobalSearchResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

@GlobalSearchRoute()
export class SearchGlobalController {
  private readonly useCase: SearchGlobalUseCase

  constructor(
    @Inject(IDENTITY_PROVIDERS.globalSearchIdentity)
    identityProvider: IdentityGlobalSearchProvider,
    @Inject(IDENTITY_PROVIDERS.globalSearchMrp)
    mrpProvider: MrpGlobalSearchProvider,
    @Inject(IDENTITY_PROVIDERS.globalSearchPdv)
    pdvProvider: PdvGlobalSearchProvider,
  ) {
    this.useCase = new SearchGlobalUseCase(identityProvider, mrpProvider, pdvProvider)
  }

  @Get()
  @RequiredProfiles([UserProfile.Manager, UserProfile.Operator])
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Global search results returned.',
    type: GlobalSearchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'This profile cannot use global search.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The query is invalid.',
    type: ErrorResponseDto,
  })
  async handle(
    @QueryParameter(new ZodValidationPipe(globalSearchQuerySchema))
    query: { q: string },
    @CurrentAccount() actor: Account,
  ): Promise<GlobalSearchResponseDto> {
    const result = await this.useCase.execute({ actor, query: query.q })
    return GlobalSearchResponseDto.from(result)
  }
}
