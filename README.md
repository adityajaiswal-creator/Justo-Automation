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
npm run test:user        # user management
npm run test:shift       # shift management
npm run test:project     # project management
npm run test:rbac        # RBAC create-role
npm run test:user:smoke  # USER-NAV-01
npm run lint
npm run typecheck
npm run check:catalog
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

GitHub Actions runs lint, typecheck, and catalog contract on every PR.

The QA Playwright job runs when `E2E_ENABLED=true` and secrets `E2E_EMAIL` / `E2E_OTP` are set. Optional: `E2E_BASE_URL`.

RBAC role cases assert dependency auto-grants on the form. Only `RBAC-ROLE-001` saves a role unless `E2E_RBAC_SAVE=true`.

## Notes

- One worker by default: tests share a QA tenant.
- Mutating user/shift/project cases are serial and clean up created records in `afterAll`.
- Permission cases that need extra users stay `automated=No` with skip reasons.
- `scripts/automation-flags.mjs` only seeds the first XLSX. After that, Excel is the source of truth.
