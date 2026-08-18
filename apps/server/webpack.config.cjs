const bundledWorkspacePackages = ['@scoops/core', '@scoops/validation']

module.exports = (options) => {
  const [nodeExternals] = options.externals

  return {
    ...options,
    resolve: {
      ...options.resolve,
      extensionAlias: {
        '.js': ['.ts', '.js'],
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
