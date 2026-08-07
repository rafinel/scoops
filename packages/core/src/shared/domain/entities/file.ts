import type { Entity } from '#shared/domain/entities/entity.ts'

export type File = Entity & {
  filePath: string
  fileName: string
  contentType: string
  sizeInBytes: number
  createdAt: Date
}
