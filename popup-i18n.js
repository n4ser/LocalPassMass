/* LocalPassMass popup translations. Kept separate from UI behavior. */
const I18N = {
  fa: {
    faName:'پس مس لوکال', lockNow:'قفل فوری', loading:'در حال بارگذاری', personalVault:'Vault شخصی شما', localEncrypted:'رمزها فقط داخل Chrome شما و به‌صورت رمزگذاری‌شده نگه‌داری می‌شوند.', masterPassword:'رمز اصلی', anyPassword:'هر رمزی که می‌خواهید', repeatPassword:'تکرار رمز', enterAgain:'دوباره وارد کنید', shortPasswordWarn:'رمز کوتاه مجاز است؛ ولی در صورت سرقت کل پروفایل Chrome، حدس‌زدن آن آسان‌تر است.', createVault:'ساخت Vault', restoreBackup:'بازیابی Backup', recoveryReady:'Recovery Key آماده است', recoveryKeep:'این فایل را جدا از Backup و روی هارد یا فلش امن نگه دارید. افزونه آن را ذخیره نمی‌کند.', downloadRecovery:'دانلود Recovery Key', savedFile:'فایل را ذخیره کردم', back:'→ برگشت', restoreVault:'بازیابی Vault', restoreHelp:'Backup رمزگذاری‌شده و فایل Recovery Key را انتخاب کنید.', newMasterPassword:'رمز اصلی جدید', restore:'بازیابی', vaultLocked:'Vault قفل است', localCheck:'رمز اصلی فقط روی همین دستگاه بررسی می‌شود.', unlock:'باز کردن', sections:'بخش‌های افزونه', guide:'آموزش', settings:'تنظیمات', searchVault:'جستجو در Vault', newAccount:'حساب جدید', emptyVault:'هنوز چیزی ذخیره نشده', addFirst:'اولین حساب را اضافه کنید.', generatePassword:'ساخت رمز', copy:'کپی', characters:'تعداد کاراکتر', uppercase:'حروف بزرگ', lowercase:'حروف کوچک', numbers:'عدد', symbols:'نماد', generateNew:'ساخت رمز جدید', fullyLocal:'کاملاً Local', noSync:'بدون Cloud و بدون سرور', wherePasswords:'پسوردها کجا هستند؟', wherePasswordsBody:'LocalPassMass هیچ اطلاعات ورودی را برای ذخیره یا Sync به سرور نمی‌فرستد. در حالت Private، Vault رمزگذاری‌شده داخل همین Chrome Profile است؛ در حالت Shared، Vault رمزگذاری‌شده در یک فایل محلی Windows و فقط از طریق Windows Helper روی همین سیستم نگه‌داری می‌شود.', backupEssential:'Backup ضروری است', backupEssentialBody:'اگر پروفایل Chrome یا Windows از بین برود، ممکن است Vault هم از دست برود. فایل <b>.svault</b> و Recovery Key را جدا از هم و در دو محل امن نگه دارید.', saferAutofill:'Autofill امن‌تر', saferAutofillBody:'پیشنهاد ورود فقط برای دامنه مرتبط نشان داده می‌شود. Subdomainهای همان سایت پشتیبانی می‌شوند و Autofill روی HTTP به‌صورت پیش‌فرض خاموش است.', screenLockTitle:'قفل با Windows', screenLockBody:'وقتی صفحه Windows قفل شود، Vault هم خودکار قفل می‌شود تا کلید بازشده در Session باقی نماند.', linksNote:'لینک‌های وب در تنظیمات فقط با کلیک شما باز می‌شوند؛ خود Vault هیچ داده‌ای به آن صفحات ارسال نمی‌کند.', language:'Language / زبان', languageHelp:'زبان رابط و پیام‌های سایت', autoLock:'قفل خودکار', afterInactivity:'بعد از عدم فعالیت', minutes:'دقیقه', clearClipboard:'پاک‌کردن Clipboard', afterCopy:'بعد از کپی رمز', seconds:'ثانیه', saveSuggestion:'پیشنهاد ذخیره', saveAfterSuccess:'بعد از تشخیص ورود موفق', lockWithWindows:'قفل با Windows', lockWithWindowsHelp:'هنگام Lock شدن سیستم', autofillHttp:'Autofill روی HTTP', offByDefault:'به‌صورت پیش‌فرض خاموش', saveSettings:'ذخیره تنظیمات', encryptedFile:'فایل رمزگذاری‌شده .svault', newRecovery:'Recovery Key جدید', futureBackups:'برای Backupهای بعدی', changeMaster:'تغییر رمز اصلی', noPasswordLimit:'بدون محدودیت نوع رمز', offlineHealth:'بررسی آفلاین رمزهای ضعیف و تکراری', resetSiteRules:'پاک‌کردن تصمیم سایت‌ها', resetSiteRulesHelp:'Always save / Never ask را ریست می‌کند', buyOfficial:'خرید / صفحه رسمی افزونه', documents:'مستندات', officialDownload:'دانلود رسمی', latestRelease:'آخرین نسخه منتشرشده', sourceReleases:'سورس و دانلود نسخه‌ها', madeFor:'ساخته‌شده برای LocalPassMass', close:'بستن', title:'عنوان', exampleGoogle:'مثلاً Google', siteAddress:'آدرس سایت', usernameEmail:'نام کاربری / ایمیل', password:'رمز عبور', favorite:'علاقه‌مندی', passwordHistory:'تاریخچه رمز', secureNote:'یادداشت امن', optional:'اختیاری', delete:'حذف', save:'ذخیره',
    badPassword:'رمز اصلی اشتباه است.', passwordEmpty:'رمز نمی‌تواند خالی باشد.', recoveryFailed:'Recovery Key یا Backup صحیح نیست.', backupInvalid:'فایل Backup معتبر نیست.', recoveryInvalid:'فایل Recovery Key معتبر نیست.', locked:'Vault قفل شده است.', failed:'عملیات انجام نشد.', passwordsMismatch:'دو رمز یکسان نیستند.', bothFiles:'هر دو فایل را انتخاب کنید.', restored:'Vault بازیابی شد.', noUsername:'نام کاربری ندارد.', usernameCopied:'نام کاربری کپی شد.', passwordCopied:'رمز کپی شد و خودکار پاک می‌شود.', saved:'ذخیره شد.', weakReuseTitle:'بررسی امنیت رمز', weakReuseLead:'می‌توانید ادامه دهید؛ این هشدار فقط برای جلوگیری از ذخیره ناخواسته رمز ضعیف یا تکراری است.', weak:'این رمز کوتاه، عددی یا از نظر حداقلی ضعیف تشخیص داده شده است.', reused:n=>`این رمز در ${n} حساب دیگر هم استفاده شده است.`, saveAnyway:'ذخیره با همین رمز', editAccount:'ویرایش حساب', newAccountTitle:'حساب جدید', editQuestion:'ویرایش حساب؟', editMessage:name=>`می‌خواهید اطلاعات «${name || 'این حساب'}» را ویرایش کنید؟ نسخه قبلی رمز در صورت تغییر داخل History باقی می‌ماند.`, edit:'ویرایش', cancel:'انصراف', confirm:'تأیید', noTitle:'بدون عنوان', previousCopied:'رمز قبلی کپی شد.', historyInfo:'نسخه‌های قبلی داخل همان Vault رمزگذاری‌شده نگه‌داری می‌شوند.', noUsernameText:'بدون نام کاربری', historyTitle:'تاریخچه رمز', reusedPasswords:'رمزهای تکراری', weakPasswords:'رمزهای ضعیف', olderYear:'قدیمی‌تر از یک سال', healthTitle:'Password Health', newPasswordHelp:'رمز جدید می‌تواند عددی یا هر فرم دیگری باشد؛ فقط خالی نباشد.', newPassword:'رمز جدید', repeatNewPassword:'تکرار رمز', changePassword:'تغییر رمز', passwordChanged:'رمز اصلی تغییر کرد.', deleteQuestion:'حذف حساب؟', deleteMessage:'این حساب و تاریخچه رمز آن از Vault حذف می‌شود.', deleted:'حذف شد.', copied:'کپی شد.', settingsSaved:'تنظیمات ذخیره شد.', settingsFailed:'خطا در ذخیره تنظیمات.', backupMade:'Backup ساخته شد.', newRecoveryQuestion:'Recovery Key جدید؟', newRecoveryMessage:'کلید جدید برای Backupهای بعدی استفاده می‌شود. فایل کلید جدید را حتماً نگه دارید.', createKey:'ساخت کلید', recoveryCreated:'Recovery Key جدید ساخته شد.', noBackup:'Backup نداری — یک نسخه امن بساز.', changesBackup:n=>`${n} تغییر از آخرین Backup — نسخه تازه بساز.`, oldBackup:'Backup بیشتر از ۷ روز قدیمی است.', duplicateCount:n=>`${n} تکراری`, weakCount:n=>`${n} ضعیف`, oldCount:n=>`${n} قدیمی`, resetRulesQuestion:'تصمیم‌های سایت‌ها پاک شود؟', resetRulesMessage:'تنظیم‌های «همیشه ذخیره کن» و «برای این سایت نپرس» برای همه سایت‌ها به حالت سؤال برمی‌گردد.', reset:'ریست', rulesReset:'تصمیم‌های سایت‌ها پاک شد.', pendingSaved:'ورود منتظر، بعد از باز شدن Vault ذخیره شد.'
  },
  en: {
    faName:'Local password vault', lockNow:'Lock now', loading:'Loading', personalVault:'Your private vault', localEncrypted:'Passwords stay encrypted inside Chrome on this device.', masterPassword:'Master password', anyPassword:'Use any password you want', repeatPassword:'Repeat password', enterAgain:'Enter it again', shortPasswordWarn:'Short passwords are allowed, but they are easier to guess if the whole Chrome profile is stolen.', createVault:'Create vault', restoreBackup:'Restore backup', recoveryReady:'Recovery Key is ready', recoveryKeep:'Keep this file separate from the backup, on a secure drive. The extension does not store it.', downloadRecovery:'Download Recovery Key', savedFile:'I saved the file', back:'← Back', restoreVault:'Restore vault', restoreHelp:'Select the encrypted backup and Recovery Key file.', newMasterPassword:'New master password', restore:'Restore', vaultLocked:'Vault is locked', localCheck:'Your master password is verified only on this device.', unlock:'Unlock', sections:'Extension sections', guide:'Guide', settings:'Settings', searchVault:'Search vault', newAccount:'New account', emptyVault:'Nothing saved yet', addFirst:'Add your first account.', generatePassword:'Generate password', copy:'Copy', characters:'Characters', uppercase:'Uppercase', lowercase:'Lowercase', numbers:'Numbers', symbols:'Symbols', generateNew:'Generate new password', fullyLocal:'Fully local', noSync:'No cloud, no server', wherePasswords:'Where are passwords stored?', wherePasswordsBody:'LocalPassMass sends no login data to a server for storage or sync. In Private mode the encrypted vault stays in this Chrome profile; in Shared mode it is an encrypted local Windows file accessed only through the Bridge on this PC.', backupEssential:'Backup is essential', backupEssentialBody:'If your Chrome or Windows profile is lost, the vault may be lost too. Keep the <b>.svault</b> backup and Recovery Key separately in two secure locations.', saferAutofill:'Safer autofill', saferAutofillBody:'Login suggestions are shown only for matching domains. Related subdomains are supported, and HTTP autofill is disabled by default.', screenLockTitle:'Windows lock protection', screenLockBody:'When Windows is locked, the vault locks automatically so an unlocked session key is not left active.', linksNote:'Web links in Settings open only when you click them; the vault sends no data to those pages.', language:'Language', languageHelp:'Popup and website prompt language', autoLock:'Auto lock', afterInactivity:'After inactivity', minutes:'min', clearClipboard:'Clear clipboard', afterCopy:'After copying a password', seconds:'sec', saveSuggestion:'Save suggestion', saveAfterSuccess:'After successful login is detected', lockWithWindows:'Lock with Windows', lockWithWindowsHelp:'When the system is locked', autofillHttp:'Autofill on HTTP', offByDefault:'Disabled by default', saveSettings:'Save settings', encryptedFile:'Encrypted .svault file', newRecovery:'New Recovery Key', futureBackups:'For future backups', changeMaster:'Change master password', noPasswordLimit:'No password-format restriction', offlineHealth:'Offline weak/reused password check', resetSiteRules:'Reset site decisions', resetSiteRulesHelp:'Clears Always save / Never ask rules', buyOfficial:'Buy / official extension page', documents:'Documentation', officialDownload:'Official download', latestRelease:'Latest published version', sourceReleases:'Source code and releases', madeFor:'LocalPassMass · inaser', close:'Close', title:'Title', exampleGoogle:'e.g. Google', siteAddress:'Website', usernameEmail:'Username / email', password:'Password', favorite:'Favorite', passwordHistory:'Password history', secureNote:'Secure note', optional:'Optional', delete:'Delete', save:'Save',
    badPassword:'Incorrect master password.', passwordEmpty:'Password cannot be empty.', recoveryFailed:'Recovery Key or backup is incorrect.', backupInvalid:'Invalid backup file.', recoveryInvalid:'Invalid Recovery Key file.', locked:'Vault is locked.', failed:'Operation failed.', passwordsMismatch:'Passwords do not match.', bothFiles:'Select both files.', restored:'Vault restored.', noUsername:'No username saved.', usernameCopied:'Username copied.', passwordCopied:'Password copied and will be cleared automatically.', saved:'Saved.', weakReuseTitle:'Password security check', weakReuseLead:'You can continue; this warning helps prevent accidental reuse of a weak password.', weak:'This password is short, numeric-only, or minimally weak.', reused:n=>`This password is reused in ${n} other account(s).`, saveAnyway:'Save anyway', editAccount:'Edit account', newAccountTitle:'New account', editQuestion:'Edit account?', editMessage:name=>`Edit “${name || 'this account'}”? If the password changes, the previous version stays in History.`, edit:'Edit', cancel:'Cancel', confirm:'Confirm', noTitle:'Untitled', previousCopied:'Previous password copied.', historyInfo:'Previous versions remain encrypted inside the same vault.', noUsernameText:'No username', historyTitle:'Password history', reusedPasswords:'Reused passwords', weakPasswords:'Weak passwords', olderYear:'Older than one year', healthTitle:'Password Health', newPasswordHelp:'The new password may be numeric or any other format; it just cannot be empty.', newPassword:'New password', repeatNewPassword:'Repeat password', changePassword:'Change password', passwordChanged:'Master password changed.', deleteQuestion:'Delete account?', deleteMessage:'This account and its password history will be deleted from the vault.', deleted:'Deleted.', copied:'Copied.', settingsSaved:'Settings saved.', settingsFailed:'Could not save settings.', backupMade:'Backup created.', newRecoveryQuestion:'Create a new Recovery Key?', newRecoveryMessage:'The new key will be used for future backups. Make sure you keep the new key file.', createKey:'Create key', recoveryCreated:'New Recovery Key created.', noBackup:'No backup yet — create a secure copy.', changesBackup:n=>`${n} changes since the last backup — create a fresh copy.`, oldBackup:'Your backup is more than 7 days old.', duplicateCount:n=>`${n} reused`, weakCount:n=>`${n} weak`, oldCount:n=>`${n} old`, resetRulesQuestion:'Reset site decisions?', resetRulesMessage:'All “Always save” and “Never ask” choices will return to Ask.', reset:'Reset', rulesReset:'Site decisions reset.', pendingSaved:'The pending login was saved after unlocking.'
  }
};

