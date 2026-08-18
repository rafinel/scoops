import { UserProfile } from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

export const userInviteFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome completo.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  profile: z.enum(UserProfile),
})
