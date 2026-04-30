# TDD Example: Partial Search Matching

## User Story

As a user, I should be able to return the items containing the sequence of characters entered, not excluding incomplete entries.

## Test First

I added a unit test in `frontend/src/tests/events.test.js` that checks whether search returns matches for partial text and short prefixes.

Example expectation:

- searching `north` returns `Northside Noise Fest`
- searching `j` returns `Jazz by the Lake`

## Red

Before the search logic existed, partial inputs would not reliably return the expected concert matches.

## Green

I added a small search helper in `frontend/src/lib/events.js` that:

- trims the query
- compares it against name, location, venue, and genre
- uses partial matching instead of exact matching

After that change, the test passed.

## Refactor

The helper stays reusable so the same search behavior can be used anywhere in the app.

## Result

The search bar now supports broad and incomplete searches, which makes it easier to find events quickly.

## Evidence in the Repo

- `frontend/src/lib/events.js`
- `frontend/src/tests/events.test.js`
- `frontend/src/App.jsx`

## Short Version for Class

1. Write a failing test for partial search.
2. Add a helper that uses `includes` on searchable fields.
3. Confirm the test passes.
4. Reuse the helper in the UI.
