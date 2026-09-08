import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const serverProxyUrl = process.env.SCOOPS_SERVER_PROXY_URL?.replace(/\/$/, '')

const config = defineConfig(({ command, mode }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    ...(command === 'build' && mode !== 'test'
      ? [
          nitro({
            rollupConfig: { external: [/^@sentry\//] },
            ...(serverProxyUrl
              ? {
                  routeRules: {
                    '/api/auth/**': { proxy: `${serverProxyUrl}/api/auth/**` },
                    '/api/server/**': { proxy: `${serverProxyUrl}/**` },
                  },
                }
              : {}),
          }),
        ]
      : []),
    viteReact(),
  ],
}))

export default config
