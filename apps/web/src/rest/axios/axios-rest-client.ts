import axios from 'axios'

import type { AuthSession } from '@scoops/core/identity/domain/structures'
import type { RestClient } from '@scoops/core/shared/interfaces'

import { request } from '@/rest/axios/utils'

const REST_REQUEST_TIMEOUT_MS = 15_000

type SessionAccessor = () => Promise<AuthSession | null>

export const AxiosRestClient = (
  baseUrl?: string,
  sessionAccessor?: SessionAccessor,
): RestClient => {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: REST_REQUEST_TIMEOUT_MS,
  })

  return {
    get<ResponseBody>(url: string) {
      return request<ResponseBody>(client, { method: 'get', url }, sessionAccessor)
    },

    getFile(url) {
      return request<File>(
        client,
        { method: 'get', url, responseType: 'blob' },
        sessionAccessor,
      )
    },

    post<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(
        client,
        { method: 'post', url, data: body },
        sessionAccessor,
      )
    },

    postFormData<ResponseBody>(url: string, body: FormData) {
      return request<ResponseBody>(
        client,
        { method: 'post', url, data: body },
        sessionAccessor,
      )
    },

    patch<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(
        client,
        { method: 'patch', url, data: body },
        sessionAccessor,
      )
    },

    put<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(
        client,
        { method: 'put', url, data: body },
        sessionAccessor,
      )
    },

    delete<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(
        client,
        { method: 'delete', url, data: body },
        sessionAccessor,
      )
    },

    setBaseUrl(url) {
      client.defaults.baseURL = url
    },

    setHeader(key, value) {
      client.defaults.headers.common[key] = value
    },

    setAuthorization(token) {
      client.defaults.headers.common.Authorization = `Bearer ${token}`
    },

    setQueryParam(key, value) {
      const params = (client.defaults.params ?? {}) as Record<string, string | string[]>

      client.defaults.params = {
        ...params,
        [key]: value,
      }
    },

    clearQueryParams() {
      client.defaults.params = {}
    },
  }
}
