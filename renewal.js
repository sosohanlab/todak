(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const copy = (korean, english) => window.TODAK_LANG === 'en' ? english : korean;
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'renewal.css?v=4399c89be0e0';
  document.head.append(stylesheet);
  document.body.classList.add('todak-renewal');

  function artwork(target, name, className) {
    const img = document.createElement('img');
    if (name !== 'icon-tap') img.loading = 'lazy';
    img.src = 'renewal-assets/' + name + '.webp';
    img.alt = '';
    img.className = className;
    img.draggable = false;
    target.prepend(img);
  }

  const home = byId('home');
  let homeScene = byId('homeScene');
  if (!homeScene) {
    // Older cached HTML may still load this script during a deployment.
    homeScene = document.createElement('picture');
    homeScene.className = 'renewal-home-scene';
    homeScene.innerHTML = '<source media="(orientation: portrait) and (width < 600px)" srcset="renewal-assets/home-wheel-mobile.webp?v=8ebe34845837">' +
      '<source media="(min-width: 600px) and (max-width: 1100px) and (min-height: 600px), (pointer: coarse) and (min-width: 600px) and (min-height: 600px) and (max-width: 1700px)" srcset="renewal-assets/home-wheel-tablet.webp">' +
      '<img src="renewal-assets/home-wheel-desktop.webp" alt="" fetchpriority="high">';
  }
  home.prepend(homeScene);

  const homeMenu = home.querySelector('.homeMenus');
  const introBreak = home.querySelector('.homeSub br');
  introBreak?.before(' ');
  const resume = byId('homeClose');
  homeMenu.prepend(resume);
  for (const [id, image] of [
    ['goTutorial', 'tap'], ['goChallenge', 'trophy'],
    ['goMarket', 'picture'], ['menuBtn', 'home'],
  ]) {
    const target = byId(id);
    if (target) artwork(target, 'icon-' + image, 'renewal-icon');
  }
  for (const id of ['goShelf', 'shelfBtn']) {
    byId(id)?.insertAdjacentHTML('afterbegin', '<svg class="ref-shelf-icon" viewBox="0 3 24 24" aria-hidden="true"><path d="M2 18h20v3H2zM4 18v-3c0-2 3-3 3-5V7h4v3c0 2 3 3 3 5v3m2 0v-4l1-2h3l1 2v4M6.5 7h5M4 21v2m16-2v2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  }
  function shortenHomeCopy(id, korean, english) {
    const label = byId(id).querySelector(':scope > span');
    label.textContent = copy(korean, english);
  }
  shortenHomeCopy('goFree', '원하는 모양으로 빚어요.', 'Shape clay your way.');
  shortenHomeCopy('goChallenge', '정해진 횟수로 본을 따라 빚어요.', 'Follow a model with limited moves.');

  const photos = {
    '[data-t=trim]': 'trim',
    '[data-t=sponge]': 'sponge',
    '[data-d=brush]': 'brush',
    '[data-d=stamp]': 'stamp',
    '[data-d=carve]': 'carve',
    '[data-d=erase]': 'erase',
    '#rackGlazeBase': 'glaze',
    '#rackGlazeBrush': 'glazeBrush',
  };
  for (const [selector, image] of Object.entries(photos)) {
    const button = document.querySelector('#sheet ' + selector) || document.querySelector(selector);
    if (button) artwork(button, 'tool-' + image, 'renewal-tool-photo');
  }

  const challenge = byId('chSel');
  const personal = byId('personalChallenges');
  const grid = byId('chGrid');
  const mode = byId('tmode');
  const heading = challenge.querySelector('.personal-builtin-heading');
  const intro = challenge.querySelector('.chRule');
  const tabs = document.createElement('div');
  tabs.className = 'renewal-challenge-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', copy('도전 목록', 'Challenge library'));
  const builtIn = document.createElement('section');
  builtIn.id = 'renewal-built-in';
  mode.before(tabs, builtIn);
  builtIn.append(intro, mode, heading, grid);

  const options = [
    { panel: builtIn, label: copy('기본 도전', 'Built-in challenges') },
    { panel: personal, label: copy('내가 만든 도전', 'My challenges') },
  ];
  options.forEach((entry, index) => {
    const button = document.createElement('button');
    button.id = 'renewal-challenge-tab-' + index;
    button.type = 'button';
    button.textContent = entry.label;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', entry.panel.id);
    entry.panel.setAttribute('role', 'tabpanel');
    entry.panel.setAttribute('aria-labelledby', button.id);
    entry.panel.tabIndex = 0;
    entry.button = button;
    button.addEventListener('click', () => selectChallengeList(index));
    button.addEventListener('keydown', (event) => {
      const next = { ArrowLeft: 1 - index, ArrowRight: 1 - index, Home: 0, End: 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectChallengeList(next);
      options[next].button.focus();
    });
    tabs.append(button);
  });

  function selectChallengeList(selected) {
    if (document.body.classList.contains('todak-reference')) return;
    options.forEach(({ panel, button }, index) => {
      const active = index === selected;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
    });
  }

  intro.textContent = copy('빚는 방법과 도전할 모양을 골라요.', 'Choose a mode and a shape.');
  mode.querySelector('[data-bm="1"]').textContent = copy('외워서 빚기', 'From memory');
  byId('goChallenge').addEventListener('click', () => selectChallengeList(0));
  byId('otherCh').addEventListener('click', () => selectChallengeList(0));
  const personalList = byId('personalChallengeList');
  const personalNames = () => Array.from(personalList.querySelectorAll('[data-personal-id]'),
    (card) => card.dataset.personalId + ':' + card.textContent).join('|');
  let lastPersonalNames = personalNames();
  new MutationObserver(() => {
    const next = personalNames();
    if (!challenge.hidden && next && next !== lastPersonalNames) selectChallengeList(1);
    lastPersonalNames = next;
  }).observe(personalList, { childList: true });
  selectChallengeList(0);

  const rules = byId('chRules');
  const ruleBox = rules.querySelector('.howBox');
  const ruleIntro = ruleBox.querySelector('.crLead');
  const count = byId('crN');
  const countLabel = document.createElement('p');
  countLabel.className = 'renewal-rules-count';
  const moveCount = document.createElement('span');
  moveCount.append(count, copy('회', ' moves'));
  countLabel.append(copy('모양 잡기', 'Shaping'), moveCount);
  const summary = document.createElement('p');
  summary.className = 'renewal-rules-summary';
  const model = document.createElement('canvas');
  model.className = 'renewal-rules-model';
  model.width = 140;
  model.height = 150;
  model.setAttribute('aria-hidden', 'true');
  let selectedModel = null;
  challenge.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    const thumbnail = button?.querySelector('canvas');
    if (thumbnail) selectedModel = thumbnail;
  }, true);
  ruleBox.querySelector('h2').after(model, countLabel, summary);
  const details = document.createElement('details');
  details.className = 'renewal-rules-detail';
  const detailTitle = document.createElement('summary');
  detailTitle.textContent = copy('규칙과 점수 자세히 보기', 'Rules and scoring');
  details.append(detailTitle);
  byId('crGo').before(details);
  for (const child of [...ruleBox.children]) {
    if (child.matches('.crLead:not(#crBlind):not(#crMaster), .crHead, .howSteps, .personal-challenge-rules')) {
      details.append(child);
    }
  }
  // Keep the engine's original move-counter node in the prominent summary.
  ruleIntro.replaceChildren(copy('한 번 누르고 떼면 모양 잡기 1회예요. 두께 조절과 매끈하게는 횟수에 포함되지 않아요.',
    'One press and release counts as one shaping move. Thickness and smoothing don’t count.'));
  function updateRules() {
    if (rules.hidden) return;
    details.open = false;
    const isPersonal = rules.classList.contains('personal-challenge-active');
    const fromMemory = !byId('crBlind').hidden;
    // Memory and master challenges reveal their model only when the timed round starts.
    model.hidden = !selectedModel || fromMemory || !byId('crMaster').hidden;
    if (!model.hidden) {
      const context = model.getContext('2d');
      context.clearRect(0, 0, model.width, model.height);
      context.drawImage(selectedModel, 0, 0, model.width, model.height);
    }
    summary.textContent = isPersonal
      ? copy('저장한 본의 모양을 따라 빚어요.', 'Shape the clay to match the saved model.')
      : fromMemory ? copy('5초 동안 본을 보고 기억한 모양을 빚어요.', 'Study the model for 5 seconds, then shape it from memory.')
        : copy('파란 점선에 맞춰 빚어요.', 'Shape the clay to match the blue outline.');
  }
  new MutationObserver(updateRules).observe(rules, {
    attributes: true, attributeFilter: ['hidden', 'class'],
  });

  const pointer = document.querySelector('#tutorialHand svg');
  if (pointer) {
    const gesture = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    gesture.setAttribute('href', 'renewal-assets/gesture.webp');
    gesture.setAttribute('x', '10');
    gesture.setAttribute('y', '3');
    gesture.setAttribute('width', '36');
    gesture.setAttribute('height', '48');
    pointer.replaceChildren(gesture);
  }

  byId('shelfShop').textContent = copy('진열장 꾸미기', 'Style my shelf');
  byId('shelfEmpty').textContent = copy('가마에서 꺼낸 작품이 여기에 모여요.', 'Finished pieces are kept here.');
  const trim = byId('trimControls');
  const trimTips = [...trim.querySelectorAll(':scope > .tip')];
  const trimDetails = document.createElement('details');
  trimDetails.className = 'renewal-trim-help';
  const trimTitle = document.createElement('summary');
  trimTitle.textContent = copy('깎기 팁', 'Trimming tips');
  trimDetails.append(trimTitle, ...trimTips);
  trim.append(trimDetails);

  if (!['todak.sosohanlab.com', 'sosohanlab.github.io'].includes(location.hostname)) {
    byId('feedbackForm').addEventListener('submit', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      byId('feedbackStatus').textContent = copy('의견은 토닥 공식 사이트에서 보낼 수 있어요.',
        'Send feedback from the official TODAK site.');
    }, true);
  }
})();
