(function () {
  'use strict';
  if (location.origin !== 'https://todak.sosohanlab.com') return;
  const OLD = 'https://sosohanlab.github.io', BRIDGE = OLD + '/todak-transfer/';
  const core = window.TodakTransferCore, home = document.querySelector('#home .homeBox');
  if (!core || !home) return;
  const entry = document.createElement('button');
  entry.hidden = true; // Reveal only after the old-origin bridge is deployed and responds.
  entry.type = 'button'; entry.className = 'ghost'; entry.textContent = '이전 주소 작품 가져오기';
  entry.style.cssText = 'grid-column:1/-1;justify-self:center;margin:8px 0;';
  home.insertBefore(entry, home.querySelector('.homeFoot'));
  const dialog = document.createElement('dialog');
  dialog.style.cssText = 'max-width:440px;width:calc(100% - 48px);border:1px solid #d6d2c9;border-radius:18px;padding:24px;background:#faf8f2;color:#23304a;';
  dialog.innerHTML = '<h2>기존 작품 가져오기</h2><p>이전에 작품을 만든 기기와 브라우저에서 한 번만 가져오면 돼요. 새 주소에서 만든 작품도 함께 보관해요.</p><p role="status" aria-live="polite"></p><button type="button" data-open class="primary">기존 진열장 연결하기</button><p><label>백업 파일로 가져오기 <input type="file" accept=".json,application/json"></label></p><button type="button" data-close class="ghost">닫기</button>';
  document.body.appendChild(dialog);
  const status = dialog.querySelector('[role=status]'), open = dialog.querySelector('[data-open]');
  let popup, token, ready = false;
  entry.onclick = () => { status.textContent = ready ? '' : '이전 페이지 연결을 확인하고 있어요. 연결되지 않으면 잠시 후 다시 시도해 주세요.'; dialog.showModal(); };
  dialog.querySelector('[data-close]').onclick = () => dialog.close();
  function accept(payload) {
    const result = core.plan(localStorage, payload);
    core.apply(localStorage, result);
    if (result.found) {
      try { localStorage.setItem('todak.domain-transfer.v1', 'complete'); } catch (_) {}
      // Update the live personal store before any normal app save can overwrite the merged list.
      window.dispatchEvent(new Event('todak-personal-imported'));
      status.textContent = '작품 ' + result.added + '점을 추가했어요. 아래 버튼을 누르면 새 진열장에 반영돼요.';
      open.textContent = '새 진열장 확인하기'; open.onclick = () => location.reload();
      // Require the reload before editing: other app modules hold cached settings/wallet values.
      dialog.querySelector('[data-close]').hidden = true;
      dialog.oncancel = e => e.preventDefault();
    } else status.textContent = '이 브라우저에 저장된 기존 작품을 찾지 못했어요. 이전에 사용한 기기와 브라우저에서 다시 시도해 주세요.';
    return result;
  }
  open.onclick = () => {
    token = Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
    popup = window.open(BRIDGE + '#token=' + token, 'todak-transfer', 'popup,width=560,height=650');
    status.textContent = popup ? '열린 창에서 “작품 가져오기”를 눌러 주세요. 페이지가 열리지 않으면 이전 페이지 연결이 아직 준비되지 않은 상태예요.' : '팝업이 차단됐어요. 이 사이트의 팝업을 허용한 뒤 다시 눌러 주세요.';
  };
  window.addEventListener('message', e => {
    if (e.origin !== OLD || !e.data) return;
    if (e.source === probe.contentWindow && e.data.type === 'todak-bridge-ready') {
      ready = true; entry.hidden = false; probe.remove();
      // Display a non-modal reminder on home, never interrupt an in-progress pottery session.
      try { if (!localStorage.getItem('todak.domain-transfer.v1')) entry.textContent = '주소가 바뀌었어요 · 기존 작품 가져오기'; } catch (_) {}
      return;
    }
    if (e.source !== popup || !token || e.data.token !== token || e.data.type !== 'todak-transfer-data') return;
    try { const result = accept(e.data.payload); popup.postMessage({type: 'todak-transfer-saved', token, found: result.found}, OLD); }
    catch (error) { status.textContent = error.message; popup.postMessage({type: 'todak-transfer-error', token}, OLD); }
  });
  dialog.querySelector('input').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    try { if (file.size > 100 * 1024 * 1024) throw Error('백업 파일이 너무 커요.'); accept(JSON.parse(await file.text())); }
    catch (error) { status.textContent = error.message; }
    e.target.value = '';
  };
  const probe = document.createElement('iframe');
  probe.hidden = true; probe.title = '기존 작품 이전 페이지 연결 확인'; probe.src = BRIDGE;
  document.body.appendChild(probe); setTimeout(() => probe.remove(), 15000);
})();
