# LocalPassMass v1.10.4 test report

## Release checks
- `manifest.json` parses and reports version `1.10.4`: PASS.
- All extension JavaScript files pass `node --check`: PASS.
- No new mandatory permission was added: PASS.
- Release package contains no remote runtime dependency introduced by this refactor: PASS.

## Chromium interaction smoke tests
Executed in local Chromium with the production `account-meta.js`, `password-generator.js`, `content-fields.js`, `content.js`, and `content.css`, while stubbing only the extension RPC responses.

- A visible password field receives a persistent `L` button without requiring focus/hover: PASS.
- Two password fields receive two independent persistent `L` buttons: PASS.
- When a matching saved credential exists, the page proactively shows one saved-login suggestion: PASS.
- Clicking `L` with a saved credential shows both the credential and the strong-password generator: PASS.
- Saved password starts masked and Show/Hide fetches and clears the plaintext preview correctly: PASS.
- Clicking a saved credential fills both username and password fields: PASS.
- With no saved credential, no automatic empty chooser is shown: PASS.
- Clicking `L` with no saved credential shows a generator-only menu: PASS.
- Generator on an ordinary login password field produces a 20-character password and fills the selected field: PASS.

## Known test boundary
- The Chromium smoke test stubs extension RPC transport; encrypted Vault persistence and host authorization use the existing background/core-service implementation and were verified statically for this change.
- Windows Native Messaging / DPAPI Shared Vault still requires a smoke test on a real Windows installation; this Linux build environment cannot exercise that OS integration end-to-end.
