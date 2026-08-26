import { ApiProperty } from '@nestjs/swagger'
import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import { SalesChannelStatus } from '@scoops/core/pdv/domain/structures'

export class SalesChannelResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty() name!: string
  @ApiProperty({ minimum: -99.99, maximum: 100, example: 12.5 }) percentage!: number
  @ApiProperty({ enum: Object.values(SalesChannelStatus) })
  status!: SalesChannel['status']
  @ApiProperty({ format: 'date-time' }) createdAt!: string
  @ApiProperty({ format: 'date-time' }) updatedAt!: string

  static from(channel: SalesChannel): SalesChannelResponseDto {
    return Object.assign(new SalesChannelResponseDto(), {
      id: channel.id,
      establishmentId: channel.establishmentId,
      name: channel.name,
      percentage: channel.percentage,
      status: channel.status,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
    })
  }

  static fromMany(channels: readonly SalesChannel[]): SalesChannelResponseDto[] {
    return channels.map(SalesChannelResponseDto.from)
  }
}
