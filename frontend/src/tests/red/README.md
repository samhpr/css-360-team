RED / Spec Tests

Purpose
- This folder contains intentionally failing "RED" tests and specification-level acceptance tests written by the TDD specialist.
- Use these files as a requirements-first spec for developers: they describe desired behavior as executable tests.

Files
- `RED_sprint1_all_user_stories_failing.test.jsx` — intentionally failing assertions for Sprint 1 user stories (demo red tests).
- `RED_demo.test.jsx` — small UI-level failing demos used for teaching the red step.
- `RED_events_demo.test.js` — unit-level failing demos for event utility functions.
- `OFFICIAL_RED_events_api.test.js` — official red spec for an async events API (fetch/get/add/update/delete).

How to use
1. Checkout the branch `test/red-specs` to see these tests in place.
2. Developers should implement features to make the corresponding acceptance tests in the main test suite pass.
3. Keep these RED files on the `test/red-specs` branch or mark them skipped if you want them visible but excluded from CI.

Commands
```bash
cd frontend
# run just the red tests
npm test -- RED_sprint1_all_user_stories_failing

# run all tests
npm test
```

Notes
- Do NOT merge intentionally-failing RED tests into `main` without skipping or removing them; they will break CI.
- The `OFFICIAL_RED_sprint1_acceptance.test.jsx` file (kept in the main tests) describes the acceptance criteria and should be used as the authoritative spec for what must pass.