Object.assign(I18N.fa, {
  permissionGuideTitle:'مجوزها فقط هنگام نیاز', permissionGuideBody:'LocalPassMass هنگام نصب دسترسی همه سایت‌ها، Clipboard یا Windows Helper را نمی‌گیرد. دسترسی سایت، پاک‌سازی Clipboard و اتصال محلی فقط وقتی خودتان قابلیت مربوط را فعال کنید درخواست می‌شوند.',
  forgotPassword:'رمز اصلی را فراموش کرده‌ام', recoverMasterTitle:'بازیابی رمز اصلی', recoverMasterHelp:'Recovery Key را بدهید تا Vault فعلی بدون حذف پسوردها باز شود و رمز اصلی جدید بسازید.', recoverVault:'بازیابی Vault', recoverSnapshotHint:'اگر Vault فعلی آسیب دیده باشد، LocalPassMass آخرین Auto Backup سالم را هم امتحان می‌کند.', recoveredCurrent:'Vault بازیابی شد و رمز اصلی جدید فعال شد.', recoveredSnapshot:'Vault از آخرین Auto Backup سالم بازیابی شد.', selectRecoveryFile:'فایل Recovery Key را انتخاب کنید.',
  share:'Share', sharedCopied:'آدرس، نام کاربری و رمز با قالب Share کپی شد و خودکار از Clipboard پاک می‌شود.',
  autoBackup:'Auto Backup محلی', autoBackupHelp:'Private: داخل Chrome · Shared: فایل رمزگذاری‌شده', backupCopies:'تعداد Snapshot', backupCopiesHelp:'آخرین نسخه‌های خودکار', copies:'نسخه', autoBackupManager:'Auto Backupها', autoBackupStatusEmpty:'هنوز Snapshotی ساخته نشده', autoBackupCount:n=>`${n} Snapshot رمزگذاری‌شده`, createSnapshot:'ساخت Snapshot الآن', restoreSnapshot:'بازیابی این نسخه', snapshotRestored:'Snapshot بازیابی شد.', snapshotQuestion:'بازیابی Snapshot؟', snapshotMessage:'Vault فعلی با این نسخه محلی جایگزین می‌شود. قبل از ادامه بهتر است Export Backup داشته باشید.', noSnapshots:'هنوز Auto Backupی وجود ندارد.',
  sharedVaultTitle:'Vault مشترک بین Chrome Profileها', sharedVaultHelp:'یک Vault رمزگذاری‌شده مشترک برای Profileهای همین Windows', bridgePending:'Bridge لازم است', sharedVaultPath:'مسیر Vault مشترک', sharedVaultNote:'در حالت Shared، Profileهای مجاز Chrome روی همین حساب Windows یک Vault محلی مشترک می‌بینند. Vault خصوصی این Profile حذف نمی‌شود.',
  recoveryGuideTitle:'اگر رمز اصلی را فراموش کنم؟', recoveryGuideBody:'در صفحه قفل، Recovery Key را انتخاب کنید و رمز اصلی جدید بسازید. بدون Master Password و Recovery Key هیچ Backdoorی وجود ندارد.', autoBackupGuideTitle:'Auto Backup محلی', autoBackupGuideBody:'در Private چند Snapshot رمزگذاری‌شده داخل Chrome نگه داشته می‌شود؛ در Shared، Windows Helper نسخه‌های رمزگذاری‌شده واقعی روی مسیر Backup می‌سازد. Backup خارجی روی هارد جدا همچنان توصیه می‌شود.',
  testRecovery:'تست Recovery Key', testRecoveryHelp:'مطمئن شوید فایل اضطراری واقعاً کار می‌کند', recoveryValid:'Recovery Key معتبر است و Vault را باز می‌کند.', recoveryInvalidCurrent:'این Recovery Key برای Vault فعلی معتبر نیست.'
});
Object.assign(I18N.en, {
  permissionGuideTitle:'Permissions only when needed', permissionGuideBody:'LocalPassMass does not request all-sites, clipboard, or Windows Helper access at install time. Website access, clipboard clearing, and local-helper permission are requested only when you enable those features.',
  forgotPassword:'Forgot master password', recoverMasterTitle:'Recover master password', recoverMasterHelp:'Use your Recovery Key to unlock the current vault without deleting passwords, then set a new master password.', recoverVault:'Recover vault', recoverSnapshotHint:'If the current vault is damaged, LocalPassMass will also try the latest healthy local Auto Backup.', recoveredCurrent:'Vault recovered and the new master password is active.', recoveredSnapshot:'Vault recovered from the latest healthy Auto Backup.', selectRecoveryFile:'Select the Recovery Key file.',
  share:'Share', sharedCopied:'Website, username and password were copied in Share format and will be cleared from the clipboard automatically.',
  autoBackup:'Local Auto Backup', autoBackupHelp:'Private: inside Chrome · Shared: encrypted files', backupCopies:'Snapshot count', backupCopiesHelp:'Latest automatic versions', copies:'copies', autoBackupManager:'Auto Backups', autoBackupStatusEmpty:'No snapshot created yet', autoBackupCount:n=>`${n} encrypted snapshot(s)`, createSnapshot:'Create snapshot now', restoreSnapshot:'Restore this version', snapshotRestored:'Snapshot restored.', snapshotQuestion:'Restore snapshot?', snapshotMessage:'The current vault will be replaced with this local version. It is best to have an exported backup first.', noSnapshots:'There are no Auto Backups yet.',
  sharedVaultTitle:'Shared vault across Chrome profiles', sharedVaultHelp:'One encrypted shared vault for Chrome profiles on this Windows PC', bridgePending:'Bridge required', sharedVaultPath:'Shared vault path', sharedVaultNote:'In Shared mode, allowed Chrome profiles under this Windows account use one local shared vault. This profile’s private vault is not deleted.',
  recoveryGuideTitle:'What if I forget the master password?', recoveryGuideBody:'On the lock screen, select your Recovery Key and create a new master password. There is intentionally no backdoor if both are lost.', autoBackupGuideTitle:'Local Auto Backup', autoBackupGuideBody:'Private mode keeps encrypted snapshots in Chrome. Shared mode uses the Windows Helper to create real encrypted backup files at the configured backup path. A separate external backup is still recommended.',
  testRecovery:'Test Recovery Key', testRecoveryHelp:'Verify that your emergency file actually works', recoveryValid:'Recovery Key is valid and can unlock this vault.', recoveryInvalidCurrent:'This Recovery Key is not valid for the current vault.'
});

