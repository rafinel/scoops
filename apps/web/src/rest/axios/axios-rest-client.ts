import axios from 'axios'

import type { RestClient } from '@scoops/core/shared/interfaces'

import { request } from '@/rest/axios/utils'

const REST_REQUEST_TIMEOUT_MS = 15_000

export const AxiosRestClient = (baseUrl?: string): RestClient => {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: REST_REQUEST_TIMEOUT_MS,
  })

  return {
    get<ResponseBody>(url: string) {
      return request<ResponseBody>(client, { method: 'get', url })
    },

    getFile(url) {
      return request<File>(client, { method: 'get', url, responseType: 'blob' })
    },

    post<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(client, { method: 'post', url, data: body })
    },

    postFormData<ResponseBody>(url: string, body: FormData) {
      return request<ResponseBody>(client, { method: 'post', url, data: body })
    },

    patch<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(client, { method: 'patch', url, data: body })
    },

    put<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(client, { method: 'put', url, data: body })
    },

    delete<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(client, { method: 'delete', url, data: body })
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
