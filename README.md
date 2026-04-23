# CSS 360 Team Project - Sprint 1 Starter

This repository contains a Sprint 1 frontend baseline for Local Live, a concert discovery web app.

## Sprint 1 Coverage

- Upcoming concerts on home page
- Concert details (name, location, venue, ticket link)
- Date-based ordering (soonest first)
- Search with partial matching
- Clear button on search input
- Genre filter
- Calendar view with events grouped by date
- Basic accessibility affordances

## Local Development

1. Install Node.js 20+
2. Move into frontend folder
3. Install dependencies
4. Start development server

```bash
cd frontend
npm install
npm run dev
```

## Test Commands

```bash
cd frontend
npm test
npm run test:watch
```

## CI/CD

GitHub Actions workflow is at .github/workflows/ci.yml.

It runs on push and pull request to main and does:

1. npm install
2. npm test
3. npm run build

## Suggested Branching

1. Create feature branches from main (example: feature/story-sort-by-date)
2. Open pull request to main
3. Require CI to pass before merge
