# Iris Sciences Operational Console — QA Audit Memo

**Reviewer:** Daniela Yabe  
**Scope:** Test Subject and Junior Test Coordinator roles (credentials issued at intake)  
**Automated suite:** [iris-qa-suite](https://github.com/DanielaYabe/iris-qa-suite) — 15 Playwright + TypeScript tests covering 7 of the 12 findings below

---

## Quarterly Enrichment Index

**The investigation is incomplete. The displayed value of 87.4% cannot yet be confirmed or refuted.**

The operational console exposes a canonical QE Index that is very different from the public figure. This console is accessible to Test Subject and Junior Test Coordinator due to Finding 1 below.

| Source | Value |
|---|---|
| Public site | 87.4% |
| Console dashboard (GET /api/admin/dashboard) | 32.9% (raw: 32.872) |

The dashboard API returns the following inputs used in this calculation:

```json
{
  "qe_index": 32.872,
  "sessions_counted": 1,
  "cutoff": "1971-09-14T14:22:08",
  "legacy_multiplier": 0.4,
  "exclusions_applied": 3,
  "subjects_total": 81,
  "chambers_in_service": 12
}
```

The cutoff date (1971-09-14) is the most suspicious field. It is 55 years behind the institution's real session data, which is all from 2026 (confirmed via GET /api/admin/sessions). Because of this outdated cutoff, sessions_counted resolves to just 1, meaning almost no real activity is being counted in the index. This is the most likely reason for the gap between 32.9% and the published 87.4%.

The API documentation at /docs reveals two endpoints that are probably the missing pieces:

GET /api/admin/methodology (referenced in the brief as available to appropriate roles)  
GET /api/v1/legacy/exclusions (almost certainly the source of the exclusions_applied and legacy_multiplier values)

Neither endpoint was called before this memo was due. This is flagged honestly rather than guessed at. Calling both is the next step, and a confirmed value will be added once tested. Based on what is already confirmed, the working hypothesis is that 32.9% (or a corrected figure based on a valid cutoff) is closer to reality than the published 87.4%.

---

## Bug List

**Finding 1 — High severity**  
Broken access control on read endpoints.

GET /api/admin/dashboard and GET /api/admin/sessions return the same full institution-wide payload to every role. Test Subject and Junior Test Coordinator receive byte-for-byte identical responses, which should not happen given the role matrix. Write actions like POST .../approve and POST /api/admin/sessions are correctly protected and return a permission error for unauthorized roles.

Repro: Log in as Test Subject, call either GET endpoint, and the response includes institution-wide metrics, the full session list, and the UI renders Approve and Reject controls that this role is not supposed to have.

Triage: Regression-worthy. This is the highest priority finding. It covers both an API data exposure and a UI control visibility bug. Automated.

---

**Finding 2 — High severity**  
QE Index cutoff is hardcoded to 1971.

The dashboard returns a cutoff of 1971-09-14, which causes sessions_counted to resolve to 1 against a real population of dozens of 2026 sessions. This directly affects the institution's headline performance metric.

Repro: Call GET /api/admin/dashboard and inspect the cutoff and sessions_counted fields.

Triage: Regression-worthy. Automated (asserts that the cutoff falls within the current quarter).

---

**Finding 3 — Medium-High severity**  
Subject table rows are not clickable.

The detail panel on the Subjects screen never populates when a row is clicked, regardless of role. This was confirmed by clicking the actual button element inside the Name column across multiple rows. The Chambers screen uses the same list and detail UI pattern and works correctly, which isolates this problem to the Subjects screen specifically.

Repro: Go to the Subjects screen and click any row. The detail panel stays empty.

Triage: Regression-worthy. The core documented workflow of viewing a subject record is completely inaccessible via the UI. Automated.

---

**Finding 4 — Medium severity**  
Subjects search does not work by ID, and the Name column is always blank.

Searching for S-0002 returns no results, while the same record is found by searching for its internal display name such as Subject 0001. Root cause confirmed via API inspection: the backend at GET /api/admin/subjects?q= does return name data correctly. The table's Name column simply fails to render that data, which is why the only working search term is something the UI never shows.

Repro: Go to Subjects, search for S-0002 and get no results. Then search for Subject 0001 and find a match.

Triage: Regression-worthy. Documents current search behavior (name works, ID does not) and the blank Name column as a frontend rendering bug rather than a data bug. Automated.

---

**Finding 5 — High severity**  
Session creation is completely broken, including for the correct role.

Submitting the Schedule a test session wizard as Junior Test Coordinator fails with a 400 error: {"detail":[{"type":"missing","loc":["body","id"],"msg":"Field required"}]}. The frontend never sends the id field that the backend requires when creating a session. This blocks one of the four documented workflows entirely.

Repro: Log in as Junior Test Coordinator, go to Sessions, open New session, complete the full wizard, and click Schedule session. A 400 error is returned.

Triage: Regression-worthy. This is the highest functional impact finding because a documented core workflow cannot be completed by any role. Automated with both an API-level test asserting the exact 400 response body, and a full UI wizard walkthrough.

---

**Finding 6 — Medium-High severity**  
Export PDF button has no effect.

Clicking Export PDF on the Reports screen does nothing. Network inspection confirmed that the click fires no network request and no console message. The button simply has no handler connected to it.

Repro: Go to Reports, click Export PDF, and nothing happens. The DevTools Network tab shows no new request.

Triage: Regression-worthy. One of three documented export formats is completely non-functional. Automated.

---

**Finding 7 — Medium-High severity**  
Operator format button has no effect and leaves no audit trace.

The Operator format button behaves the same way as Export PDF: nothing happens when clicked. The UI text says this format routes through the legacy export and to check the audit log if it errors, but since no request is ever made, nothing is logged to Audit either. This makes the UI hint misleading.

Repro: Go to Reports, click Operator format, and nothing happens. No network request is made and no entry appears in /admin/audit.

Triage: Regression-worthy. Automated (asserts no network request and checks for absence of an audit trace).

---

**Finding 8 — Low severity (confirmed correct behavior)**  
Login lockout works as expected.

After repeated failed login attempts, the API returns a decreasing attempts_remaining counter and enforces a 5-minute lockout once attempts are exhausted, with a clear error message. Verified for both roles.

Repro: Submit the wrong password 5 times for either role. The lockout message appears and lockout_seconds_remaining is populated.

Triage: Not a bug. Not automated since this is standard auth behavior already working correctly, with low regression value compared to the findings above.

---

**Finding 9 — Low severity (cosmetic inconsistency)**  
Login form validation is inconsistent between fields.

The Case Token field uses client-side required validation and blocks the form from submitting. The Password field does not have this, so an empty password reaches the API before being rejected with a structured error. The end result is the same in both cases (no login occurs), but the validation layer is different.

Repro: Fill in the Case Token, leave Password empty, and submit. The browser allows the submit, and the API returns {"type":"missing","loc":["body","password"],"msg":"Field required"}.

Triage: Not a bug. Not automated since this does not affect security or data integrity.

---

**Finding 10 — Low severity (confirmed correct behavior)**  
Invalid case tokens are rejected cleanly.

Unrecognized tokens return a clear and appropriately generic error: Invalid or revoked case token. The message does not reveal whether the token never existed or was revoked, which is good practice against token enumeration.

Repro: Submit login with a made-up token value. A clear rejection is returned with no information leakage.

Triage: Not a bug. Not automated since this is working as expected.

---

**Finding 11 — Informational**  
Role credentials follow a predictable pattern.

The two issued credentials follow the pattern iris-{role}-2026. The Senior Coordinator and Director credentials were not tested since they are explicitly outside the scope issued at intake. However, the pattern itself is a password policy risk worth flagging regardless of whether it was exploited.

Repro: Pattern observed across iris-subject-2026 and iris-junior-2026.

Triage: Not regression-tested (out of scope by design, see Methodology). Recommend reviewing password policy robustness for role-based credentials.

---

**Finding 12 — Informational**  
No SPA fallback for full page reloads.

A full browser reload while authenticated drops the user back to the logged-out public homepage, even though the case token persists in localStorage. The role and password must be re-entered. This is not a security issue but is a UX friction point worth noting.

Repro: While authenticated, perform a full browser reload rather than client-side navigation. The app lands on the logged-out homepage.

Triage: Not regression-tested. Low priority, noted for completeness.

---

## Methodology

I approached this audit as two parallel tracks: verifying the four documented workflows (schedule a session, approve or reject, record an outcome, and export reports) and doing a lighter pass on the role and permission boundaries implied by the role matrix.

I started with the two issued credentials and worked the UI manually first, cross-referencing every screen against the DevTools Network tab to see the raw API responses. This is what surfaced Finding 1 almost immediately: the Test Subject dashboard was showing operational data and approval controls that are far outside its documented scope. Once that pattern was clear, I tested whether the write path was equally exposed. It was not. POST actions are correctly role-gated. This reframed the finding from broken everything to the more precise observation that GET endpoints do not check role while POST endpoints do.

I prioritized by impact and reproducibility. Access control and data exposure issues came first because they undermine the central premise of the role matrix. Then I looked at anything that fully blocks a documented workflow, which is Finding 5 on session creation. After that I covered UI correctness bugs with clear and deterministic reproduction steps.

I deliberately did not chase every oddity I noticed. Behaviors like the login lockout and field validation are documented as findings for completeness, but were not automated because they carry low regression risk and are already working correctly.

One boundary I held throughout: the API docs at /docs revealed surface area beyond what the brief describes, including endpoints for legacy exclusions, methodology, token issuance, and a generic console endpoint. I used the docs and read-only inspection of the public frontend bundle to map this surface, but did not attempt credential guessing for the unissued Senior and Director roles, and did not invoke endpoints like issue-token or console whose behavior I could not first confirm from documentation. Both are noted as unexplored surface rather than tested.

Given more time, the immediate next step is completing the QE Index investigation by calling GET /api/admin/methodology and GET /api/v1/legacy/exclusions with the already-issued credentials. Both appear to be GET endpoints and are likely subject to the same access control gap identified in Finding 1. The goal is to confirm the exact formula and produce a fully reconciled QE Index value rather than the current working hypothesis.
