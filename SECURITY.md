# LocalPassMass Security Notes — v1.10.4

LocalPassMass is designed as a local-only Chrome password manager. It contains no Vault sync-server client, analytics endpoint, remote-code loader, `fetch`, XHR, WebSocket or EventSource path.

## Vault cryptography

- A random 256-bit Vault Key encrypts Vault data with AES-256-GCM.
- The Master Password wraps the Vault Key through PBKDF2-SHA256 with 600,000 iterations, random salt and a device pepper/secret.
- A separate random 256-bit Recovery Key independently wraps the same Vault Key.
- Private mode keeps the device pepper in Chrome-profile metadata, so a very short PIN remains weaker if an attacker steals the entire Chrome Profile and can perform offline guesses.
- Shared mode keeps the device secret outside `vault.lpm`; the Windows Helper protects it with DPAPI `CurrentUser`.

## Session and lock behavior

- The unlocked Vault Key is kept only in `chrome.storage.session`; it is not persisted to disk by LocalPassMass.
- Timed auto-lock is optional. When enabled, inactivity is checked both on Vault access and by a periodic alarm.
- `Lock when Chrome closes` locks after the last normal Chrome window closes when enabled.
- A complete Chrome process restart always starts locked regardless of that setting because the session key is gone.
- Windows system-lock protection remains independently configurable.

## Write-only Locked Inbox

New successful logins can be persisted while the Vault is locked without retaining a readable Vault key.

- RSA-OAEP 3072 protects per-item AES-256-GCM content keys.
- The RSA public key is available for locked writes; the private key remains inside the encrypted Vault.
- Locked Inbox records contain no plaintext password or private decryption key.
- Reading, Copy, Reveal, Share and Autofill require an unlocked Vault.

## Login capture and site isolation

- Pre-confirmation login capture is temporary and encrypted with a random session-only key.
- Persistent Locked Inbox writes occur only after success detection plus Save/Always-save policy.
- Registrable-domain matching uses bundled Public Suffix List data.
- The background derives the requesting page from Chrome sender metadata instead of trusting host data supplied by page JavaScript.
- Cross-domain form-action validation is fail-closed; if validation is unavailable or fails, Autofill is blocked.
- HTTP Autofill is disabled by default.

## Shared Vault / Windows Helper

Shared Vault is optional and hidden under Advanced settings. Normal single-profile use requires no Windows Helper and no `nativeMessaging` permission.

v1.10 does not ship a prebuilt `.cmd` file. The setup script is generated locally only after an explicit user action in the Shared Vault wizard:

- `showSaveFilePicker` is used when available, with Desktop as the suggested start location.
- A normal Blob download fallback is used if the picker is unavailable; the extension does not request the `downloads` permission.
- The generated setup script scans standard Chrome profile preference files for installed LocalPassMass extension IDs and registers only those origins.
- Existing registered LocalPassMass origins are preserved when setup is rerun.
- Registration is per-user under `HKCU`; the helper does not require an administrator-level registry hive.
- A Chrome extension cannot directly execute a Windows `.cmd`/`.exe`. The user must explicitly launch the generated file once.
- After successful setup, the generated script schedules itself for deletion.
- Shared writes retain per-vault mutex, generation checking, flush + atomic replace/move semantics.
- Large reads use immutable snapshots and chunked Native Messaging responses.
- Network/UNC/device paths are blocked by the Helper.

## Data safety when joining Shared Vault

- A private Vault is not deleted when the profile switches to Shared mode.
- Existing private accounts are not silently merged into an existing Shared Vault.
- A fresh Chrome Profile can connect to an existing Shared Vault without first creating a throwaway private Vault.

## Backup safety

- Private Auto Backup captures encrypted pre-write state before normal Vault mutations.
- Shared mode creates encrypted file backups before mutating writes when enabled.
- Shared snapshot restore preserves current authentication metadata so an old backup cannot silently reactivate an old Master Password.

## Permissions

Install-time permissions are limited to `storage`, `alarms`, `idle`, and `activeTab`.

Optional, feature-scoped permissions:

- `scripting` + site host access: Autofill/save UI.
- `nativeMessaging`: Shared Vault only.
- `offscreen` + `clipboardWrite`: Clipboard auto-clear only.
- `favicon`: optional local Chrome favicon display only; no third-party favicon service is contacted.

The extension does not request History, Cookies, WebRequest, Downloads, Identity, Debugger or Management permissions.

## Threat-model limits

- Malware/processes with equivalent or higher privileges can observe plaintext while the Vault is unlocked or when a password is typed into a website.
- A permitted compromised website can attempt login-capture behavior; domain checks, success heuristics, queue caps and Save/site policy reduce but cannot eliminate all malicious-page behavior.
- Clipboard contents may be observed by local software during the copy interval.
- The development Windows Helper is not code-signed. Production distribution should use code signing and a hardened installer.
