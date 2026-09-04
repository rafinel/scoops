import path from 'node:path'

const workspace = path.basename(process.cwd())
const businessModules = ['billing', 'communication', 'identity', 'mrp', 'pdv']

/** @type {Record<string, import('dependency-cruiser').IForbiddenRuleType[]>} */
const workspaceRules = {
  core: [
    {
      name: 'core-framework-independence',
      severity: 'error',
      comment: 'Runtime Core code must not depend on frameworks or external packages.',
      from: { path: '^src/', pathNot: ['(?:/tests/|/fakers/)', '\\.test\\.ts$'] },
      to: { pathNot: '^src/' },
    },
    ...businessModules.map((owner) => ({
      name: `core-${owner}-module-boundary`,
      severity: /** @type {const} */ ('error'),
      comment:
        'Core modules may consume another module only through domain structure contracts.',
      from: { path: `^src/${owner}/` },
      to: {
        path: `^src/(?:${businessModules.filter((module) => module !== owner).join('|')})/`,
        pathNot: '^src/[^/]+/domain/structures/',
      },
    })),
    {
      name: 'core-domain-layer-direction',
      severity: 'error',
      comment: 'Domain code must not depend on interfaces or use cases.',
      from: { path: '^src/[^/]+/domain/' },
      to: { path: '^src/[^/]+/(?:interfaces|use-cases)/' },
    },
    {
      name: 'core-interface-layer-direction',
      severity: 'error',
      comment: 'Interfaces must not depend on use cases.',
      from: { path: '^src/[^/]+/interfaces/' },
      to: { path: '^src/[^/]+/use-cases/' },
    },
  ],
  validation: [
    {
      name: 'validation-core-contract-boundary',
      severity: 'error',
      comment: 'Validation may consume Core only through domain structure contracts.',
      from: { path: '^src/' },
      to: {
        path: '^@scoops/core/',
        pathNot: '^@scoops/core/[^/]+/domain/structures$',
      },
    },
    {
      name: 'validation-external-boundary',
      severity: 'error',
      comment: 'Validation may depend on Zod but not on other external packages.',
      from: { path: '^src/' },
      to: {
        pathNot: ['^src/', '^@scoops/core/', '^zod$', 'node_modules/zod/'],
      },
    },
  ],
  server: [
    {
      name: 'server-shared-boundary',
      severity: 'error',
      comment: 'Shared infrastructure must not depend on feature implementations.',
      from: {
        path: '^src/shared/',
        pathNot: [
          '^src/shared/database/drizzle/schema\\.ts$',
          '^src/shared/database/seed\\.ts$',
        ],
      },
      to: { path: '^src/(?:billing|communication|identity|mrp|pdv)/' },
    },
    {
      name: 'server-mrp-module-boundary',
      severity: 'error',
      comment: 'MRP may cross into Identity only through authentication decorators.',
      from: {
        path: '^src/mrp/',
        pathNot: ['(?:/tests/|/fixtures/)', '\\.test\\.ts$'],
      },
      to: {
        path: '^src/(?:billing|communication|identity|pdv)/',
        pathNot: '^src/identity/decorators(?:/|\\.ts$)',
      },
    },
    {
      name: 'server-pdv-module-boundary',
      severity: 'error',
      comment: 'PDV may use only the explicit Identity and MRP integration boundaries.',
      from: {
        path: '^src/pdv/',
        pathNot: ['(?:/tests/|/fixtures/)', '\\.test\\.ts$'],
      },
      to: {
        path: '^src/(?:billing|communication|identity|mrp)/',
        pathNot: [
          '^src/identity/decorators(?:/|\\.ts$)',
          '^src/mrp/constants(?:/|\\.ts$)',
          '^src/mrp/database/mrp-database\\.module\\.ts$',
          '^src/mrp/provision/',
        ],
      },
    },
    ...['billing', 'communication', 'identity'].map((owner) => ({
      name: `server-${owner}-module-boundary`,
      severity: /** @type {const} */ ('error'),
      comment: 'Feature modules must not import another feature implementation.',
      from: {
        path: `^src/${owner}/`,
        pathNot: ['(?:/tests/|/fixtures/)', '\\.test\\.ts$'],
      },
      to: {
        path: `^src/(?:${['billing', 'communication', 'identity', 'mrp', 'pdv']
          .filter((module) => module !== owner)
          .join('|')})/`,
      },
    })),
  ],
  web: [
    {
      name: 'web-authority-boundary',
      severity: 'error',
      comment:
        'Web must not depend on server frameworks, persistence, messaging or Core use cases.',
      from: { path: '^src/' },
      to: {
        path: [
          'node_modules/@nestjs/',
          'node_modules/drizzle-orm/',
          'node_modules/inngest/',
          'node_modules/postgres/',
          '^(?:@nestjs/|drizzle-orm(?:/|$)|inngest(?:/|$)|postgres$)',
          '^@scoops/core/[^/]+/use-cases$',
          '(?:^|/)packages/core/src/[^/]+/use-cases/',
        ],
      },
    },
  ],
}

if (!workspaceRules[workspace]) {
  throw new TypeError(
    `No Dependency Cruiser architecture rules for workspace "${workspace}".`,
  )
}

/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: workspaceRules[workspace],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: '(?:^|/)(?:dist|test-results)(?:/|$)',
    },
    moduleSystems: ['es6', 'cjs'],
    tsConfig: {
      fileName: path.join(process.cwd(), 'tsconfig.json'),
    },
    tsPreCompilationDeps: true,
  },
}
