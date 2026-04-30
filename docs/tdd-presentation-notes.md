# TDD Presentation Notes

## What We Did

For Sprint 1, we treated the key user stories as test targets first, then built the minimum UI and helper logic needed to make those tests pass.

## Story Coverage

1. Sort by date
   - Test: concert results appear in ascending date order
   - Code: `sortByDateAscending` in `frontend/src/lib/events.js`

2. Clear search button
   - Test: clicking Clear resets the search input without refreshing the page
   - Code: state reset in `frontend/src/App.jsx`

3. Partial search matching
   - Test: short or incomplete text still returns matching concerts
   - Code: `searchEvents` in `frontend/src/lib/events.js`

4. Genre filter
   - Test: selecting a genre narrows the visible events
   - Code: `filterByGenre` in `frontend/src/lib/events.js`

5. Calendar view
   - Test: concerts can be grouped and displayed by date
   - Code: `getCalendarMap` plus `EventCalendar.jsx`

## Why This Counts as TDD Support

- The sprint stories are covered by executable tests.
- The logic is separated into small helper functions that are easy to test.
- The GitHub Actions workflow runs the tests automatically on push and pull request.

## What We Can Say in Presentation

"We used a test-first approach for the core sprint behaviors. Each major user story has at least one automated test, and the CI pipeline runs those tests on every pull request so the team can catch regressions early."

## Role Statement

"I’m focused on TDD and test automation, which is part of QA."

## Files to Show

- `frontend/src/tests/events.test.js`
- `frontend/src/tests/App.test.jsx`
- `frontend/src/lib/events.js`
- `.github/workflows/ci.yml`
