<?php
declare(strict_types=1);

/*
 * LocalPassMass Pro payment information page.
 * Configure through private server environment variables, never through GET.
 * Manual confirmation only; this file does not collect payments or issue licenses.
 */
$wallet = trim((string)(getenv('LPM_WALLET_ADDRESS') ?: ''));
$network = trim((string)(getenv('LPM_PAYMENT_NETWORK') ?: ''));
$asset = trim((string)(getenv('LPM_PAYMENT_ASSET') ?: ''));
$price = trim((string)(getenv('LPM_PRO_PRICE') ?: ''));
$email = trim((string)(getenv('LPM_CONTACT_EMAIL') ?: ''));
$paymentsEnabled = getenv('LPM_ENABLE_PAYMENTS') === '1';
$ready = $paymentsEnabled && $wallet !== '' && $network !== '' && $asset !== '' && $price !== '' && filter_var($email, FILTER_VALIDATE_EMAIL);
$nonce = base64_encode(random_bytes(18));
header('Content-Type: text/html; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'none'; style-src 'self' 'nonce-{$nonce}'; font-src 'self'; script-src 'nonce-{$nonce}'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
function h(string $value): string { return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LocalPassMass Pro | inaser</title>
<meta name="description" content="خرید لایسنس LocalPassMass Pro؛ رمزها و Vault تنها روی دستگاه شما می‌مانند.">
<style nonce="<?= h($nonce) ?>">
@font-face{font-family:Vazir;src:url('assets/fonts/Vazir-Regular.woff2') format('woff2');font-display:swap}
@font-face{font-family:Vazir;src:url('assets/fonts/Vazir-Bold.woff2') format('woff2');font-weight:700;font-display:swap}
:root{color-scheme:dark;--bg:#0b1220;--card:#142238;--text:#f2f7fc;--muted:#bdcddd;--accent:#79dcd0}
*{box-sizing:border-box}body{font-family:Vazir,Tahoma,Arial,sans-serif;background:radial-gradient(circle at 18% 0%,#173e4c,var(--bg) 60%);color:var(--text);margin:0;min-height:100vh;line-height:1.85}
main{max-width:770px;padding:50px 22px 75px;margin:auto}
header{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:45px}
a{color:var(--accent)}.logo{font-weight:700;font-size:19px;text-decoration:none}
h1{font-size:clamp(28px,5vw,45px);line-height:1.5;margin:0 0 12px}h2{font-size:19px;margin:8px 0}
p{color:var(--muted);margin:8px 0 22px}.eyebrow{font-size:13px;color:var(--accent);font-weight:700;letter-spacing:.4px}
.card{border:1px solid #3b556c;background:var(--card);border-radius:22px;padding:28px;margin:22px 0;box-shadow:0 15px 50px #0003}
.field{display:block;color:#acbac9;font-size:12px;margin-top:20px}
.value{direction:ltr;text-align:left;background:#081625;border:1px solid #395467;border-radius:12px;padding:15px;overflow-wrap:anywhere;unicode-bidi:plaintext;color:white}
.amount{font-size:25px;color:var(--accent);font-weight:700}
button,.button{background:#78ddd0;color:#05232b;border:0;border-radius:11px;font-family:inherit;font-size:14px;padding:12px 20px;cursor:pointer;display:inline-block;font-weight:700;text-decoration:none}
button:hover,.button:hover{background:#9ae9df}.muted{color:var(--muted);font-size:13px}
.warning{border-right:3px solid #e2b76c;padding:8px 16px;background:#172232;border-radius:6px;color:#ffdfa6}
footer{color:var(--muted);font-size:13px;margin-top:40px}
</style>
</head>
<body>
<main>
<header><a href="https://inaser.ir/" class="logo">inaser / n4ser</a><a href="https://github.com/n4ser/LocalPassMass" rel="noopener noreferrer">GitHub ↗</a></header>
<span class="eyebrow">LocalPassMass Pro</span>
<h1>مدیریت رمز، بدون وابستگی به فضای ابری</h1>
<p>رمزها، کلید بازیابی و فایل Vault شما روی دستگاه خودتان می‌مانند. این صفحه فقط برای دریافت اطلاعات خرید و فعال‌سازی امکانات Pro است.</p>
<div class="card">
<?php if ($ready): ?>
<h2>پرداخت لایسنس Pro</h2>
<p class="warning">لطفاً قبل از انتقال، شبکه و آدرس کیف پول را دقیقاً بررسی کنید. انتقال اشتباه ارز دیجیتال ممکن است برگشت‌ناپذیر باشد.</p>
<span class="field">مبلغ دقیق</span>
<div class="amount"><?= h($price) ?> <?= h($asset) ?></div>
<span class="field">شبکهٔ انتقال</span>
<div class="value"><?= h($network) ?></div>
<span class="field">آدرس کیف پول مقصد</span>
<div id="wallet" class="value"><?= h($wallet) ?></div>
<button type="button" id="copyWallet">کپی آدرس کیف پول</button>
<p id="copyStatus" class="muted" role="status" aria-live="polite"></p>
<p>پس از پرداخت، شناسهٔ تراکنش (TxID) را از طریق ایمیل پشتیبانی ارسال کنید. پس از بررسی دستی تراکنش، کد فعال‌سازی امضاشده صادر می‌شود.</p>
<a class="button" href="mailto:<?= h(rawurlencode($email)) ?>?subject=<?= h(rawurlencode('LocalPassMass Pro payment confirmation')) ?>">ارسال تأیید پرداخت</a>
<?php else: ?>
<h2>نسخهٔ Pro در حال آماده‌سازی است</h2>
<p>در حال حاضر پرداخت روی این صفحه فعال نیست. تا تکمیل امکانات Pro و تنظیم روش دریافت وجه، هیچ مبلغی واریز نکنید.</p>
<a class="button" href="https://inaser.ir/">بازگشت به inaser.ir</a>
<?php endif; ?>
</div>
<div class="card">
<h2>بعد از دریافت لایسنس چه کنم؟</h2>
<p>افزونهٔ LocalPassMass را باز کنید و از بخش «تنظیمات ← Pro» کد فعال‌سازی را وارد کنید. تأیید اصالت کد به‌صورت محلی انجام می‌شود و رمزهای شما ارسال نمی‌شوند.</p>
</div>
<footer>LocalPassMass · <strong>n4ser / inaser</strong> · این صفحه رمز عبور یا اطلاعات Vault دریافت نمی‌کند.</footer>
</main>
<?php if ($ready): ?>
<script nonce="<?= h($nonce) ?>">
document.getElementById('copyWallet').addEventListener('click', async () => {
  const value = document.getElementById('wallet').textContent.trim();
  const status = document.getElementById('copyStatus');
  try { await navigator.clipboard.writeText(value); status.textContent='آدرس کپی شد.'; }
  catch { status.textContent='کپی خودکار ممکن نشد؛ آدرس را دستی انتخاب و کپی کنید.'; }
});
</script>
<?php endif; ?>
</body>
</html>
