# LocalPassMass Pro checkout / راهنمای راه‌اندازی

**Maintainer: n4ser / inaser**

The current site page is a **manual cryptocurrency payment-instructions template**, not a payment processor and not a license issuer. The extension only uses the public purchase URL and locally verifies signed entitlements.

## Deploy on inaser.ir

1. Place `buy.php` at `/extensions/LocalPassMass/buy.php` on your PHP-enabled website (HTTPS required).
2. Obtain the freely licensed **Vazir** webfont from its official project and host `Vazir-Regular.woff2` and `Vazir-Bold.woff2` in `/extensions/LocalPassMass/assets/fonts/`. The page falls back to Tahoma until the fonts are installed. Respect the font's OFL license and do not upload private font sources.
3. Set PHP environment variables in the hosting control panel or protected server config, NOT in the public repository:

   - `LPM_WALLET_ADDRESS`: public destination address (never a private key / seed).
   - `LPM_PAYMENT_NETWORK`: exact blockchain network, e.g. the one your wallet supports.
   - `LPM_PAYMENT_ASSET`: exact coin/token ticker.
   - `LPM_PRO_PRICE`: exact payable amount, formatted by the maintainer.
   - `LPM_CONTACT_EMAIL`: monitored email for manually submitted TxIDs.
   - `LPM_ENABLE_PAYMENTS=1`: only after the product, amount, support process and signing keys are ready.

**All six settings are required** to display payment instructions. Until then, the page explicitly says payment is unavailable. This page does not check blockchain transfers, generate receipts or issue licenses. Verify the blockchain transaction and finality yourself before issuing a signed entitlement. Never ask customers for their wallet seed phrase.

## Set up offline-signed licenses

From a secure maintainer machine with Node 22+:

```sh
node scripts/generate-license-keys.mjs /safe/private/path/localpassmass-signing.pem
```

Copy **only** the printed public JWK into `license-config.js` and publish the updated extension. Keep the PEM private, secured and backed up outside the public repository. Git ignores `*.pem`, but this is not a substitute for secure secret management.

After independent payment verification:

```sh
node scripts/issue-pro-license.mjs /safe/private/path/localpassmass-signing.pem ORDER_12345 lifetime
```

Send the output license token privately to the buyer. They paste it into Settings → Pro. For an expiring license, pass an expiry date such as `2027-12-31` instead of `lifetime`.

The browser validates the P-256 ECDSA signature using Web Crypto. **No outbound request or password data is required**. As in all client-side licensing schemes, modified builds can bypass local checks; this is not a DRM guarantee. Current licenses are transferable bearer tokens: offline verification cannot enforce activation limits or instantaneous revocation.

## Before taking real payments

- Decide and publish actual delivered Pro features, price, refund terms, support contacts, and local consumer/tax requirements.
- Independently review wallet/network details and deploy only using HTTPS.
- Test PHP rendering on your server and the whole manual purchase → issuance → activation flow.
- A valid token currently changes the displayed license status; **no existing password-management functionality is gated behind Pro**.
- Do not turn on `LPM_ENABLE_PAYMENTS` before the Pro deliverables are ready.
