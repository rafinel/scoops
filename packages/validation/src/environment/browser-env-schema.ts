import { z } from 'zod'

export const browserEnvSchema = z
  .object({
    scoopsServerAppUrl: z.url(),
    scoopsServerApiPrefix: z.string().regex(/^$|^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/, {
      message: 'O prefixo da API do servidor deve estar vazio ou começar com uma barra.',
    }),
  })
  .strict()
