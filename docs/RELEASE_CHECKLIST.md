# Release checklist / چک‌لیست انتشار

## Automated
- [ ] Run `node scripts/validate-extension.mjs`.
- [ ] Run `node --test tests/*.test.cjs`.
- [ ] Confirm GitHub Actions checks pass.
- [ ] Keep manifest version, changelog and release tag aligned.

## Manual tests
- [ ] Install in a fresh Chrome profile and verify master-password setup, lock, unlock and recovery.
- [ ] Test site permissions, save, fill, subdomain matching and cross-domain submission rejection.
- [ ] Verify HTTPS-to-HTTP form actions cannot receive credentials.
- [ ] Test encrypted export and import with dummy data.
- [ ] Test both languages and all appearance modes.
- [ ] Test Windows shared-vault and Native Messaging flows on actual Windows before broad distribution.

## Publication
- [ ] Choose a license with the maintainer; add LICENSE only after approval.
- [ ] Capture real UI screenshots with fake accounts.
- [ ] Exclude sensitive backups and exports from release packages.
- [ ] Obtain a separate security review before recommending use for high-value credentials.
- [ ] Verify installation instructions against the published artifact.
