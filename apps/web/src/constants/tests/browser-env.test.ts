import { describe, expect, it } from 'vitest'

import { parseBrowserEnv } from '../browser-env'

describe('browser environment', () => {
  it('builds a same-origin server REST URL when a proxy prefix is configured', () => {
    expect(
      parseBrowserEnv({
        scoopsServerAppUrl: 'https://scoops-web.example.test/',
        scoopsServerApiPrefix: '/api/server',
      }),
    ).toEqual({
      scoopsServerAppUrl: 'https://scoops-web.example.test',
      scoopsServerRestUrl: 'https://scoops-web.example.test/api/server',
    })
  })

  it('keeps local REST requests on the direct server origin by default', () => {
    expect(
      parseBrowserEnv({
        scoopsServerAppUrl: 'http://localhost:3336',
        scoopsServerApiPrefix: '',
      }),
    ).toEqual({
      scoopsServerAppUrl: 'http://localhost:3336',
      scoopsServerRestUrl: 'http://localhost:3336',
    })
  })

  it('rejects a proxy prefix that is not a slash-prefixed path', () => {
    expect(() =>
      parseBrowserEnv({
        scoopsServerAppUrl: 'https://example.com',
        scoopsServerApiPrefix: 'api/server',
      }),
    ).toThrow()
  })
})
