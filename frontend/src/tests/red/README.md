RED / Spec Tests

Purpose
- This folder contains intentionally failing "RED" tests and specification-level acceptance tests written by the TDD specialist.
- Use these files as a requirements-first spec for developers: they describe desired behavior as executable tests.
- These files are meant to stay separate from the normal `main` test flow so they do not break CI for the team.

Files
- `red_sprint1_ui_failing.test.jsx` — intentionally failing assertions for Sprint 1 user stories (demo red tests).
- `RED_demo.test.jsx` — small UI-level failing demos used for teaching the red step.
- `RED_events_demo.test.js` — unit-level failing demos for event utility functions.
- `events_api_contract.test.js` — official red spec for an async events API (fetch/get/add/update/delete).
- `sprint2_ui_acceptance_red.test.jsx` — Sprint 2 UI acceptance RED specs.
- `sprint2_data_api_contract_red.test.js` — Sprint 2 API/data/security RED specs.
- `README.md` — run and handoff notes for the RED folder.

How to use
1. Checkout the branch `test/red-specs` to see these tests in place.
2. Developers should implement features to make the corresponding acceptance tests in the main test suite pass.
3. Keep these RED files on the `test/red-specs` branch or mark them skipped if you want them visible but excluded from CI.

Commands
```bash
cd frontend
# run only the official CI-safe tests
npm run test:official

# run just the red tests
npm run test:red

# run all tests
npm test
```

Notes
- Do NOT merge intentionally-failing RED tests into `main` without skipping or removing them; they will break CI.
- The `sprint1_acceptance_ui.test.jsx` file (kept in the main tests) describes the acceptance criteria and should be used as the authoritative spec for what must pass.
- Use `npm run test:official` in the shared project, and use `npm run test:red` when you want to validate the RED specs directly.
