/* Public configuration only. Never store signing keys or payment secrets here. */
const LPM_LICENSE_CONFIG = Object.freeze({
  checkoutUrl: 'https://inaser.ir/extensions/LocalPassMass/buy.php',
  // Replace with the public JWK printed by scripts/generate-license-keys.mjs.
  publicKey: null
});
