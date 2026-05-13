# Static Analysis

## Tools

- **Prettier** (formatter) — config at `frontend/.prettierrc.json`
- **ESLint** (linter) — config at `frontend/eslint.config.js`
- **npm audit** (security) — built into npm, no config needed

## Local commands

From the `frontend/` folder:

```bash
npm run lint           # run ESLint
npm run format         # auto-format with Prettier
npm run format:check   # check formatting without changing files
npm audit              # check for known vulnerabilities
```

## Enforcement

GitHub Actions runs all three on every push and pull request to `main`. The
workflow is at `.github/workflows/ci.yml`. If lint or format check fails, the
PR shows a red check and cannot merge once branch protection is on.

To require a green check before merge:
**Repo Settings → Branches → Branch protection rule for `main`** → enable
"Require status checks to pass before merging" and select the CI job.
