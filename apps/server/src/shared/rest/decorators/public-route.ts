import { SetMetadata } from '@nestjs/common'

export const PUBLIC_ROUTE_METADATA = Symbol('PUBLIC_ROUTE_METADATA')

export const PublicRoute = () => SetMetadata(PUBLIC_ROUTE_METADATA, true)