Object.assign(I18N.fa, {
  connectSharedExisting:'اتصال به Vault مشترک این Windows', usePrivateProfile:'استفاده از Vault خصوصی این Profile', siteAccessTitle:'دسترسی به سایت‌ها', siteAccessHelp:'برای Autofill و پیشنهاد ذخیره؛ هنگام نصب درخواست نمی‌شود', siteAccessNote:'بدون این مجوز، Vault و Generator کار می‌کنند ولی LocalPassMass داخل فیلدهای سایت ظاهر نمی‌شود.', allowCurrentSite:'فقط سایت فعلی', allowAllSites:'همه سایت‌های HTTPS', removeSiteAccess:'حذف دسترسی', siteAccessNone:'بدون دسترسی', siteAccessAll:'همه سایت‌های HTTPS', siteAccessSome:n=>`${n} سایت/الگو`, sitePermissionDenied:'مجوز سایت داده نشد.', sitePermissionAdded:'دسترسی سایت فعال شد.', sitePermissionRemoved:'دسترسی سایت‌ها حذف شد.', siteUnsupported:'این صفحه قابل دسترسی نیست.',
  clipboardDelay:'زمان پاک‌سازی', clipboardPermissionHelp:'اختیاری؛ فقط هنگام فعال‌سازی مجوز Clipboard می‌گیرد', clipboardPermissionDenied:'مجوز Clipboard داده نشد؛ کپی معمولی همچنان کار می‌کند.', clipboardAutoClearOn:'پاک‌سازی خودکار Clipboard فعال شد.', copiedNoClear:'کپی شد.', passwordCopiedPlain:'رمز کپی شد.', sharedCopiedPlain:'اطلاعات Share کپی شد.',
  sharedVaultHelp:'یک فایل رمزگذاری‌شده مشترک روی همین Windows', vaultMode:'حالت Vault', sharedBackupPath:'مسیر Auto Backup مشترک', sharedBackupCount:'تعداد Backup فایل', extensionId:'Extension ID', enableBridge:'فعال‌کردن Bridge', movePrivateToShared:'ساخت Shared از Vault فعلی', returnPrivate:'بازگشت به Vault خصوصی', bridgeReady:'Bridge آماده', bridgeMissing:'Bridge نصب نیست', bridgePermission:'مجوز Bridge لازم است', bridgeUnavailable:'Bridge در دسترس نیست', bridgeEnabled:'مجوز Bridge فعال شد.', sharedConnected:'Vault مشترک فعال شد. برای ادامه Vault را باز کنید.', sharedCreated:'Vault مشترک ساخته شد. Vault خصوصی قبلی حذف نشده است.', privateRestored:'به Vault خصوصی این Profile برگشتید.', privateMode:'Private', sharedMode:'Shared', bridgeInstallHelp:'این قابلیت اختیاری است. از راهنمای Shared Vault فایل راه‌انداز Windows را با یک کلیک بسازید، یک بار اجرا کنید و Chrome را Restart کنید.', sharedMasterTitle:'تبدیل Vault خصوصی به Shared', sharedMasterHelp:'برای بازپیچی کلید Vault با Device Secret محافظت‌شده توسط Windows، رمز اصلی فعلی را دوباره وارد کنید.', createShared:'ساخت Shared Vault', sharedVaultExists:'در این مسیر Shared Vault از قبل وجود دارد؛ از «اتصال» استفاده کنید.', sharedVaultMissing:'در این مسیر Shared Vault پیدا نشد.', vaultConflict:'یک Chrome Profile دیگر Vault را تغییر داده است. دوباره تلاش کنید تا تغییر جدید روی آخرین نسخه اعمال شود.', sharedChanged:'Vault مشترک تغییر کرده است؛ دوباره Unlock کنید.',
  sharedVaultNote:'Bridge فقط روی Windows شما کار می‌کند؛ هیچ Sync اینترنتی انجام نمی‌شود. Vault خصوصی حذف نمی‌شود و با بازگشت به Private دوباره در دسترس است.', sharedFileBackupHelp:'در حالت Shared، Auto Backupها فایل رمزگذاری‌شده واقعی هستند.', bridgeSecurity:'Device Secret با Windows DPAPI و حساب فعلی Windows محافظت می‌شود.', advancedSettings:'تنظیمات پیشرفته', advancedSettingsHelp:'Shared Vault و ابزارهای چند Profile', lockedInboxImported:n=>`${n} ورود ذخیره‌شده در حالت قفل به Vault اضافه شد.`
});
Object.assign(I18N.en, {
  connectSharedExisting:'Connect to this Windows shared vault', usePrivateProfile:'Use this profile’s private vault', siteAccessTitle:'Website access', siteAccessHelp:'Needed for autofill and save prompts; not requested at install time', siteAccessNote:'Without this permission the vault and generator still work, but LocalPassMass will not appear inside website fields.', allowCurrentSite:'Current site only', allowAllSites:'All HTTPS sites', removeSiteAccess:'Remove access', siteAccessNone:'No access', siteAccessAll:'All HTTPS sites', siteAccessSome:n=>`${n} site pattern(s)`, sitePermissionDenied:'Website permission was not granted.', sitePermissionAdded:'Website access enabled.', sitePermissionRemoved:'Website access removed.', siteUnsupported:'This page cannot be accessed.',
  clipboardDelay:'Clear delay', clipboardPermissionHelp:'Optional; clipboard permission is requested only when you enable this', clipboardPermissionDenied:'Clipboard permission was not granted; normal copy still works.', clipboardAutoClearOn:'Automatic clipboard clearing enabled.', copiedNoClear:'Copied.', passwordCopiedPlain:'Password copied.', sharedCopiedPlain:'Share text copied.',
  sharedVaultHelp:'One encrypted vault file shared on this Windows PC', vaultMode:'Vault mode', sharedBackupPath:'Shared Auto Backup path', sharedBackupCount:'Backup file count', extensionId:'Extension ID', enableBridge:'Enable Bridge', movePrivateToShared:'Create Shared from current vault', returnPrivate:'Return to private vault', bridgeReady:'Bridge ready', bridgeMissing:'Bridge is not installed', bridgePermission:'Bridge permission required', bridgeUnavailable:'Bridge unavailable', bridgeEnabled:'Bridge permission enabled.', sharedConnected:'Shared vault is active. Unlock it to continue.', sharedCreated:'Shared vault created. Your previous private vault was not deleted.', privateRestored:'Returned to this profile’s private vault.', privateMode:'Private', sharedMode:'Shared', bridgeInstallHelp:'This feature is optional. Create the Windows setup file from the Shared Vault guide, run it once, then restart Chrome.', sharedMasterTitle:'Convert private vault to Shared', sharedMasterHelp:'Re-enter the current master password so the vault key can be re-wrapped with a Windows-protected device secret.', createShared:'Create Shared Vault', sharedVaultExists:'A shared vault already exists at this path; use Connect instead.', sharedVaultMissing:'No shared vault was found at this path.', vaultConflict:'Another Chrome profile changed the vault. Retry so your change is applied to the latest version.', sharedChanged:'The shared vault changed; unlock it again.',
  sharedVaultNote:'The Bridge works only on this Windows PC; there is no internet sync. Your private vault is not deleted and returns when you switch back to Private.', sharedFileBackupHelp:'In Shared mode, Auto Backups are real encrypted files.', bridgeSecurity:'The device secret is protected by Windows DPAPI for the current Windows account.', advancedSettings:'Advanced settings', advancedSettingsHelp:'Shared Vault and multi-profile tools', lockedInboxImported:n=>`${n} login(s) saved while locked were added to the vault.`
});

