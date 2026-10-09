# LocalPassMass v1.13.0

LocalPassMass is a local-first Chrome password manager. This release refines the Pro UI and introduces cryptographically signed **offline** license validation while keeping all existing password-manager features free.

### Improvements
- Updated the Pro purchase link to `https://pay.inaser.ir/localpassmass/`.
- Removed the duplicate outdated checkout link and added a clear Free/Pro indicator.
- Added show/hide for license code entry, keyboard focus styles and bilingual status text.
- Completed the public verification-key configuration. The **private signing key is not in this release or the public repository**.
- Added test coverage for real public-suffix rules, HTTPS form-action checks, Pro activation and release-package contents.

### Installation
Download and extract `LocalPassMass-v1.13.0.zip`. In Chrome, open `chrome://extensions`, enable Developer mode, then Load unpacked and select the folder containing `manifest.json`.

**Already using an unpacked installation?** Export an encrypted backup first. Update files **in the same existing directory** and select Reload. Do not remove and reinstall from an unrelated path; an extension ID change may hide access to the previous vault in that Chrome profile.

### Important limits
- This is a **prerelease**. Complete Windows Native Messaging and end-to-end Chrome acceptance testing remains necessary.
- No paid Pro features are sold or delivered in this release. Valid activation confirms an entitlement only.
- No cloud vault, password upload, or server-side Sync has been introduced.
- The project has not undergone independent security auditing.
- The Windows shared-vault helper works only among supported Chrome profiles on the same Windows PC. It is **not** cross-device Sync.
