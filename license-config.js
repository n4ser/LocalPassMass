/* Public configuration only. Never store signing keys or payment secrets here. */
const LPM_LICENSE_CONFIG = Object.freeze({
  checkoutUrl: 'https://pay.inaser.ir/localpassmass/',
  // Public signing verification key. Keep the corresponding private key strictly off-repo.
  publicKey: Object.freeze({ kty:'EC', crv:'P-256', x:'SmwoTOSOwlcD02IzUYlIImlkcynAYk2eY1FnoZlgVE8', y:'VHrK03cUd6JrfbzqlxjmGXYjiG_Zn50Cvoy7vArkhFQ' })
});
