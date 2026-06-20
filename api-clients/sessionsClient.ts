import type { APIRequestContext } from '@playwright/test';
import { createHttpClient, type ApiResult } from './httpClient';

export interface SessionRecord {
  id: string;
  subject_id: string;
  chamber_id: string;
  observer_role_id: string | null;
  scheduled_for: string;
  state: string;
  completed_at: string | null;
}

/** Matches the exact body shape the frontend wizard currently sends (no `id`). */
export interface FrontendCreateSessionPayload {
  subject_id: string;
  chamber_id: string;
  apparatus_id: string;
  scheduled_for: string;
}

/** Wraps GET /admin/sessions, POST .../approve, POST .../reject, POST /admin/sessions. */
export class SessionsClient {
  private readonly http;

  constructor(request: APIRequestContext) {
    this.http = createHttpClient(request);
  }

  async list(state?: string): Promise<ApiResult<SessionRecord[]>> {
    return this.http.get<SessionRecord[]>('admin/sessions', state ? { state } : undefined);
  }

  async approve(sessionId: string): Promise<ApiResult<unknown>> {
    return this.http.post(`admin/sessions/${sessionId}/approve`);
  }

  async reject(sessionId: string): Promise<ApiResult<unknown>> {
    return this.http.post(`admin/sessions/${sessionId}/reject`);
  }

  /** Calls the real create endpoint. See tests/api/sessions.spec.ts for why this is safe today. */
  async create(payload: FrontendCreateSessionPayload): Promise<ApiResult<unknown>> {
    return this.http.post('admin/sessions', payload);
  }
}
