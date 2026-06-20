import type { APIRequestContext } from '@playwright/test';
import { createHttpClient, type ApiResult } from './httpClient';
import { env, type RoleKey } from '../config/env';

export interface RoleInfo {
  id: number;
  slug: string;
  name: string;
  documented: boolean;
}

export interface LoginResponse {
  role: RoleInfo;
}

/** Wraps POST /auth/login and GET /auth/me. */
export class AuthClient {
  private readonly http;

  constructor(request: APIRequestContext) {
    this.http = createHttpClient(request);
  }

  async login(roleKey: RoleKey): Promise<ApiResult<LoginResponse>> {
    const role = env.roles[roleKey];
    return this.http.postForm<LoginResponse>('auth/login', {
      role_id: role.roleId,
      password: role.password,
    });
  }

  async me(): Promise<ApiResult<LoginResponse>> {
    return this.http.get<LoginResponse>('auth/me');
  }
}
