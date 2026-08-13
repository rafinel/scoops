import { Reflector } from '@nestjs/core'

import type { UserProfile } from '@scoops/core/identity/domain/structures'

export const RequiredProfiles = Reflector.createDecorator<UserProfile[]>()
