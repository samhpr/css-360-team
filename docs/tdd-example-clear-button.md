# TDD Example: Clear Search Button

## User Story

As a user, I want a "Clear" button on the search bar so that I can reset my search and start a new one without refreshing the page.

## Test First

I added a UI test in `frontend/src/tests/App.test.jsx` that checks whether:

- the search input accepts typed text
- clicking the Clear button empties the search field
- the page does not need to refresh

## Red

Before the button behavior existed, this test would fail because the search input would keep the typed text.

## Green

I added the smallest possible UI behavior in `frontend/src/App.jsx`:

- a `Clear` button
- an `onClick` handler that resets the search state to an empty string

After that, the test passed.

## Refactor

I kept the state update simple so the clear action stays easy to read and maintain.

## Result

The search bar now has a working Clear button that resets the current query instantly.

## Evidence in the Repo

- `frontend/src/App.jsx`
- `frontend/src/tests/App.test.jsx`

## Short Version for Class

1. Write a failing test for the Clear button.
2. Add a button that resets the search state.
3. Confirm the test passes.
4. Keep the behavior simple and reusable.
