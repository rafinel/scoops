const { sentryWebpackPlugin } = require('@sentry/webpack-plugin')

const bundledWorkspacePackages = [
  '@scoops/core',
  '@scoops/email',
  '@scoops/validation',
  'better-auth',
  'better-call',
  'rou3',
]

module.exports = (options) => {
  const [nodeExternals] = options.externals
  const sentryAppMode = process.env.SCOOPS_SERVER_APP_MODE
  const isDeployedBuild = sentryAppMode === 'stg' || sentryAppMode === 'prod'
  const plugins = [...(options.plugins ?? [])]

  if (isDeployedBuild) {
    const missingSettings = [
      ['SENTRY_ORG', process.env.SENTRY_ORG],
      ['SENTRY_PROJECT', process.env.SENTRY_PROJECT],
      ['SENTRY_AUTH_TOKEN', process.env.SENTRY_AUTH_TOKEN],
      ['SCOOPS_RELEASE_SHA', process.env.SCOOPS_RELEASE_SHA],
    ].filter(([, value]) => !value)

    if (missingSettings.length > 0) {
      throw new Error(
        `Deployed server builds require ${missingSettings.map(([name]) => name).join(', ')}.`,
      )
    }

    if (!/^[a-f0-9]{40}$/i.test(process.env.SCOOPS_RELEASE_SHA ?? '')) {
      throw new Error(
        'SCOOPS_RELEASE_SHA must be a full Git commit SHA in deployed builds.',
      )
    }

    plugins.push(
      sentryWebpackPlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: { name: process.env.SCOOPS_RELEASE_SHA },
        sourcemaps: { filesToDeleteAfterUpload: ['**/*.map'] },
        errorHandler: (error) => {
          throw error
        },
        telemetry: false,
      }),
    )
  }

  return {
    ...options,
    ...(isDeployedBuild ? { devtool: 'hidden-source-map' } : {}),
    plugins,
    output: {
      ...options.output,
      library: {
        type: 'commonjs2',
      },
    },
    resolve: {
      ...options.resolve,
      extensionAlias: {
        '.js': ['.ts', '.tsx', '.js'],
      },
    },
    externals: [
      (context, callback) => {
        const request = context.request

        if (
          bundledWorkspacePackages.some(
            (packageName) =>
              request === packageName || request?.startsWith(`${packageName}/`),
          )
        ) {
          return callback()
        }

        return nodeExternals(context, callback)
      },
    ],
  }
}
