# Tester Playbook - Sprint 1

## Your Role (TDD + CI/CD)

1. Write failing tests first from user stories.
2. Keep tests green before merge.
3. Block merges when CI fails.
4. Track coverage of user stories in test files.

## Story-to-Test Map

1. Sort by date ascending:
   - frontend/src/tests/events.test.js
2. Clear button resets search:
   - frontend/src/tests/App.test.jsx
3. Front page shows upcoming concerts:
   - frontend/src/tests/App.test.jsx
4. Calendar shows concerts by date:
   - frontend/src/tests/App.test.jsx
5. Intuitive UI and stable accessibility basics:
   - frontend/src/tests/App.test.jsx
6. Partial matching search:
   - frontend/src/tests/events.test.js
   - frontend/src/tests/App.test.jsx
7. Genre filter:
   - frontend/src/tests/events.test.js
   - frontend/src/tests/App.test.jsx
8. Name, location, venue, ticket link present:
   - frontend/src/tests/App.test.jsx

## Definition of Done (Sprint 1)

1. All tests pass locally and in GitHub Actions.
2. PR includes tests for any changed behavior.
3. UI behavior for story acceptance criteria is demonstrated.
4. No broken build on main.

## Pull Request Checklist

1. Branch name starts with feature/ or test/.
2. Linked user story in PR description.
3. Added or updated tests.
4. CI checks passing.
5. At least one reviewer approval.

## Future CI Enhancements (Sprint 2+)

1. Add linting check.
2. Add coverage thresholds.
3. Add end-to-end smoke tests.
4. Add branch protection rules requiring CI and review.
