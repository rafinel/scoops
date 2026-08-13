import { Get, HttpStatus } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'

import { AuthController, CurrentAccount } from '@/identity/decorators'
import type { Account } from '@scoops/core/identity/domain/entities'
import { AccountResponseDto } from '@/identity/rest/dtos/account-response.dto'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@AuthController()
export class GetAuthSessionController {
  @Get('session')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The authenticated account was returned.',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The authentication service is temporarily unavailable.',
    type: ErrorResponseDto,
  })
  handle(@CurrentAccount() account: Account): Account {
    return account
  }
}
