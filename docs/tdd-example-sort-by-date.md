# TDD Example: Sort Concerts by Date

## User Story

As a user, I want to sort concert results by date so that I can see the soonest shows first.

## Test First

I wrote a unit test in `frontend/src/tests/events.test.js` that checks whether the concert list is returned in ascending date order.

Example expectation:

- `Jazz by the Lake` appears before `Northside Noise Fest`
- the earliest concert date appears first in the list

## Red

Before the sorting logic existed, this test would fail because the concerts would remain in their original order.

## Green

I added the smallest possible function in `frontend/src/lib/events.js`:

- `sortByDateAscending(events)`
- it copies the array
- it sorts by the `date` field from earliest to latest

After that change, the test passed.

## Refactor

Once the test passed, I kept the function small and reusable so the app could use it in the main UI without changing the behavior.

## Result

The feature is now covered by an automated test and the app displays concerts in date order.

## Evidence in the Repo

- `frontend/src/lib/events.js`
- `frontend/src/tests/events.test.js`
- `frontend/src/App.jsx`

## Short Version for Class

1. Write a failing test for date sorting.
2. Add the smallest function to sort by date.
3. Confirm the test passes.
4. Reuse the function in the UI.
