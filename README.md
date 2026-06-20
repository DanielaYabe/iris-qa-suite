# Iris QA Suite

Playwright + TypeScript regression suite for the Iris Sciences
Operational Console, covering 7 of 12 bugs confirmed during a QA
audit (the remaining 5 were verified-correct behaviors — e.g.
account lockout, form validation — with low regression value, so
they were intentionally not automated).

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in your own Iris Sciences case token and role credentials.
3. `npm install`
4. `npx playwright test`

After a run, view results with `npx playwright show-report`.

### Security note

Credentials are never committed. `.env` is git-ignored; only
`.env.example` (with blank values) is tracked. Anyone running this suite
should populate their own `.env` with their own case token and role
passwords before running anything.

## Architecture

```
config/        env.ts — the only file that reads process.env
api-clients/   one wrapper per resource (auth, dashboard, sessions),
               plus an internal httpClient.ts shared by all three
pages/         one Page Object per screen (Login, Dashboard, Subjects,
               Sessions, Reports) — tests never call page.locator() directly
fixtures/      auth.fixture.ts — pre-authenticated page/API fixtures per role
tests/
  smoke.spec.ts     runs first; fails fast on bad credentials/env
  api/              dashboard.spec.ts, sessions.spec.ts
  ui/               subjects.spec.ts, approvals.spec.ts, sessions.spec.ts,
                    reports.spec.ts
```

Two of the five requested page objects double up on a closely related
screen rather than getting a sixth class of their own:

- `DashboardPage` also drives the Approvals queue (`gotoApprovalsQueue()`),
  since `/admin` and `/admin/approvals` render the identical widget.
- `ReportsPage` also drives the Audit log (`gotoAuditLog()`), since the
  only thing this suite checks the audit log for is "did a report-export
  action leave a trace."

### Concurrency note

Login sets a per-context, `HttpOnly` + `Secure` session cookie
(`iris_role_session`, 8h expiry) — every test gets its own browser/API
context with its own independent cookie jar, so role-sensitive tests don't
interfere with each other even running in parallel. (Earlier in development
this README claimed the opposite — that all roles shared one mutable
server-side role state tied to the case token — based on a `Set-Cookie`
header the exploration tooling didn't surface. Confirmed otherwise with a
raw HTTP request once a test started failing in a way that theory couldn't
explain.) Every admin endpoint does still require an active login in that
context first — GET endpoints just don't check *which* role is logged in
(that's bug #1).

### Test tags

Every test is tagged with severity, layer, and status, so you can filter:

```
npx playwright test --grep @critical      # severity: @critical / @high / @medium
npx playwright test --grep @api           # layer: @api / @ui
npx playwright test --grep @known-bug     # status: see below
npx playwright test --project=smoke       # or --project=api / --project=ui
```

### Expected pass vs. expected fail

- `@regression` tests assert **correct/protected** behavior and are
  expected to **pass** today (e.g. the approve endpoint correctly
  rejecting Test Subject).
- `@known-bug` tests assert the **correct/desired** behavior for a
  confirmed bug and are marked `test.fail()`, so they're expected to
  **fail** today — the suite still reports green overall, but each failure
  is clearly labeled, with a comment explaining which audit finding it
  documents. The moment a bug is fixed, Playwright reports an *unexpected
  pass* on that test, which is the signal to remove its `test.fail()` line.
- `@smoke` tests are the login sanity check that gates everything else.

One known-bug pair (`tests/api/sessions.spec.ts` and
`tests/ui/sessions.spec.ts`, bug #5) calls the real session-creation
endpoint/wizard. That's intentional and safe today only because the
backend's own request-body validation rejects the call (missing `id`
field) before any row is written — if that bug is ever fixed, these two
tests will start actually creating sessions as a side effect of
"unexpectedly passing," which is part of why they're flagged that way.

## Bug coverage

| # | Severity | Bug | Test(s) |
|---|----------|-----|---------|
| 1 | HIGH | Broken access control: GET /dashboard & /sessions ignore role | `tests/api/dashboard.spec.ts`, `tests/api/sessions.spec.ts` (scope), `tests/ui/approvals.spec.ts` (UI), `tests/api/sessions.spec.ts` (approve-protection regression) |
| 2 | HIGH | QE Index cutoff hardcoded to 1971 | `tests/api/dashboard.spec.ts` |
| 3 | MEDIUM-HIGH | Subjects row click never populates detail panel | `tests/ui/subjects.spec.ts` |
| 4 | MEDIUM | Subjects search fails by ID; Name column always blank | `tests/ui/subjects.spec.ts` |
| 5 | HIGH | Session creation 400s — frontend omits required `id` | `tests/api/sessions.spec.ts`, `tests/ui/sessions.spec.ts` |
| 6 | MEDIUM-HIGH | "Export PDF" button is dead (no handler wired up) | `tests/ui/reports.spec.ts` |
| 7 | MEDIUM-HIGH | "Operator format" button is dead (no handler, no audit trace) | `tests/ui/reports.spec.ts` |
