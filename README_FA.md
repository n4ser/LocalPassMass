# LocalPassMass — پس مس لوکال — v1.10.4

## تغییرهای v1.10.4
- کنترل `L` به‌صورت پایدار برای هر فیلد رمز عبور نمایش داده می‌شود.
- روی سایت دارای Credential ذخیره‌شده، یک پیشنهاد ورود نمایش داده می‌شود؛ از منوی `L` می‌توانید حساب را Fill کنید یا رمز ذخیره‌شده را به‌صورت صریح Show/Hide کنید.
- Password Generator از منوی `L` روی همه فیلدهای رمز عبور در دسترس است. اگر سایت Credential ذخیره‌شده نداشته باشد، منوی دستی فقط Generator را نمایش می‌دهد.
- متن خام رمز ذخیره‌شده فقط در زمان Fill یا Show از Vault درخواست می‌شود و تطبیق دامنه همچنان در Background بررسی می‌شود.


LocalPassMass یک Password Manager محلی و آفلاین برای Chrome/Windows است. اطلاعات Vault برای ذخیره یا Sync به هیچ سروری ارسال نمی‌شود و افزونه برای داده‌های Vault هیچ Analytics، Cloud Sync یا API شبکه‌ای ندارد.

## نصب معمولی

فقط پوشه `localpass-extension` را با `Load unpacked` در `chrome://extensions` نصب کنید. در نصب اولیه هیچ انتخاب Shared/Private نمایش داده نمی‌شود؛ کاربر عادی یک Vault خصوصی برای همان Chrome Profile می‌سازد.

Recovery Key را جدا از Backup و روی هارد/فلش امن نگه دارید. دسترسی سایت‌ها برای Autofill/Save فقط با انتخاب کاربر از Settings فعال می‌شود.

## ظاهر و تنظیمات

- Language فقط از Settings تغییر می‌کند و دکمه آن از Header حذف شده است.
- `تنظیمات پیشرفته` دقیقاً بالای `Language / زبان` قرار دارد.
- Appearance سه حالت `System / Light / Dark` دارد.
- گزینه `نمایش راهنمای تنظیمات` تعیین می‌کند توضیح کوتاه زیر هر عنوان دیده شود یا Settings کامپکت بماند.
- `قفل خودکار زمانی` را می‌توان کاملاً خاموش/روشن کرد و Delay آن جداگانه قابل تنظیم است.
- `قفل با بستن Chrome` در صورت فعال بودن، با بسته‌شدن آخرین پنجره معمولی Chrome Vault را قفل می‌کند.
- Restart کامل Chrome همیشه Vault را قفل می‌کند، چون Session Key روی دیسک persist نمی‌شود.


## بهبودهای v1.10

- تشخیص Username/Mobile/Phone/Email گسترده‌تر شده و نمونه `autocomplete="username"` + `inputmode="tel"` همراه `current-password` پشتیبانی و تست شده است.
- Loginهای SPA و ورودهایی که URL عوض نمی‌شود بهتر تشخیص داده می‌شوند؛ شواهد ضعیف فقط Prompt می‌سازند و باعث Auto-save کور نمی‌شوند.
- `Do not re-prompt for` فقط در صفحه Unlock و برای فاصله درخواست دوباره Master Password است.
- Add Account روی صفحات HTTP(S)، URL همان صفحه و عنوان پیشنهادی از Page Title + Domain را از قبل پر می‌کند. Query/Hash حساس ذخیره نمی‌شود.
- هر حساب می‌تواند چند Tag داشته باشد و جستجو Tagها را هم پوشش می‌دهد.
- Import گروهی CSV/JSON برای Chrome، LastPass و Bitwarden اضافه شده است.
- کنار فیلدهای New Password گزینه ساخت رمز قوی وجود دارد و Password + Confirmation با یک مقدار امن پر می‌شوند.
- نمایش favicon اختیاری است تا Permission اضافه در زمان نصب درخواست نشود.
- پس از راه‌اندازی اولیه، Checklist تکمیل دسترسی سایت نمایش داده می‌شود تا Autofill/Save به‌اشتباه غیرفعال باقی نماند.

## Shared Vault بین چند Chrome Profile

Shared Vault کاملاً اختیاری است و فقط در `Settings > تنظیمات پیشرفته` قرار دارد.

در Profile اول، `فعال‌کردن Vault مشترک` را بزنید. اگر Windows Helper آماده نباشد، Wizard دکمه `ساخت فایل راه‌انداز Windows` نشان می‌دهد. افزونه با User Gesture از File System Access API استفاده می‌کند و Desktop را به‌عنوان محل پیشنهادی ذخیره باز می‌کند. اگر File Picker پشتیبانی نشود، Blob download معمولی به Downloads استفاده می‌شود و Permission `downloads` درخواست نمی‌شود.

