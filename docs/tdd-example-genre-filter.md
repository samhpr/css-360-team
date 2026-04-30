# TDD Example: Genre Filter

## User Story

As a user, I want a filter to be able to view available events by genre.

## Test First

I added tests in `frontend/src/tests/events.test.js` and `frontend/src/tests/App.test.jsx` that check whether selecting a genre only shows concerts in that category.

Example expectation:

- selecting `Jazz` shows `Jazz by the Lake`
- selecting `Jazz` hides `Northside Noise Fest`

## Red

Before the filter existed, every concert stayed visible regardless of genre selection.

## Green

I added the smallest possible filtering logic in `frontend/src/lib/events.js`:

- if the genre is `All`, return everything
- otherwise return only events that match the selected genre

I also wired the dropdown in `frontend/src/App.jsx` to use that helper.

## Refactor

The filter helper is separate from the UI, so the logic stays easy to test and reuse.

## Result

The app now lets users narrow the concert list by genre.

## Evidence in the Repo

- `frontend/src/lib/events.js`
- `frontend/src/tests/events.test.js`
- `frontend/src/tests/App.test.jsx`
- `frontend/src/App.jsx`

## Short Version for Class

1. Write a failing test for the genre dropdown.
2. Add filtering logic for the selected genre.
3. Confirm the test passes.
4. Keep the logic separate from the UI.
