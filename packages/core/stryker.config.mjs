export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.mutation.config.mts', related: true },
  coverageAnalysis: 'perTest',
  ignorePatterns: ['coverage/**', 'reports/**'],

  mutate: [
    'src/**/use-cases/*-use-case.ts',
    '!src/**/{test,tests,__tests__,faker,fakers,fixture,fixtures,mock,mocks,__mocks__,generated,__generated__}/**',
    '!src/**/*.{test,spec,gen,d}.ts',
    '!src/**/index.ts',
  ],

  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
}
