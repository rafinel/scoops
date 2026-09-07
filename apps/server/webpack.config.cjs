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

  return {
    ...options,
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
