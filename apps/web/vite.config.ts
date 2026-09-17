import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ command, mode }) => {
  const environment = loadEnv(mode, process.cwd(), '')
  const serverProxyUrl = environment.SCOOPS_SERVER_PROXY_URL?.replace(/\/$/, '')

  return {
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
  }
})

export default config
