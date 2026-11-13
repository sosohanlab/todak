/* Shared by the new domain and the old-origin bridge. No data leaves the browser. */
(function (root) {
  'use strict';
  const PERSONAL = 'mullebang.v1', LEGACY = 'todak.market-preview.personal.v1';
  const COMMUNITY = 'todak.market-preview.v1', SHARDS = 'todak.shards.v1';
  const KEYS = [PERSONAL, LEGACY, COMMUNITY, SHARDS, 'todak.tutorial.v1', 'todak.lang'];
  function parse(raw, fallback) {
    if (raw == null) return fallback;
    return JSON.parse(raw, (key, value) => {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw Error('지원하지 않는 데이터예요.');
      return value;
    });
  }
  function stable(value) {
    if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
    return JSON.stringify(value);
  }
  function records(value) {
    if (!Array.isArray(value) || value.some(v => !v || typeof v !== 'object' || typeof v.id !== 'string' || !v.id)) throw Error('작품 데이터를 확인할 수 없어요.');
    return value;
  }
  function mergeRecords(current, incoming) {
    const out = records(current).slice();
    for (const item of records(incoming)) {
      // Preserve both versions on ID conflicts; the full original record makes retries idempotent.
      const signature = stable(item);
      if (out.some(v => stable(v) === signature || v._todakLegacyRecord === signature)) continue;
      let copy = item;
      if (out.some(v => v.id === item.id)) {
        let n = 1, id;
        do { id = item.id + '-legacy-' + n++; } while (out.some(v => v.id === id));
        copy = {...item, id, _todakLegacyRecord: signature};
      }
      out.push(copy);
    }
    return out;
  }
  function personal(data) {
    if (!data || !Array.isArray(data.items) || !data.best || typeof data.best !== 'object' || Array.isArray(data.best)) throw Error('진열장 데이터를 확인할 수 없어요.');
    records(data.items); return data;
  }
  function collect(storage) {
    const values = {};
    KEYS.forEach(key => { const raw = storage.getItem(key); if (raw !== null) values[key] = raw; });
    return {format: 'todak-domain-transfer', version: 1, source: 'https://sosohanlab.github.io', values, fragments: []};
  }
  function plan(storage, payload) {
    if (!payload || payload.format !== 'todak-domain-transfer' || payload.version !== 1 || payload.source !== 'https://sosohanlab.github.io' || !payload.values || typeof payload.values !== 'object') throw Error('토닥 이전 파일이 아니에요.');
    const values = payload.values, writes = {};
    for (const key of KEYS) if (values[key] !== undefined && typeof values[key] !== 'string') throw Error('저장 데이터 형식이 올바르지 않아요.');
    // Match the old app's primary/fallback precedence (do not resurrect deleted legacy works).
    const raw = values[PERSONAL] ?? values[LEGACY];
    let added = 0;
    if (raw !== undefined) {
      const old = personal(parse(raw)), current = personal(parse(storage.getItem(PERSONAL) ?? storage.getItem(LEGACY), {items: [], best: {}}));
      const items = mergeRecords(current.items, old.items), best = {...current.best};
      for (const key of Object.keys(old.best)) if (Number.isFinite(old.best[key])) best[key] = Math.max(Number.isFinite(best[key]) ? best[key] : 0, old.best[key]);
      added = items.length - current.items.length;
      writes[PERSONAL] = JSON.stringify({...current, items, best});
    }
    if (values[COMMUNITY] !== undefined) {
      const old = parse(values[COMMUNITY]), current = parse(storage.getItem(COMMUNITY), null);
      records(old.works);
      if (!current) writes[COMMUNITY] = JSON.stringify(old);
      else {
        const combined = {...old, ...current, works: mergeRecords(current.works, old.works), likes: [...new Set([...(current.likes || []), ...(old.likes || [])])]};
        if (old.wallet && current.wallet) {
          // Do not award the same work or demo points twice; preserve current selections.
          combined.wallet = {...old.wallet, ...current.wallet, points: Math.max(Number(current.wallet.points) || 0, Number(old.wallet.points) || 0), earned: [...new Set([...(current.wallet.earned || []), ...(old.wallet.earned || [])])], owned: [...new Set([...(current.wallet.owned || []), ...(old.wallet.owned || [])])], demo: !!(current.wallet.demo || old.wallet.demo)};
        }
        writes[COMMUNITY] = JSON.stringify(combined);
      }
    }
    const fragments = mergeRecords(parse(values[SHARDS], []), payload.fragments || []);
    if (fragments.length) writes[SHARDS] = JSON.stringify(mergeRecords(parse(storage.getItem(SHARDS), []), fragments));
    for (const key of ['todak.tutorial.v1', 'todak.lang']) if (values[key] !== undefined && storage.getItem(key) === null) writes[key] = values[key];
    return {writes, added, found: Object.keys(writes).length > 0};
  }
  function apply(storage, result) {
    const before = {}, touched = [];
    // Synchronous writes prevent another app event from interleaving; roll back on quota failure.
    try {
      for (const [key, raw] of Object.entries(result.writes)) {
        before[key] = storage.getItem(key); touched.push(key);
        storage.setItem(key, raw);
        if (storage.getItem(key) !== raw) throw Error('저장 확인 실패');
      }
    } catch (error) {
      for (const key of touched.reverse()) {
        if (before[key] === null) storage.removeItem(key); else storage.setItem(key, before[key]);
      }
      throw Error('저장 공간이 부족하거나 저장이 차단되어 있어요. 기존 작품은 그대로 유지했어요.');
    }
    return result;
  }
  async function fragmentsFromDB() {
    if (!root.indexedDB) throw Error('브라우저의 저장소 접근이 차단되어 있어요.');
    return new Promise((resolve, reject) => {
      const request = root.indexedDB.open('todak-fragments', 1);
      let finished = false;
      const timer = setTimeout(() => { finished = true; reject(Error('저장소 응답이 늦어요. 다른 토닥 탭을 닫고 다시 시도해 주세요.')); }, 8000);
      function done(error, value) { if (finished) return; finished = true; clearTimeout(timer); error ? reject(error) : resolve(value); }
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('pieces')) request.result.createObjectStore('pieces', {keyPath: 'id'}); };
      request.onerror = () => done(Error('기존 저장소를 열지 못했어요.'));
      request.onsuccess = () => {
        const db = request.result;
        if (finished) { db.close(); return; }
        const tx = db.transaction('pieces', 'readonly'), read = tx.objectStore('pieces').getAll();
        tx.oncomplete = () => { db.close(); done(null, read.result || []); };
        tx.onabort = tx.onerror = () => { db.close(); done(Error('조각 저장소를 읽지 못했어요.')); };
      };
    });
  }
  root.TodakTransferCore = {KEYS, collect, plan, apply, fragmentsFromDB, mergeRecords};
})(globalThis);