Object.assign(I18N.fa, {
  sharedVaultHelpSimple:'همه Profileهای انتخابی از یک Vault رمزگذاری‌شده روی همین Windows استفاده می‌کنند.',
  sharedWizardPrivateTitle:'این Profile فعلاً مستقل است',
  sharedWizardPrivateHelp:'برای اشتراک با Profileهای دیگر فقط دکمه زیر را بزنید.',
  sharedWizardReadyTitle:'اشتراک محلی آماده است',
  sharedWizardReadyHelp:'اگر Vault مشترک از قبل روی این Windows باشد، همین Profile به آن وصل می‌شود؛ در غیر این صورت Vault فعلی مشترک می‌شود.',
  sharedWizardExistingTitle:'Vault مشترک پیدا شد',
  sharedWizardExistingHelp:'با یک کلیک این Profile را به Vault مشترک همین Windows وصل کنید.',
  sharedWizardActiveTitle:'Vault مشترک فعال است',
  sharedWizardActiveHelp:'این Profile اکنون از Vault مشترک همین Windows استفاده می‌کند.',
  sharedWizardHelperTitle:'فقط یک مرحله برای Windows باقی مانده',
  sharedWizardHelperHelp:'برای دسترسی امن چند Profile به یک فایل محلی، Helper باید فقط یک بار روی این Windows فعال شود.',
  sharedEnableSimple:'فعال‌کردن Vault مشترک',
  sharedConnectSimple:'اتصال این Profile',
  sharedCreateSimple:'اشتراک Vault این Profile',
  sharedActiveSimple:'Vault مشترک فعال است',
  sharedTechnicalDetails:'جزئیات اختیاری',
  sharedVaultNoteSimple:'این قابلیت فقط روی همین Windows کار می‌کند و هیچ Sync اینترنتی انجام نمی‌شود.',
  helperDialogTitle:'راه‌اندازی Vault مشترک',
  helperStep1:'۱. روی «ساخت فایل راه‌انداز Windows» بزنید و فایل را روی Desktop ذخیره کنید.',
  helperStep2:'۲. فایل ساخته‌شده را یک بار اجرا کنید؛ بعد از موفقیت خودش حذف می‌شود. Chrome را Restart کنید و «بررسی و ادامه» را بزنید.',
  helperNoId:'فایل راه‌انداز LocalPassMass را خودش در Chrome پیدا می‌کند؛ Extension ID یا PowerShell دستی لازم نیست. افزونه نمی‌تواند فایل Windows را مستقیم اجرا کند.',
  helperCheckAgain:'بررسی و ادامه',
  helperStillMissing:'اتصال Windows هنوز آماده نیست. فایل راه‌انداز ساخته‌شده را یک بار اجرا کنید و Chrome را Restart کنید.',
  helperReadyNow:'Helper آماده است.',
  sharedNeedUnlock:'برای مشترک‌کردن Vault فعلی، رمز اصلی را وارد کنید.',
  sharedSwitchWarning:'Vault خصوصی فعلی حذف نمی‌شود و هر زمان بخواهید می‌توانید به آن برگردید.',
  sharedPermissionDenied:'مجوز محلی Shared Vault داده نشد.',
  bridgeReady:'آماده', bridgeMissing:'راه‌اندازی Windows لازم است', bridgeUnavailable:'اتصال محلی در دسترس نیست', bridgePermission:'مجوز محلی لازم است', sharedVaultNote:'Vault مشترک فقط روی همین Windows کار می‌کند و Sync اینترنتی ندارد. Vault خصوصی این Profile حذف نمی‌شود و با بازگشت به حالت خصوصی دوباره در دسترس است.', sharedMasterTitle:'اشتراک Vault این Profile',
  sharedSetupFailed:'راه‌اندازی Vault مشترک کامل نشد.',
  advancedSetupIntro:'اگر روی همین Windows از قبل Vault مشترک LocalPassMass دارید، می‌توانید این Profile را بدون ساخت Vault جدید به آن وصل کنید.',
  checkSharedVault:'بررسی Vault مشترک',
  sharedNoExistingForFresh:'روی این Windows هنوز Vault مشترکی وجود ندارد. ابتدا Vault معمولی همین Profile را بسازید؛ بعداً از تنظیمات پیشرفته می‌توانید آن را مشترک کنید.',
  connectExistingTitle:'اتصال به Vault مشترک؟',
  connectExistingMessage:n=>`این Profile اکنون ${n} حساب خصوصی دارد. آن‌ها حذف نمی‌شوند، اما پس از اتصال، Vault مشترک نمایش داده می‌شود. هر زمان بخواهید می‌توانید به Vault خصوصی برگردید.`,
  connectAndKeepPrivate:'اتصال و حفظ Vault خصوصی',
  sharedUnavailableTitle:'Vault مشترک در دسترس نیست',
  sharedUnavailableHelp:'پسوردها حذف نشده‌اند. اتصال محلی Windows یا فایل Vault مشترک را بررسی کنید.',
  sharedRepair:'بررسی و رفع مشکل',
  sharedFileMissing:'فایل Vault مشترک در مسیر تنظیم‌شده پیدا نشد. می‌توانید به Vault خصوصی این Profile برگردید.'
});
Object.assign(I18N.en, {
  sharedVaultHelpSimple:'Selected Chrome profiles use one encrypted vault stored locally on this Windows PC.',
  sharedWizardPrivateTitle:'This profile is currently private',
  sharedWizardPrivateHelp:'To share it with other Chrome profiles, use the single button below.',
  sharedWizardReadyTitle:'Local sharing is ready',
  sharedWizardReadyHelp:'If a shared vault already exists on this Windows PC, this profile will join it; otherwise your current vault will become shared.',
  sharedWizardExistingTitle:'Shared vault found',
  sharedWizardExistingHelp:'Connect this Chrome profile to the shared vault on this Windows PC with one click.',
  sharedWizardActiveTitle:'Shared vault is active',
  sharedWizardActiveHelp:'This Chrome profile is now using the shared vault on this Windows PC.',
  sharedWizardHelperTitle:'One Windows step remains',
  sharedWizardHelperHelp:'A small local helper must be enabled once so multiple Chrome profiles can safely access the same local file.',
  sharedEnableSimple:'Enable shared vault',
  sharedConnectSimple:'Connect this profile',
  sharedCreateSimple:'Share this profile vault',
  sharedActiveSimple:'Shared vault is active',
  sharedTechnicalDetails:'Optional details',
  sharedVaultNoteSimple:'This works only on this Windows PC and performs no internet sync.',
  helperDialogTitle:'Set up shared vault',
  helperStep1:'1. Choose “Create Windows setup file” and save it to your Desktop.',
  helperStep2:'2. Run the generated file once; after successful setup it deletes itself. Restart Chrome, then choose “Check and continue”.',
  helperNoId:'The setup file finds LocalPassMass in Chrome automatically. No Extension ID or manual PowerShell is required. Chrome extensions cannot directly execute Windows files.',
  helperCheckAgain:'Check and continue',
  helperStillMissing:'The Windows connection is not ready yet. Run the generated setup file once and restart Chrome.',
  helperReadyNow:'Helper is ready.',
  sharedNeedUnlock:'Enter your master password to make this profile vault shared.',
  sharedSwitchWarning:'Your current private vault is not deleted and you can return to it later.',
  sharedPermissionDenied:'Shared vault permission was not granted.',
  bridgeReady:'Ready', bridgeMissing:'Windows setup required', bridgeUnavailable:'Local connection unavailable', bridgePermission:'Local permission required', sharedVaultNote:'The shared vault works only on this Windows PC and performs no internet sync. This profile’s private vault is not deleted and becomes available again when you return to private mode.', sharedMasterTitle:'Share this profile vault',
  sharedSetupFailed:'Shared vault setup did not complete.',
  advancedSetupIntro:'If a LocalPassMass shared vault already exists on this Windows PC, you can connect this profile without creating a new private vault first.',
  checkSharedVault:'Check for shared vault',
  sharedNoExistingForFresh:'There is no shared vault on this Windows PC yet. Create this profile’s normal vault first; you can make it shared later from Advanced settings.',
  connectExistingTitle:'Connect to shared vault?',
  connectExistingMessage:n=>`This profile currently has ${n} private account(s). They will not be deleted, but the shared vault will be shown after connecting. You can return to the private vault at any time.`,
  connectAndKeepPrivate:'Connect and keep private vault',
  sharedUnavailableTitle:'Shared vault is unavailable',
  sharedUnavailableHelp:'Your passwords were not deleted. Check the local Windows connection or the shared vault file.',
  sharedRepair:'Check and repair',
  sharedFileMissing:'The shared vault file was not found at the configured path. You can return to this profile’s private vault.'
});

