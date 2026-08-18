import { z } from 'zod'

export const resetPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(8, 'A senha deve ter entre 8 e 64 caracteres.')
      .max(64, 'A senha deve ter entre 8 e 64 caracteres.'),
    confirmation: z.string().min(1, 'Confirme sua nova senha.'),
  })
  .refine(({ password, confirmation }) => password === confirmation, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmation'],
  })