فایل Setup از قبل داخل ZIP وجود ندارد. فقط پس از کلیک کاربر ساخته می‌شود. Chrome Extension اجازه ندارد یک `.cmd` یا `.exe` را مستقیماً Run کند؛ بنابراین کاربر فایل ساخته‌شده را یک بار اجرا می‌کند. پس از Setup موفق، اسکریپت خودش را برای حذف خودکار زمان‌بندی می‌کند. سپس Chrome Restart می‌شود و Wizard با `بررسی و ادامه` اتصال را کامل می‌کند.

Profileهای بعدی همان `localpass-extension` را نصب می‌کنند و از همان Advanced Settings گزینه اتصال را می‌زنند. اگر Helper هنوز Extension آن Profile را نشناسد، همان فایل Setup از داخل Wizard دوباره ساخته و یک‌بار اجرا می‌شود؛ Extension ID یا PowerShell دستی به کاربر نمایش داده نمی‌شود.

مسیر پیش‌فرض Shared Vault:

`%LOCALAPPDATA%\LocalPassMass\vault.lpm`

Vault خصوصی قبلی هنگام Shared کردن/اتصال حذف نمی‌شود.

## ذخیره هنگام Locked بودن

بازبودن Popup یا Unlock بودن Vault برای ثبت Login جدید لازم نیست. بعد از تشخیص Login موفق و Save/Always-save، Credential به **Write-only Locked Inbox** می‌رود.

- برای Vault یک جفت کلید RSA-OAEP 3072 وجود دارد.
- Public Key در metadata قابل استفاده در حالت Locked است.
- Private Key فقط داخل Vault رمزگذاری‌شده است.
- هر Credential با AES-256-GCM رمزگذاری و Content Key آن با Public Key wrap می‌شود.
- حالت Locked می‌تواند Credential جدید را بنویسد، اما Passwordهای قبلی را نمی‌تواند Reveal/Copy/Share/Autofill کند.
- پس از Unlock، موارد صف به Vault اصلی merge می‌شوند و Password History حفظ می‌شود.

## Recovery

Vault با Vault Key تصادفی 256-bit رمزگذاری می‌شود. Master Password و Recovery Key دو مسیر مستقل برای بازکردن همان Vault Key هستند. اگر Master Password فراموش شود، Recovery Key می‌تواند Vault را باز کند و Master Password جدید ساخته شود. اگر هر دو از دست بروند، Backdoor وجود ندارد.

## Backup

- Private Mode: Snapshotهای رمزگذاری‌شده داخل Chrome Profile.
- Export Backup: فایل `.svault` رمزگذاری‌شده برای هارد/فلش.
- Shared Mode: Windows Helper می‌تواند Backup فایل رمزگذاری‌شده واقعی بسازد.

Auto Backup داخلی جای Backup خارجی را نمی‌گیرد.

## Permissionها

Permissionهای اجباری:

- `storage`
- `alarms`
- `idle`
- `activeTab`

Permissionهای اختیاری و فقط هنگام فعال‌کردن قابلیت مربوط:

- `scripting` + دسترسی سایت: Autofill و Save UI
- `nativeMessaging`: فقط Shared Vault
- `offscreen` + `clipboardWrite`: فقط Clipboard Auto-clear
- `favicon`: فقط اگر «آیکون سایت‌ها» را فعال کنید؛ favicon از سرویس محلی خود Chrome نمایش داده می‌شود و سرویس favicon خارجی استفاده نمی‌شود.

افزونه `history`، `cookies`، `webRequest`، `downloads`، `identity`، `debugger` یا `management` درخواست نمی‌کند.

## Share

Share یک URL خام تولید می‌کند، نه Markdown. برای Origin ساده، `/` نمایشی آخر هم حذف می‌شود:

```text
https://domain.com
user: USERNAME
pass: PASSWORD

by LocalPassMass
```

اگر Clipboard Auto-clear فعال باشد، Clipboard پس از زمان تنظیم‌شده پاک می‌شود.

## آپدیت بدون از دست رفتن Vault

افزونه قبلی را Remove نکنید. ابتدا Backup بگیرید، فایل‌های نسخه جدید را روی همان پوشه قبلی Replace کنید و در `chrome://extensions` فقط Reload بزنید.

Documentation: https://inaser.ir/documents/LocalPassMass  
Official/Pro: https://inaser.ir/extensions/LocalPassMass  
GitHub: https://github.com/n4ser/LocalPassMass