/* v1.8 additions and clarified help copy. */
Object.assign(I18N.fa, {
  showSettingsHelp:'نمایش راهنمای تنظیمات',
  showSettingsHelpHelp:'اگر روشن باشد، زیر هر گزینه توضیح کوتاه نمایش داده می‌شود.',
  theme:'ظاهر', themeHelp:'روشن، تاریک یا هماهنگ با تنظیم Windows.', themeSystem:'سیستم', themeLight:'روشن', themeDark:'تاریک',
  autoLock:'قفل خودکار زمانی', autoLockHelp:'اگر روشن باشد، Vault پس از مدت مشخصی عدم فعالیت قفل می‌شود.', autoLockDelay:'زمان قفل خودکار', afterInactivity:'مدت عدم فعالیت قبل از قفل شدن Vault.',
  lockOnBrowserClose:'قفل با بستن Chrome', lockOnBrowserCloseHelp:'با بسته‌شدن آخرین پنجره Chrome قفل می‌شود؛ Restart کامل Chrome در هر حالت قفل است چون کلید بازشده دائمی ذخیره نمی‌شود.',
  subdomainHelp:'Credentialهای دامنه اصلی را روی زیردامنه‌هایی مثل login.example.com هم پیشنهاد می‌دهد.',
  sharedBackupCountHelp:'تعداد نسخه‌های رمزگذاری‌شده‌ای که برای Vault مشترک نگه‌داری می‌شود.',
  multiProfileGuideTitle:'استفاده در چند Chrome Profile',
  multiProfileGuideBody:'در Profile اول از <b>تنظیمات ← تنظیمات پیشرفته</b>، Vault مشترک را فعال کنید. اگر Windows Helper آماده نباشد، LocalPassMass با یک دکمه فایل راه‌انداز را روی Desktop می‌سازد؛ فایل را یک‌بار اجرا کنید و Chrome را Restart کنید. در Profileهای بعدی همان افزونه را نصب و از همان بخش گزینه اتصال را بزنید؛ فقط Master Password لازم است.',
  helperStep1:'۱. روی «ساخت فایل راه‌انداز Windows» بزنید و فایل را روی Desktop ذخیره کنید.',
  helperStep2:'۲. فایل را یک‌بار اجرا کنید. بعد از موفقیت خودش برای حذف‌شدن برنامه‌ریزی می‌شود. سپس Chrome را کامل Restart کنید و «بررسی و ادامه» را بزنید.',
  helperNoId:'LocalPassMass فایل را فقط با کلیک خودتان می‌سازد؛ Extension ID یا PowerShell دستی لازم نیست. افزونه اجازه اجرای مستقیم فایل Windows را ندارد.',
  helperCreateFile:'ساخت فایل راه‌انداز Windows',
  helperFileSaved:'فایل راه‌انداز ساخته شد. آن را یک‌بار اجرا کنید و سپس Chrome را Restart کنید.',
  helperFileDownloadFallback:'فایل در پوشه Downloads ساخته شد. آن را یک‌بار اجرا کنید و سپس Chrome را Restart کنید.',
  helperFileCanceled:'ساخت فایل لغو شد.',
  helperFileFailed:'ساخت فایل راه‌انداز انجام نشد.',
  helperStillMissing:'اتصال Windows هنوز آماده نیست. فایل راه‌انداز را یک‌بار اجرا کنید، Chrome را کامل Restart کنید و دوباره بررسی کنید.',
  browserCloseLockNote:'برای امنیت، Restart کامل Chrome همیشه Vault را قفل می‌کند؛ این گزینه فقط رفتار بستن آخرین پنجره را کنترل می‌کند.'
});
Object.assign(I18N.en, {
  showSettingsHelp:'Show settings help',
  showSettingsHelpHelp:'When enabled, a short explanation is shown below each setting.',
  theme:'Appearance', themeHelp:'Light, dark, or follow the Windows preference.', themeSystem:'System', themeLight:'Light', themeDark:'Dark',
  autoLock:'Timed auto-lock', autoLockHelp:'When enabled, the vault locks after the selected period of inactivity.', autoLockDelay:'Auto-lock delay', afterInactivity:'How long the vault can stay idle before it locks.',
  lockOnBrowserClose:'Lock when Chrome closes', lockOnBrowserCloseHelp:'Locks when the last Chrome window closes. A full Chrome restart always locks because the unlocked key is never stored permanently.',
  subdomainHelp:'Also offers the base-domain credential on related subdomains such as login.example.com.',
  sharedBackupCountHelp:'How many encrypted file backups are retained for the shared vault.',
  multiProfileGuideTitle:'Use with multiple Chrome profiles',
  multiProfileGuideBody:'In the first profile, open <b>Settings → Advanced settings</b> and enable Shared Vault. If the Windows Helper is not ready, LocalPassMass can create the setup file on your Desktop with one button; run it once and restart Chrome. In later profiles, install the same extension and choose Connect from the same section. Only the Master Password is needed.',
  helperStep1:'1. Choose “Create Windows setup file” and save the file to your Desktop.',
  helperStep2:'2. Run the file once. After a successful setup it schedules itself for deletion. Fully restart Chrome, then choose “Check and continue”.',
  helperNoId:'LocalPassMass creates the file only after your click. No Extension ID or manual PowerShell step is needed. Chrome extensions cannot directly execute Windows files.',
  helperCreateFile:'Create Windows setup file',
  helperFileSaved:'Setup file created. Run it once, then fully restart Chrome.',
  helperFileDownloadFallback:'Setup file was created in Downloads. Run it once, then fully restart Chrome.',
  helperFileCanceled:'File creation was canceled.',
  helperFileFailed:'Could not create the setup file.',
  helperStillMissing:'The Windows connection is not ready yet. Run the setup file once, fully restart Chrome, then check again.',
  browserCloseLockNote:'For safety, a full Chrome restart always locks the vault. This option only controls closing the last Chrome window.'
});

