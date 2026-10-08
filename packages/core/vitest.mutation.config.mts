import { mergeConfig } from 'vitest/config'

import baseConfig from './vitest.config.mts'

export default mergeConfig(baseConfig, {
  test: {
    // The filesystem module cache can skip related tests on later mutant runs.
    experimental: { fsModuleCache: false },
  },
})
