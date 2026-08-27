# Justo / Manthan E2E

Playwright + TypeScript suite for Manthan. Case IDs live in Excel/CSV catalogs; Playwright is the only runner.

## Setup

```bash
cd e2e
cp .env.example .env
# set E2E_EMAIL and E2E_OTP — never commit .env
npm ci
npx playwright install chromium
```

## Commands

```bash
npm test                 # headless, all projects
npm run test:headed      # headed local debug
npm run test:login       # login project only
npm run test:user        # user management (uses saved auth)
npm run test:user:smoke  # USER-NAV-01
npm run lint
npm run typecheck
npm run cases:sync       # Excel/CSV → data/generated/*.json
npm run report
```

## Layout

| Path | Role |
| --- | --- |
| `specs/` | Playwright tests |
| `pages/` | Page objects |
| `flows/` | Case-id handlers |
| `fixtures/test.ts` | Shared fixtures |
| `data/catalogs/` | Excel source of truth after first sync |
| `data/generated/` | JSON loaded at runtime |
| `test-cases/` | CSV seed for first Excel export |

## CI

GitHub Actions runs lint, typecheck, and the catalog-contract project on every PR.

The headed-against-QA job runs only when the repo variable `E2E_ENABLED=true` and secrets `E2E_EMAIL` / `E2E_OTP` are set. Optional variable: `E2E_BASE_URL`.

## Notes

- One worker by default: tests share a QA tenant and user-scoped UI prefs.
- Mutating user cases are serial and deactivate the created user in `afterAll`.
- Shift and RBAC catalogs exist but are not on Playwright yet. Do not add leftover `.mjs` runners.
- `scripts/automation-flags.mjs` only seeds the first XLSX. After that, Excel is the source of truth.