/* v1.9 autofill re-prompt and popup continuity. */
Object.assign(I18N.fa, {
  doNotRepromptFor:'Do not re-prompt for',
  repromptEveryTime:'هر بار بپرس', reprompt5m:'۵ دقیقه', reprompt15m:'۱۵ دقیقه', reprompt30m:'۳۰ دقیقه', reprompt1h:'۱ ساعت', repromptSession:'تا بسته‌شدن Chrome',
  repromptPageGone:'صفحه ورود تغییر کرده یا بسته شده است. دوباره از فیلد ورود شروع کنید.'
});
Object.assign(I18N.en, {
  doNotRepromptFor:'Do not re-prompt for',
  repromptEveryTime:'Every time', reprompt5m:'5 minutes', reprompt15m:'15 minutes', reprompt30m:'30 minutes', reprompt1h:'1 hour', repromptSession:'Until Chrome closes',
  repromptPageGone:'The login page changed or closed. Start again from the login field.'
});

/* v1.10 login capture, unlock grace, onboarding and bulk import. */
Object.assign(I18N.fa, {
  unlockGraceHelp:'این انتخاب فقط قفل زمانی ناشی از عدم فعالیت را عقب می‌اندازد؛ قفل دستی، Lock شدن Windows و بستن Chrome همچنان فوری است.',
  completeSetup:'تکمیل راه‌اندازی',
  setupChecklistHelp:'برای اینکه پیشنهاد Autofill و ذخیره پسورد داخل سایت‌ها کار کند، دسترسی سایت را یک‌بار فعال کنید. Backup بعد از ذخیره اولین حساب ضروری است.',
  setupNeedsSiteAccess:'مرحله اول: دسترسی سایت‌ها را برای Autofill و ذخیره فعال کنید  ←',
  setupNeedsBackup:'Backup خارجی ندارید؛ برای جلوگیری از از دست رفتن Vault یک Backup بگیرید  ←',
  setupSiteAccessTitle:'دسترسی سایت‌ها', setupSiteAccessMissing:'هنوز فعال نشده؛ بدون این مجوز افزونه فیلدهای Login را نمی‌بیند.', setupSiteAccessReady:'فعال است.',
  setupBackupTitle:'Backup امن', setupBackupMissing:'از Vault فعلی هنوز Backup خروجی نگرفته‌اید.', setupBackupReady:'وضعیت Backup مناسب است.', makeBackupNow:'ساخت Backup',
  setupOptionalPermissions:'Clipboard Auto-clear و Shared Vault اختیاری‌اند و فقط در صورت فعال‌کردن همان قابلیت مجوز می‌گیرند.',
  bulkImport:'Import گروهی', bulkImportHelp:'CSV از Chrome / LastPass / Bitwarden یا JSON؛ پردازش فایل کاملاً روی دستگاه انجام می‌شود.',
  bulkImportFound:n=>`${n} حساب قابل Import پیدا شد.`,
  bulkImportPlainWarning:'هشدار: فایل‌های CSV خروجی Password Managerها معمولاً Passwordها را به‌صورت متن ساده دارند. بعد از Import فایل CSV را از محل ناامن حذف کنید.',
  bulkImportSkipped:n=>`${n} ردیف ناقص یا تکراری نادیده گرفته می‌شود.`, importNow:'Import کردن',
  bulkImportDone:n=>`${n} حساب با موفقیت Import/Update شد.`, importNoEntries:'هیچ حساب معتبر دارای URL و Password در فایل پیدا نشد.', importInvalid:'فرمت فایل Import معتبر نیست.', importFileTooLarge:'فایل Import بیش از حد بزرگ است (حداکثر ۱۵MB).'
});
Object.assign(I18N.en, {
  unlockGraceHelp:'This only delays inactivity-based auto-lock. Manual lock, Windows lock, and closing Chrome still lock immediately.',
  completeSetup:'Complete setup',
  setupChecklistHelp:'Enable site access once so autofill and save suggestions can work inside websites. After your first saved account, keep an external backup.',
  setupNeedsSiteAccess:'Step 1: enable site access for autofill and password saving  →',
  setupNeedsBackup:'No external backup yet. Create one to protect your vault  →',
  setupSiteAccessTitle:'Site access', setupSiteAccessMissing:'Not enabled yet. Without it, LocalPassMass cannot see login fields.', setupSiteAccessReady:'Enabled.',
  setupBackupTitle:'Secure backup', setupBackupMissing:'No exported backup exists for the current vault yet.', setupBackupReady:'Backup status looks good.', makeBackupNow:'Create backup',
  setupOptionalPermissions:'Clipboard auto-clear and Shared Vault are optional and request permissions only when you enable those features.',
  bulkImport:'Bulk import', bulkImportHelp:'CSV from Chrome / LastPass / Bitwarden or JSON. The file is processed entirely on this device.',
  bulkImportFound:n=>`${n} account(s) are ready to import.`,
  bulkImportPlainWarning:'Warning: CSV exports from password managers usually contain passwords as plain text. Delete the CSV from unsafe locations after importing.',
  bulkImportSkipped:n=>`${n} incomplete or duplicate row(s) will be skipped.`, importNow:'Import now',
  bulkImportDone:n=>`${n} account(s) imported/updated successfully.`, importNoEntries:'No valid entries with both URL and password were found.', importInvalid:'The import file format is invalid.', importFileTooLarge:'The import file is too large (15 MB maximum).'
});

