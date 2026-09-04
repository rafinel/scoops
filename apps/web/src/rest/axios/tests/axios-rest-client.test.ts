import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AxiosRestClient } from '../axios-rest-client'

const { axiosCreateMock, axiosIsAxiosErrorMock, requestMock, client } = vi.hoisted(() => {
  const request = vi.fn()
  const fakeClient = {
    defaults: { baseURL: 'https://api.example', headers: { common: {} }, params: {} },
    request,
  }
  return {
    axiosCreateMock: vi.fn(() => fakeClient),
    axiosIsAxiosErrorMock: vi.fn(() => false),
    requestMock: request,
    client: fakeClient,
  }
})

vi.mock('axios', () => ({
  default: {
    create: axiosCreateMock,
    isAxiosError: axiosIsAxiosErrorMock,
  },
}))

describe('AxiosRestClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    client.defaults.baseURL = 'https://api.example'
    client.defaults.headers.common = {}
    client.defaults.params = {}
    axiosCreateMock.mockReturnValue(client)
  })

  it('creates credentialed clients and maps every supported request method', async () => {
    requestMock.mockResolvedValue({
      data: { id: 'resource-1' },
      status: 200,
      headers: { etag: ['one', 'two'], nullable: null },
    })
    const restClient = AxiosRestClient('https://api.example')

    await restClient.get('/resource')
    await restClient.getFile('/resource/file')
    await restClient.post('/resource', { name: 'new' })
    await restClient.postFormData('/resource/form', new FormData())
    await restClient.patch('/resource', { name: 'updated' })
    await restClient.put('/resource', { name: 'replaced' })
    await restClient.delete('/resource', { reason: 'removed' })

    expect(axiosCreateMock).toHaveBeenCalledWith({
      baseURL: 'https://api.example',
      timeout: 15_000,
      withCredentials: true,
    })
    expect(requestMock).toHaveBeenNthCalledWith(1, {
      method: 'get',
      url: '/resource',
    })
    expect(requestMock).toHaveBeenNthCalledWith(2, {
      method: 'get',
      url: '/resource/file',
      responseType: 'blob',
    })
    expect(requestMock).toHaveBeenNthCalledWith(3, {
      method: 'post',
      url: '/resource',
      data: { name: 'new' },
    })
    expect(requestMock).toHaveBeenLastCalledWith({
      method: 'delete',
      url: '/resource',
      data: { reason: 'removed' },
    })
  })

  it('maps successful REST responses and keeps cookie transport free of authorization headers', async () => {
    requestMock.mockResolvedValue({
      data: { id: 'resource-1' },
      status: 200,
      headers: { etag: ['one', 'two'], nullable: null },
    })
    const restClient = AxiosRestClient()
    const response = await restClient.get<{ id: string }>('/resource')

    expect(response.body).toEqual({ id: 'resource-1' })
    expect(response.statusCode).toBe(200)
    expect(response.headers).toEqual({ etag: 'one, two' })
    expect(client.defaults.headers.common).not.toHaveProperty('Authorization')
  })

  it('supports base URL, header, query and query-reset configuration', async () => {
    const restClient = AxiosRestClient()
    restClient.setBaseUrl('https://other.example')
    restClient.setHeader('x-request-id', 'request-1')
    restClient.setQueryParam('page', '2')
    restClient.setQueryParam('status', ['active', 'pending'])
    restClient.clearQueryParams()

    expect(client.defaults.baseURL).toBe('https://other.example')
    expect(client.defaults.headers.common).toEqual({ 'x-request-id': 'request-1' })
    expect(client.defaults.params).toEqual({})
  })

  it('maps string, structured, array and unknown request failures', async () => {
    const restClient = AxiosRestClient()
    axiosIsAxiosErrorMock.mockReturnValue(true)
    requestMock.mockRejectedValueOnce({
      response: { data: 'plain failure', status: 400, headers: { reason: 'bad' } },
      message: 'fallback',
    })
    requestMock.mockRejectedValueOnce({
      response: { data: { message: 'structured failure' }, status: 422 },
      message: 'fallback',
    })
    requestMock.mockRejectedValueOnce({
      response: { data: { error: ['first', 'second'] }, status: 429 },
      message: 'fallback',
    })
    requestMock.mockRejectedValueOnce({ message: 'no response' })

    await expect(restClient.get('/plain')).resolves.toMatchObject({
      statusCode: 400,
      errorMessage: 'plain failure',
      headers: { reason: 'bad' },
    })
    await expect(restClient.get('/structured')).resolves.toMatchObject({
      statusCode: 422,
      errorMessage: 'structured failure',
    })
    await expect(restClient.get('/array')).resolves.toMatchObject({
      statusCode: 429,
      errorMessage: 'first, second',
    })
    await expect(restClient.get('/network')).resolves.toMatchObject({
      statusCode: 0,
      errorMessage: 'no response',
    })

    axiosIsAxiosErrorMock.mockReturnValue(false)
    requestMock.mockRejectedValueOnce(new Error('unexpected failure'))
    await expect(restClient.get('/unexpected')).resolves.toMatchObject({
      statusCode: 0,
      errorMessage: 'unexpected failure',
    })
    requestMock.mockRejectedValueOnce('unknown failure')
    await expect(restClient.get('/unknown')).resolves.toMatchObject({
      statusCode: 0,
      errorMessage: 'Unknown request error',
    })
  })
})
