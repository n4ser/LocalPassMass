/* LocalPassMass credential record model. Pure vault mutations shared by normal
   saves, bulk import and the write-only locked inbox. */
const LPM_ENTRY_MODEL = (() => {
  const HISTORY_LIMIT = 25;

  function timestamp() { return Date.now(); }
  function newEntryId() { return crypto.randomUUID(); }

  function findAutoUpsertTarget(entries, input) {
    const targetScope = LPM_SITE.siteScope(input?.url || '');
    if (!targetScope) return null;
    const candidates = (Array.isArray(entries) ? entries : []).filter(e => LPM_SITE.siteScope(e?.url || '') === targetScope);
    const username = String(input?.username || '');
    if (username) return candidates.find(e => String(e?.username || '') === username) || null;
    return candidates.length === 1 ? candidates[0] : null;
  }

  function pushHistory(existing, changedAt = timestamp()) {
    const oldPassword = String(existing?.password || '');
    const history = Array.isArray(existing?.history) ? [...existing.history] : [];
    if (!oldPassword) return history.slice(0, HISTORY_LIMIT);
    if (!history[0] || String(history[0].password || '') !== oldPassword) {
      history.unshift({
        password: oldPassword,
        username: String(existing?.username || ''),
        url: String(existing?.url || ''),
        changedAt: Number(existing?.passwordUpdatedAt || existing?.updatedAt || changedAt)
      });
    }
    return history.slice(0, HISTORY_LIMIT);
  }

  function sameNonSecretFields(existing, input) {
    if (!existing) return false;
    const tagsA = LPM_ACCOUNT_META.normalizeTags(existing.tags || []);
    const tagsB = LPM_ACCOUNT_META.normalizeTags(input.tags ?? existing.tags ?? []);
    // Keep equality semantics aligned with the cleanup performed in apply().
    // Empty title/url inputs mean "keep the existing value", not overwrite with empty.
    const nextTitle = String(input.title || existing.title || '').trim().slice(0, 200);
    const nextUrl = String(input.url || existing.url || '').slice(0, 2048);
    const nextUsername = String(input.username ?? existing.username ?? '').slice(0, 1000);
    const nextNotes = String(input.notes ?? existing.notes ?? '').slice(0, 20000);
    return nextTitle === String(existing.title || '').trim().slice(0, 200)
      && nextUsername === String(existing.username || '').slice(0, 1000)
      && nextUrl === String(existing.url || '').slice(0, 2048)
      && nextNotes === String(existing.notes || '').slice(0, 20000)
      && (input.favorite == null ? !!existing.favorite : !!input.favorite) === !!existing.favorite
      && JSON.stringify(tagsA) === JSON.stringify(tagsB);
  }

  function apply(vault, input, { dedupeCredentialOnly = false } = {}) {
    if (!vault || !Array.isArray(vault.entries)) throw new Error('VAULT_INVALID');
    input = input && typeof input === 'object' ? input : {};
    const t = timestamp();
    let existing = input.id ? vault.entries.find(e => e.id === input.id) : null;
    if (!existing && input.autoUpsert) existing = findAutoUpsertTarget(vault.entries, input);

    const newPassword = String(input.password ?? existing?.password ?? '');
    const nextUsername = String(input.username ?? existing?.username ?? '');
    const passwordChanged = !!existing && String(existing.password || '') !== newPassword;

    if (existing && dedupeCredentialOnly && !passwordChanged && String(existing.username || '') === nextUsername) {
      return { changed:false, entry:existing, state:'same' };
    }

    // Avoid rewriting/re-encrypting the whole vault for a no-op edit. This also
    // prevents unnecessary backup snapshots when a modal is saved unchanged.
    if (existing && !passwordChanged && sameNonSecretFields(existing, input)) {
      return { changed:false, entry:existing, state:'same' };
    }

    const history = passwordChanged ? pushHistory(existing, t) : (Array.isArray(existing?.history) ? existing.history : []);
    const clean = {
      id: existing?.id || newEntryId(),
      title: String(input.title || existing?.title || LPM_SITE.normalizeHost(input.url) || 'بدون عنوان').trim().slice(0, 200),
      username: nextUsername.slice(0, 1000),
      password: newPassword.slice(0, 10000),
      url: String(input.url || existing?.url || '').slice(0, 2048),
      notes: String(input.notes ?? existing?.notes ?? '').slice(0, 20000),
      tags: LPM_ACCOUNT_META.normalizeTags(input.tags ?? existing?.tags ?? []),
      favorite: input.favorite == null ? !!existing?.favorite : !!input.favorite,
      history,
      createdAt: Number(existing?.createdAt || t),
      updatedAt: t,
      passwordUpdatedAt: passwordChanged || !existing ? t : Number(existing.passwordUpdatedAt || existing.updatedAt || t),
      lastUsedAt: Number(existing?.lastUsedAt || 0)
    };
    if (existing) Object.assign(existing, clean); else vault.entries.unshift(clean);
    return { changed:true, entry:clean, state:existing ? (passwordChanged ? 'changed' : 'updated') : 'new' };
  }

  return Object.freeze({ HISTORY_LIMIT, findAutoUpsertTarget, pushHistory, apply });
})();