/* v1.10 account tags and optional local favicon UI. */
Object.assign(I18N.fa, {
  tags:'تگ‌ها', tagsPlaceholder:'مثلاً work, hosting, personal',
  siteIcons:'آیکون سایت‌ها', siteIconsHelp:'اختیاری؛ favicon هر سایت را از خود Chrome نمایش می‌دهد و به سرویس خارجی وصل نمی‌شود.',
  siteIconsPermissionDenied:'مجوز نمایش favicon داده نشد؛ آیکون حرفی باقی می‌ماند.'
});
Object.assign(I18N.en, {
  tags:'Tags', tagsPlaceholder:'e.g. work, hosting, personal',
  siteIcons:'Site icons', siteIconsHelp:'Optional. Shows each site favicon using Chrome locally; no external favicon service is contacted.',
  siteIconsPermissionDenied:'Favicon permission was not granted; letter icons will remain.'
});

/* v1.10.3 current-site vault filter. */
Object.assign(I18N.fa, {
  siteAccounts:n=>`${n} حساب برای این سایت`, allAccounts:n=>`همه حساب‌ها (${n})`, showAll:'نمایش همه', showThisSite:'فقط این سایت'
});
Object.assign(I18N.en, {
  siteAccounts:n=>`${n} account(s) for this site`, allAccounts:n=>`All accounts (${n})`, showAll:'Show all', showThisSite:'This site only'
});
