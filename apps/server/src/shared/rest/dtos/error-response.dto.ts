import { ApiProperty } from '@nestjs/swagger'

export class ErrorResponseDto {
  @ApiProperty()
  statusCode!: number

  @ApiProperty()
  title!: string

  @ApiProperty()
  message!: string

  @ApiProperty({ format: 'date-time' })
  timestamp!: string

  @ApiProperty()
  path!: string
}
