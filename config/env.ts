import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and fill in your case credentials.`
    );
  }
  return value;
}

export type RoleKey = 'testSubject' | 'juniorCoordinator';

export interface RoleCredentials {
  roleId: string;
  label: string;
  password: string;
}

/**
 * Always exactly one trailing slash. Playwright's baseURL + relative-path
 * resolution follows WHATWG URL rules: a path starting with "/" replaces
 * the base's entire path (dropping "/api"), so client paths must be
 * written without a leading slash, and the base must end with one.
 */
function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export const env = {
  baseUrl: required('BASE_URL'),
  apiBaseUrl: withTrailingSlash(required('API_BASE_URL')),
  caseToken: required('CASE_TOKEN'),
  roles: {
    testSubject: {
      roleId: required('TEST_SUBJECT_ROLE_ID'),
      label: 'Test Subject',
      password: required('TEST_SUBJECT_PASSWORD'),
    },
    juniorCoordinator: {
      roleId: required('JUNIOR_COORDINATOR_ROLE_ID'),
      label: 'Junior Test Coordinator',
      password: required('JUNIOR_COORDINATOR_PASSWORD'),
    },
  } satisfies Record<RoleKey, RoleCredentials>,
};
