import { EstablishmentTimezone } from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

export const establishmentTimezoneSchema = z.enum(EstablishmentTimezone)
