import type { APIRequestContext } from '@playwright/test';
import { createHttpClient, type ApiResult } from './httpClient';

export interface DashboardSummary {
  qe_index: number;
  sessions_counted: number;
  cutoff: string;
  legacy_multiplier: number;
  exclusions_applied: number;
  subjects_total: number;
  chambers_in_service: number;
  open_incidents: number;
  pending_approvals: number;
}

/** Wraps GET /admin/dashboard. */
export class DashboardClient {
  private readonly http;

  constructor(request: APIRequestContext) {
    this.http = createHttpClient(request);
  }

  async getDashboard(): Promise<ApiResult<DashboardSummary>> {
    return this.http.get<DashboardSummary>('admin/dashboard');
  }
}
