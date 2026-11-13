# Domain transfer

New site: https://todak.sosohanlab.com/
Old storage origin: https://sosohanlab.github.io
Required bridge: https://sosohanlab.github.io/todak-transfer/

## Deployment

The `todak` project now has a CNAME. GitHub redirects its old project URL to the
custom domain, so a bridge inside `/todak/` cannot read the old origin's storage.
The bridge repository **sosohanlab/todak-transfer** is now created and published.
To recreate it, initialize its main branch,
and publish **migration/index.html** from this repository as its root **index.html**.
Enable GitHub Pages: Deploy from a branch → main → /(root).
Do **not** set a custom domain or add CNAME in that bridge repository.
Do not change the main site's custom domain or DNS.

The main site's transfer button remains hidden until an old-origin iframe replies
to a readiness check. No storage is read in this iframe. Users open a top-level
popup to read the original (unpartitioned) storage and explicitly choose transfer.
The data travels via postMessage to the exact new origin and opener window with a
random session token. No artwork is sent to a server or put into a URL.

Users must use the same device/browser/profile where they originally saved work.
Cleared browser data cannot be recovered by this feature. The old records remain
untouched. A JSON backup/export and import is also available.

## Data rules

- Allowlist only the app's own storage keys; never copy all GitHub-origin storage.
- Preserve all work fields, IDs, paints, underside carving, shapes and thumbnails.
- Prefer the primary personal store to its older fallback, like the original app.
- Merge works; retain both versions on ID conflicts and deduplicate retries.
- Best scores take the maximum; preferences on the destination take precedence.
- Shop balances take the maximum (not the sum), ownership/award history is united.
- IndexedDB `todak-fragments/pieces` joins the supported `todak.shards.v1` fallback.
- Validate/plan before writing, verify each write, roll back if quota/storage fails.
- Never mark a failed import complete. Refresh the live personal store immediately
  and require a reload before the user can resume editing with cached settings.
- Saving a subsequent work no longer evicts older works above the old 40-work cap.

## Verification

`python tools/build-domain-transfer.py`
`node --test tests/domain-transfer.test.cjs tests/domain-transfer-dom.cjs`
`node tests/domain-transfer-browser.cjs` (requires Playwright + Chromium)

The automated browser test routes both production origins to local fixture files,
seeds old-origin localStorage/IndexedDB, imports via a real popup, reloads, retries,
and verifies that the old records and destination records both remain.

Status at preparation: 10 merge/storage/message-validation/DOM regression checks passed.
The browser integration run was blocked by the execution environment's restriction
on Chromium sockets; run it in a browser-capable environment before full rollout.
Final live verification also requires the separate bridge deployment above.
