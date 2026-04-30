# TDD Example: Concert Calendar

## User Story

As a user, I expect the front page website to show me a calendar with concerts pinned on the dates they are happening.

## Test First

I added a unit test in `frontend/src/tests/events.test.js` that checks whether the event data can be grouped by date.

I also added a UI test in `frontend/src/tests/App.test.jsx` that checks whether the calendar section appears on the page.

## Red

Before the calendar logic existed, there was no grouped date structure to display.

## Green

I added a helper in `frontend/src/lib/events.js` that groups concerts into a date-keyed object, then I rendered that grouped result in `frontend/src/components/EventCalendar.jsx`.

## Refactor

The grouping logic lives outside the component, which keeps the calendar display simple and testable.

## Result

The front page now shows a calendar-style section with concerts pinned to their event dates.

## Evidence in the Repo

- `frontend/src/lib/events.js`
- `frontend/src/tests/events.test.js`
- `frontend/src/tests/App.test.jsx`
- `frontend/src/components/EventCalendar.jsx`

## Short Version for Class

1. Write a failing test for grouping concerts by date.
2. Add a helper that builds a date-based calendar map.
3. Render the grouped data in the UI.
4. Confirm the tests pass.
