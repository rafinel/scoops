const bundledWorkspacePackages = ['@scoops/core']

module.exports = (options) => {
  const [nodeExternals] = options.externals

  return {
    ...options,
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
