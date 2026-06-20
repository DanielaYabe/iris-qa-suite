import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../config/env';

export interface ApiResult<T> {
  response: APIResponse;
  status: number;
  body: T;
}

/**
 * Thin wrapper around Playwright's APIRequestContext. Centralizes the
 * X-Case-Token header injection and JSON parsing so resource-specific
 * clients (auth, dashboard, sessions) never touch raw request/headers.
 */
export class HttpClient {
  constructor(private readonly request: APIRequestContext) {}

  async get<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>> {
    const response = await this.request.get(path, { headers: this.headers(), params });
    return this.toResult<T>(response);
  }

  async post<T>(path: string, data?: unknown): Promise<ApiResult<T>> {
    const response = await this.request.post(path, { headers: this.headers(), data });
    return this.toResult<T>(response);
  }

  async postForm<T>(path: string, form: Record<string, string>): Promise<ApiResult<T>> {
    const response = await this.request.post(path, {
      headers: this.headers({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      form,
    });
    return this.toResult<T>(response);
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    return { 'X-Case-Token': env.caseToken, ...extra };
  }

  private async toResult<T>(response: APIResponse): Promise<ApiResult<T>> {
    let body: T;
    try {
      body = (await response.json()) as T;
    } catch {
      body = undefined as unknown as T;
    }
    return { response, status: response.status(), body };
  }
}

export function createHttpClient(request: APIRequestContext): HttpClient {
  return new HttpClient(request);
}
