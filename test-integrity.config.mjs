/**
 * Test ownership policy for the repository.
 *
 * `required` and `allowed` are the only source categories that may own a
 * direct test. `indirect` is intentionally explicit: those boundaries are
 * verified through their consumers and must not acquire a file-local test.
 * Web UI direct ownership is limited to widget folders; browser boundaries
 * are listed separately and do not include a committed real-service suite.
 */
export default {
  sourcePatterns: {
    required: [
      'packages/core/src/**/use-cases/*.ts',
      'apps/server/src/**/rest/controllers/*.controller.ts',
    ],
    allowed: [
      'apps/server/src/**/messaging/**/jobs/*.ts',
      'apps/server/src/**/messaging/outbox/*.ts',
      'apps/server/src/**/database/cutover/**/*.ts',
      'apps/web/src/middlewares/*.ts',
      'apps/web/src/rest/axios/**/*.ts',
      'apps/web/src/server/**/*.ts',
      'apps/web/src/ui/**/widgets/**/*.ts',
      'apps/web/src/ui/**/widgets/**/*.tsx',
    ],
    indirect: [
      'apps/server/src/shared/messaging/inngest/inngest-broker.ts',
      'apps/server/src/communication/provision/email/**/*.ts',
      'apps/server/src/**/provision/**/*.ts',
      'apps/server/src/identity/provision/better-auth/**/*.ts',
      'apps/server/src/shared/database/drizzle/database-transaction-context.ts',
      'apps/server/src/shared/rest/bootstrap/**/*.ts',
      'apps/server/src/**/database/drizzle/models/**/*.ts',
      'apps/server/src/**/database/drizzle/repositories/**/*.ts',
      'apps/server/src/**/database/drizzle/drizzle-client.ts',
      'apps/server/src/**/database/drizzle/database.module.ts',
      'apps/server/src/**/database/fixtures/**/*.ts',
      'apps/server/src/**/database/mappers/**/*.ts',
      'apps/web/src/rest/services/**/*.ts',
      'apps/web/src/provision/**/*.ts',
      'apps/web/src/ui/**/hooks/*-action.ts',
      'apps/web/src/ui/**/hooks/*-actions.ts',
      'apps/web/src/ui/**/hooks/*-query.ts',
      'apps/web/src/ui/**/hooks/*-queries.ts',
    ],
    excluded: [
      'apps/**/src/**/index.ts',
      'apps/**/src/**/index.tsx',
      'apps/**/src/**/fixtures/**/*.ts',
      'apps/**/src/**/mocks/**/*.ts',
      'apps/**/src/**/tests/**/*.ts',
      'apps/**/src/**/tests/**/*.tsx',
      'apps/**/src/**/*.d.ts',
      'apps/**/src/**/*.generated.ts',
      'packages/**/src/**/index.ts',
      'packages/**/src/**/fixtures/**/*.ts',
      'packages/**/src/**/mocks/**/*.ts',
      'packages/**/src/**/tests/**/*.ts',
      'packages/**/src/**/*.d.ts',
      'packages/**/src/**/*.generated.ts',
    ],
  },
  boundaryTestPatterns: [
    'apps/web/tests/routes/**/*.test.ts',
    'apps/web/tests/routes/**/*.test.tsx',
    'apps/web/tests/health/*.test.ts',
    'apps/server/src/**/messaging/**/jobs/**/*.test.ts',
    'apps/server/src/**/templates/**/*.test.ts',
    'apps/server/src/**/templates/**/*.test.tsx',
    'apps/web/src/ui/**/widgets/**/*.test.ts',
    'apps/web/src/ui/**/widgets/**/*.test.tsx',
    'apps/web/src/middlewares/tests/*.test.ts',
    'apps/web/src/server/**/tests/*.test.ts',
    'apps/web/src/rest/axios/**/tests/*.test.ts',
  ],
  forbiddenTestPatterns: [
    'apps/server/src/shared/messaging/inngest/inngest-broker.test.ts',
    'apps/server/src/shared/messaging/outbox/tests/requeue-event.test.ts',
    'apps/web/src/rest/services/**/*.test.ts',
    'apps/web/src/rest/services/**/*.test.tsx',
    'apps/web/src/ui/**/hooks/tests/**/*.test.ts',
    'apps/web/src/ui/**/hooks/tests/**/*.test.tsx',
  ],
}
