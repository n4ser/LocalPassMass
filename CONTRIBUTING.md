# Contributing to LocalPassMass

Project maintainer: **n4ser / inaser**.

Thanks for helping improve a local-first password manager. Security, predictable behavior and data compatibility come before new features.

## Before opening a pull request

1. Open an issue describing the problem, expected behavior and Chrome version (avoid including real credentials or backups).
2. Keep changes focused. Existing encrypted vault data and backup formats must remain readable.
3. Add a regression test for any fixed bug when it can be tested without live secrets.
4. Run:

   ```bash
   node scripts/validate-extension.mjs
   node --test tests/*.test.cjs
   ```

5. Test manually in a **separate Chrome profile** using only disposable credentials. Record any test boundaries and Windows-only behaviors.

## Architecture

- `background.js` routes extension messages and serializes mutations.
- `crypto.js`, `vault-store.js` and `core-service.js` cover encryption and vault persistence.
- `site-utils.js`, `login-service.js` and the `content*.js` files implement site-scoped login interactions.
- `popup.html`, `popup.js`, `popup-i18n.js` and related files implement the UI.
- `bridge.js` and `shared-setup-template.js` support the optional Windows integration.

Do not add remote code execution, telemetry, unrequested browser permissions, real exported passwords, or sensitive content in logs and tests. Never commit `.svault` exports, native vaults, secret keys or CSV exports containing real credentials.

## Security reports

Please avoid opening public issues containing working exploits or live credentials. Reach out to the maintainer privately, or use GitHub's private vulnerability reporting when enabled.