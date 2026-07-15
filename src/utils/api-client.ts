// ─── src/utils/api-client.ts ─────────────────────────────────────────────────
// Thin HTTP client (axios-based) used by both API and AI step definitions.
// Captures request + response evidence for PDF reporting.

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { ENV } from '../support/env'

export interface ApiEvidence {
  method:   string
  url:      string
  headers:  Record<string, string>
  body?:    unknown
  status:   number
  response: unknown
  durationMs: number
}

export class ApiClient {
  private baseUrl: string
  private token?: string
  private cookies: Record<string, string> = {}

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string) {
    this.token = token
  }

  clearToken() {
    this.token = undefined
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra }
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`
    const cookieHeader = Object.entries(this.cookies).map(([key, value]) => `${key}=${value}`).join('; ')
    if (cookieHeader) headers['Cookie'] = cookieHeader
    if (this.baseUrl === ENV.AI_URL && ENV.INTERNAL_API_TOKEN) {
      headers['X-Internal-Token'] = ENV.INTERNAL_API_TOKEN
    }
    return headers
  }

  private storeCookies(response: AxiosResponse) {
    const setCookie = response.headers?.['set-cookie']
    if (!Array.isArray(setCookie)) return
    setCookie.forEach((raw) => {
      const [pair] = raw.split(';')
      const separator = pair.indexOf('=')
      if (separator <= 0) return
      const name = pair.slice(0, separator).trim()
      const value = pair.slice(separator + 1).trim()
      if (value) this.cookies[name] = value
      else delete this.cookies[name]
    })
  }

  async request(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options: { body?: unknown; params?: Record<string, string>; headers?: Record<string, string> } = {}
  ): Promise<{ evidence: ApiEvidence; response: AxiosResponse }> {
    const url = `${this.baseUrl}${path}`
    const headers = this.buildHeaders(options.headers)
    const t0 = Date.now()

    let response: AxiosResponse
    try {
      const cfg: AxiosRequestConfig = {
        method,
        url,
        headers,
        params: options.params,
        data: options.body,
        validateStatus: () => true, // never throw on HTTP errors
      }
      response = await axios(cfg)
      this.storeCookies(response)
    } catch (err: any) {
      // Network error — create a fake response for evidence
      const evidence: ApiEvidence = {
        method,
        url,
        headers,
        body: options.body,
        status: 0,
        response: { error: err.message },
        durationMs: Date.now() - t0,
      }
      throw Object.assign(err, { evidence })
    }

    const evidence: ApiEvidence = {
      method,
      url,
      headers,
      body: options.body,
      status: response.status,
      response: response.data,
      durationMs: Date.now() - t0,
    }
    return { evidence, response }
  }

  async get(path: string, params?: Record<string, string>): Promise<{ evidence: ApiEvidence; response: AxiosResponse }> {
    return this.request('GET', path, { params })
  }

  async post(path: string, body?: unknown): Promise<{ evidence: ApiEvidence; response: AxiosResponse }> {
    return this.request('POST', path, { body })
  }

  async patch(path: string, body?: unknown): Promise<{ evidence: ApiEvidence; response: AxiosResponse }> {
    return this.request('PATCH', path, { body })
  }

  async put(path: string, body?: unknown): Promise<{ evidence: ApiEvidence; response: AxiosResponse }> {
    return this.request('PUT', path, { body })
  }

  async delete(path: string): Promise<{ evidence: ApiEvidence; response: AxiosResponse }> {
    return this.request('DELETE', path)
  }
}

// Singleton clients
export const apiClient = new ApiClient(ENV.API_URL)
export const aiClient  = new ApiClient(ENV.AI_URL)
