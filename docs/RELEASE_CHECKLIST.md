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

## Local Pro activation
- [ ] Confirm the checkout link opens the owner's HTTPS payment website (without vault data).
- [ ] Verify the public key is installed before issuing any licenses.
- [ ] Test signed valid/expired/tampered licenses and offline activation.
- [ ] Keep private signing key, order records and payment administration outside the public repository.
- [ ] Never turn on payments until the paid deliverables, price, support and refund terms are published.

## Distribution package
- [ ] CI artifact ZIP contains only manifest, runtime JS/CSS/HTML and packaged icon images.
- [ ] Install the built ZIP (after extraction) on a clean Chrome profile, not a source checkout.
- [ ] Confirm the Pro link opens https://pay.inaser.ir/localpassmass/ from both language modes.
- [ ] Confirm purchase workflow on hosting with payment sandbox or a verified tiny payment; never use real secrets in test accounts.

## v1.13.0 acceptance
- [ ] Store the private signing key and its backup securely outside GitHub; change the key before selling if it may have been exposed.
- [ ] Exercise install/upgrade, lock/unlock, backup/restore and form fill in real Chrome.
- [ ] Test the Windows shared-vault helper in multiple real Chrome profiles on one Windows PC.
- [ ] Test Pro entry in Persian and English, including valid/expired/modified signatures.
- [ ] Do not accept Pro payments until a real paid feature and refund/support terms are published.
