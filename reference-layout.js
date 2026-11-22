(() => {
  const id = (key) => document.getElementById(key);
  const make = (tag, className) => Object.assign(document.createElement(tag), { className });
  const header = document.querySelector('.ui-header');
  const sheet = id('sheet');
  const footer = id('ui-tool-footer');
  const views = id('ui-work-views');
  const workInfo = id('ui-work-info');
  const next = id('nextBtn');
  const history = document.querySelector('.ui-history');
  const home = id('home');
  const stage = id('stage');
  const label = (ko, en) => window.TODAK_LANG === 'en' ? en : ko;
  const editable = (step) => ['throw', 'deco', 'glaze'].includes(step);
  const elementSlot = (element) => {
    const marker = document.createComment('control position');
    element.before(marker);
    return marker;
  };
  const nextSlot = elementSlot(next);
  const workInfoSlot = elementSlot(workInfo);
  const groups = {
    throw: id('tools'),
    deco: id('ui-touch-deco'),
    glaze: id('ui-touch-glaze'),
  };
  const slots = Object.fromEntries(Object.entries(groups).map(([key, group]) => [key, elementSlot(group)]));
  const mobileChallenge = make('div', 'ref-mobile-challenge');
  const mobileChallengeLabel = make('span', '');
  const mobileChallengeName = make('strong', '');
  mobileChallenge.append(mobileChallengeLabel, mobileChallengeName);
  workInfo.querySelector('.ui-work-copy').append(mobileChallenge);
  id('ui-live-score').dataset.refCaption = label('점수', 'Score');
  id('ui-moves').dataset.refCaption = label('남은 횟수', 'Moves left');

  const beforeIfMoved = (host, node) => {
    if (node.parentElement !== host) host.append(node);
  };
  const brand = make('div', 'ref-brand');
  const mode = make('span', 'ref-mode');
  const homeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  homeIcon.setAttribute('viewBox', '0 0 24 24');
  homeIcon.setAttribute('aria-hidden', 'true');
  homeIcon.setAttribute('focusable', 'false');
  homeIcon.classList.add('ref-home-icon');
  homeIcon.innerHTML = '<path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
  const homeButton = id('homeBtn');
  const homeWord = make('span', 'ref-home-word');
  homeWord.append(...homeButton.childNodes);
  homeButton.replaceChildren(homeIcon, homeWord);
  header.prepend(brand);
  brand.append(header.querySelector('.ui-brand'), mode, header.querySelector('.ui-progress'));
  const progress = header.querySelector('.ui-progress');
  const stageOptions = make('div', 'ref-stage-options');
  stageOptions.id = 'refStageOptions';
  stageOptions.hidden = true;
  stageOptions.setAttribute('role', 'group');
  stageOptions.setAttribute('aria-label', label('제작 단계', 'Pottery stages'));
  header.append(stageOptions);
  const stageMenu = make('button', 'ref-stage-menu');
  stageMenu.type = 'button';
  stageMenu.textContent = '⌄';
  stageMenu.setAttribute('aria-label', label('제작 단계 보기', 'Show pottery stages'));
  stageMenu.setAttribute('aria-controls', stageOptions.id);
  stageMenu.setAttribute('aria-expanded', 'false');
  progress.append(stageMenu);
  function openStageMenu(open) {
    if (open) {
      const options = Array.from(id('steps').querySelectorAll('li[data-s]'), (step) => {
        const option = make('button', 'ref-stage-option');
        option.type = 'button';
        option.textContent = step.querySelector('.ui-step-name')?.textContent || step.getAttribute('aria-label');
        if (step.matches('[aria-current=step]')) option.setAttribute('aria-current', 'step');
        option.onclick = () => {
          openStageMenu(false);
          stageMenu.focus({ preventScroll: true });
          step.click();
        };
        return option;
      });
      stageOptions.replaceChildren(...options);
    }
    stageOptions.hidden = !open;
    stageMenu.setAttribute('aria-expanded', String(open));
    if (open) {
      const headerBox = header.getBoundingClientRect();
      const brandBox = brand.getBoundingClientRect();
      const toolbarBox = toolbar.getBoundingClientRect();
      const currentStep = id('steps').querySelector('[aria-current=step]') || stageMenu;
      const stepBox = currentStep.getBoundingClientRect();
      const anchor = (stepBox.left + stepBox.right) / 2 - headerBox.left;
      const coversToolbar = toolbarBox.height > 0 && toolbarBox.top >= brandBox.bottom;
      stageOptions.style.width = coversToolbar ? `${toolbarBox.width}px` : '';
      stageOptions.style.minHeight = coversToolbar ? `${toolbarBox.height}px` : '';
      const width = stageOptions.offsetWidth;
      const left = coversToolbar ? toolbarBox.left - headerBox.left
        : Math.max(0, Math.min(headerBox.width - width, anchor - width / 2));
      const top = coversToolbar ? toolbarBox.top : brandBox.bottom + 6;
      stageOptions.style.left = `${left}px`;
      stageOptions.style.top = `${top - headerBox.top}px`;
      stageOptions.style.setProperty('--stage-bubble-tail', `${anchor - left}px`);
      (stageOptions.querySelector('[aria-current=step]') || stageOptions.firstElementChild)?.focus({ preventScroll: true });
    }
  }
  stageMenu.onclick = () => openStageMenu(stageMenu.getAttribute('aria-expanded') === 'false');
  window.addEventListener('resize', () => {
    if (!stageOptions.hidden) openStageMenu(false);
  });
  progress.addEventListener('click', (event) => {
    if (event.target !== stageMenu) openStageMenu(false);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!stageOptions.hidden && !stageOptions.contains(event.target) && !stageMenu.contains(event.target)) openStageMenu(false);
  });
  header.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || stageOptions.hidden) return;
    event.stopPropagation();
    openStageMenu(false);
    stageMenu.focus({ preventScroll: true });
  });
  const toolbar = make('div', 'ref-toolbar');
  toolbar.setAttribute('aria-label', label('보기와 단계 이동', 'View and next stage'));
  header.append(toolbar);

  const dock = make('nav', 'ref-dock');
  const directTouch = matchMedia('(hover: none) and (pointer: coarse)');
  const phoneHeader = matchMedia('(max-width: 599px), (hover: none) and (pointer: coarse) and (orientation: landscape) and (max-height: 479px)');
  dock.setAttribute('aria-label', label('도예 도구', 'Pottery tools'));
  const dockHistory = make('div', 'ref-dock-history');
  const dockTools = make('div', 'ref-dock-tools');
  const dockReset = make('button', 'ref-dock-reset');
  dockReset.type = 'button';
  dock.append(dockHistory, dockTools, dockReset);
  dock.id = 'refToolDock';
  document.querySelector('.app').append(dock);
  [['wheelSide-deco', '옆'], ['wheelTop-deco', '위'], ['wheelBottom-deco', '밑바닥']]
    .forEach(([control, text]) => {
      const button = id(control);
      if (button && window.TODAK_LANG !== 'en') button.textContent = text;
    });
  const shapeTool = groups.throw.querySelector('[data-t=shape]');
  const thicknessTool = groups.throw.querySelector('[data-t=thick]');
  function toolPicture(button, name) {
    const image = make('img', 'renewal-tool-photo ref-tool-image');
    image.loading = 'lazy';
    image.src = 'renewal-assets/' + name + '.webp';
    image.alt = '';
    button.prepend(image);
  }
  toolPicture(shapeTool, 'shape-hand');
  toolPicture(thicknessTool, 'tool-wood-caliper');

  const utility = make('div', 'ref-home-utility');
  const homeShop = id('homeShop');
  const homeShelf = id('goShelf');
  const homeFeedback = id('homeFeedback');
  const feedbackEntry = homeFeedback.closest('.feedback-home-entry');
  const feedbackInvitation = id('feedbackInvitation');
  const homeFooter = home.querySelector('.homeFoot');
  const homeTutorial = id('goTutorial');
  const homeLinks = make('nav', 'ref-home-links');
  homeLinks.setAttribute('aria-label', label('진열장 및 피드백', 'Shelves and feedback'));
  const homeSound = make('button', 'ref-home-sound');
  homeSound.type = 'button';
  homeSound.append(id('sound').querySelector('svg').cloneNode(true));
  homeSound.onclick = () => id('sound').click();
  const syncSound = () => {
    const sound = id('sound');
    homeSound.setAttribute('aria-pressed', sound.getAttribute('aria-pressed'));
    homeSound.setAttribute('aria-label', sound.getAttribute('aria-label'));
  };
  new MutationObserver(syncSound).observe(id('sound'), {
    attributes: true, attributeFilter: ['aria-label', 'aria-pressed'],
  });
  syncSound();
  utility.append(homeShop, homeSound);
  home.append(utility);
  homeFeedback.textContent = label('피드백 남기기', 'Leave feedback');
  const shelfLinks = make('div', 'ref-home-shelf-links');
  feedbackEntry.append(homeFeedback, feedbackInvitation);
  shelfLinks.append(homeShelf, feedbackEntry);
  homeLinks.append(shelfLinks, id('goMarket'));
  const tutorialEntry = home.querySelector('.homeTutorialEntry');
  const homeActions = make('div', 'ref-home-actions');
  tutorialEntry.before(homeActions);
  homeActions.append(tutorialEntry, homeLinks);
  const saveNote = id('footSave');
  const footerNote = make('p', 'ref-footer-note');
  const footerLinks = make('nav', 'ref-footer-links');
  footerLinks.setAttribute('aria-label', label('사이트 안내', 'Site information'));
  saveNote.textContent = label('로그인 없이 바로 써요. 구운 작품은 이 기기에만 저장돼요.', 'No sign-in needed. Fired work is saved on this device.');
  id('footCopyright').textContent = label('© 2026 토닥', '© 2026 Todak');
  footerNote.append(saveNote);
  footerLinks.append(...['footCopyright', 'privacyNoticeOpen', 'addHome', 'langBtn', 'contactA'].map(id));
  homeFooter.classList.add('ref-home-footer');
  homeFooter.replaceChildren(footerNote, footerLinks);
  function alignFeedbackInvitation() {
    if (feedbackInvitation.hidden || home.hidden) return;
    const anchor = feedbackEntry.getBoundingClientRect();
    const width = feedbackInvitation.offsetWidth;
    const edge = 12;
    const center = anchor.left + anchor.width / 2;
    const left = Math.max(edge, Math.min(center - width / 2, document.documentElement.clientWidth - edge - width));
    feedbackInvitation.style.left = `${left - anchor.left}px`;
    feedbackInvitation.style.setProperty('--feedback-tail', `${center - left}px`);
  }
  const feedbackLayout = new ResizeObserver(alignFeedbackInvitation);
  feedbackLayout.observe(feedbackInvitation);
  feedbackLayout.observe(feedbackEntry);
  window.addEventListener('resize', alignFeedbackInvitation);
  home.querySelector('.homeSub').textContent = label('흙을 토닥토닥, 빚고 꾸미고 구워요', 'Pat, shape, decorate and fire your clay.');
  id('goFree').querySelector(':scope > span').textContent = label('무너질 걱정 없이', 'Clay won’t collapse');
  id('goChallenge').querySelector(':scope > span').textContent = label('시간제한 · 외워서 빚기', 'Timed · From memory');
  function syncHomeEntry() {
    const tutorial = window.TodakTutorial?.state();
    const resume = !id('homeClose').hidden;
    const first = !resume && !tutorial?.complete;
    const state = resume ? 'resume' : first ? 'first' : 'repeat';
    home.inert = home.hidden;
    home.dataset.refVisit = state;
    const title = id('tutorialEntryTitle');
    const text = first ? label('처음이라면 따라 빚어 보기', 'Try the pottery lesson')
      : label('튜토리얼 다시하기', 'Replay the lesson');
    if (title.firstChild?.nodeValue !== text) {
      title.textContent = text;
      if (first) title.append(Object.assign(make('small', 'ref-home-new'), { textContent: 'NEW' }));
    }
    id('tutorialEntryDescription').textContent = label('컵 하나를 빚으며 도구를 익혀요', 'Make a cup and learn the tools');
    homeTutorial.setAttribute('aria-label', title.textContent.replace(/NEW$/, ''));
    alignFeedbackInvitation();
  }
  new MutationObserver(syncHomeEntry).observe(id('homeClose'), { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(syncHomeEntry).observe(home, { attributes: true, attributeFilter: ['hidden'] });
  syncHomeEntry();

  const resultSearch = id('openSearch');
  const resultCard = id('openCard');
  const resultActions = make('div', 'ref-result-actions');
  resultSearch.before(resultActions);
  resultActions.append(resultCard, resultSearch);
  const resultLinks = make('div', 'ref-result-links');
  resultActions.after(resultLinks);
  resultLinks.append(id('personalChallengeFromDone'));
  const resultBadge = make('span', 'ref-result-points');
  resultBadge.hidden = true;
  id('sheetTitle').after(resultBadge);
  new MutationObserver(() => window.TodakResponsive.schedule()).observe(id('shelfCount'), { childList: true });
  const background = id('ui-background-picker');
  const backgroundSlot = elementSlot(background);
  background.dataset.refLabel = label('배경 변경', 'Background');
  background.setAttribute('aria-label', background.dataset.refLabel);
  const resultSize = make('div', 'ref-result-size');
  resultSize.id = 'ui-photo-size-controls';
  resultSize.setAttribute('role', 'group');
  resultSize.setAttribute('aria-label', label('사진 속 도자기 크기', 'Pottery size in photo'));
  const sizeOutput = make('span', 'ref-size-output');
  const syncSize = () => { sizeOutput.textContent = id('photoObjectSizeOut').textContent; };
  new MutationObserver(syncSize).observe(id('photoObjectSizeOut'), { childList: true, characterData: true, subtree: true });
  syncSize();
  resultSize.append(id('photoSizeLess'), sizeOutput, id('photoSizeMore'));
  const rotation = document.querySelector('.rotationControls');
  rotation.classList.add('ref-rotation');
  rotation.setAttribute('role', 'group');
  for (const [key, direction] of [['rotL', 'left'], ['rotR', 'right']]) {
    const arrow = make('span', 'ref-turn-icon ref-turn-' + direction);
    arrow.setAttribute('aria-hidden', 'true');
    id(key).replaceChildren(arrow);
  }
  const alternateView = id('viewToggle');
  const viewSettings = make('details', 'ref-view-settings');
  const viewTitle = document.createElement('summary');
  viewTitle.textContent = label('물레 보기', 'Wheel view');
  viewSettings.append(viewTitle, alternateView);
  id('sheetBody').append(viewSettings);
  const undo = id('ui-undo');
  const redo = id('ui-redo');
  undo.setAttribute('aria-label', label('되돌리기', 'Undo'));
  redo.setAttribute('aria-label', label('다시하기', 'Redo'));
  undo.title = undo.getAttribute('aria-label');
  redo.title = redo.getAttribute('aria-label');
  undo.dataset.refLabel = label('되돌리기', 'Undo');
  const goalSwitch = id('ui-goal-switch');
  const goalUnavailable = make('label', 'ref-empty-goal');
  const goalInput = document.createElement('input');
  goalInput.type = 'checkbox';
  goalInput.disabled = true;
  goalUnavailable.append(label('안내선', 'Guide'), goalInput);
  goalSwitch.after(goalUnavailable);

  const picker = id('chSel');
  const pickerHead = picker.querySelector('.shelfHead');
  pickerHead.querySelector('h2').textContent = label('도전하기', 'Challenge');
  id('chBack').textContent = '×';
  id('chBack').setAttribute('aria-label', label('도전 목록 닫기', 'Close challenge list'));
  pickerHead.after(id('tmode'));
  id('tmode').querySelector('[data-bm="1"]').textContent = label('외워서 · 5초만 보여요', 'From memory · 5 seconds');
  const pickerIntro = picker.querySelector('.chRule');
  const pickerLabel = document.createElement('b');
  pickerLabel.textContent = label('기본 도전', 'Built-in challenges');
  pickerIntro.replaceChildren(pickerLabel, label(' 별이 많을수록 어려워요', ' More stars means a harder shape'));
  picker.querySelector('.renewal-challenge-tabs').hidden = true;
  const personalSection = id('personalChallenges');
  for (const section of [id('renewal-built-in'), personalSection]) {
    for (const attribute of ['role', 'aria-labelledby', 'tabindex']) section.removeAttribute(attribute);
  }
  const personalResults = id('personalChallengeList');
  const personalTile = make('div', 'ref-personal-tile');
  const personalTileLabel = make('b', '');
  personalTileLabel.textContent = label('내가 만든 도전', 'My challenges');
  id('personalChallengeCreate').textContent = label('+ 본 만들기', '+ Create a model');
  id('personalChallengeImport').textContent = label('코드 입력', 'Enter a code');
  personalTile.append(personalTileLabel, id('personalChallengeCreate'), id('personalChallengeImport'));
  const challengeGrid = id('chGrid');
  function updatePersonalTile() {
    if (!challengeGrid.contains(personalTile)) challengeGrid.append(personalTile);
    personalSection.hidden = !personalResults.querySelector('[data-personal-id]');
    for (const stars of challengeGrid.querySelectorAll('.chCard i:not([data-ref-stars])')) {
      const filled = stars.textContent.length;
      stars.dataset.refStars = '';
      if (stars.closest('[data-run-target]')) continue;
      const remaining = make('span', 'ref-star-rest');
      remaining.textContent = '★'.repeat(Math.max(0, 4 - filled));
      remaining.setAttribute('aria-hidden', 'true');
      stars.append(remaining);
    }
    const master = challengeGrid.querySelector('.chSep span');
    if (master) master.textContent = label('본 5초 · 되돌리기 없음 · 85점 통과', '5-second model · No undo · Pass at 85');
  }
  updatePersonalTile();
  new MutationObserver(updatePersonalTile).observe(challengeGrid, { childList: true });
  new MutationObserver(updatePersonalTile).observe(personalResults, { childList: true });

  const freePicker = id('freeReferenceDialog');
  id('freeReferenceTitle').textContent = label('무엇을 빚을까요?', 'What would you like to make?');
  id('freeReferenceClose').textContent = '×';
  id('freeReferenceClose').setAttribute('aria-label', label('모양 선택 닫기', 'Close shape selection'));
  const freeNone = id('freeReferenceNone');
  freeNone.append(Object.assign(make('small', ''), { textContent: label('내 마음대로 ›', 'Start from scratch ›') }));
  freePicker.querySelector(':scope > p').hidden = true;
  const freeLabel = freePicker.querySelector('h3');
  freeLabel.textContent = label('본 보며 빚기', 'Make from a model');
  freeLabel.append(Object.assign(make('small', ''), { textContent: label('안내선을 따라 빚어요', 'Follow the guide') }));
  const freeBuiltins = id('freeReferenceBuiltins');
  const freePersonal = id('freeReferencePersonal');
  const customShape = make('div', 'ref-custom-shape');
  customShape.textContent = label('+\n내 형태\n만들기', '+\nMake my\nown shape');
  customShape.setAttribute('aria-disabled', 'true');
  function syncFreeCards() {
    [...freeBuiltins.querySelectorAll('.free-reference-card')].forEach((card, index) => {
      const plate = card.dataset.reference === 'plate';
      const level = index <= 2 && !plate ? 'easy' : [3, 4, 5, 8].includes(index) ? 'medium' : 'hard';
      const caption = card.querySelector('small');
      caption.dataset.level = level;
      caption.textContent = plate ? label('어려움 · ★★★', 'Hard · ★★★')
        : { easy: label('쉬움', 'Easy'), medium: label('보통', 'Medium'), hard: label('어려움', 'Hard') }[level];
    });
    if (!freeBuiltins.contains(customShape)) freeBuiltins.append(customShape);
    const hasPersonal = !!freePersonal.querySelector('button');
    freePersonal.hidden = freePersonal.previousElementSibling.hidden = !hasPersonal;
  }
  new MutationObserver(syncFreeCards).observe(freeBuiltins, { childList: true });
  new MutationObserver(syncFreeCards).observe(freePersonal, { childList: true });

  const ruleDialog = id('chRules').querySelector('.howBox');
  const ruleTitle = id('crName');
  const ruleBadge = make('span', 'ref-rule-badge');
  ruleBadge.textContent = label('도전', 'Challenge');
  ruleTitle.before(ruleBadge);
  const ruleSummary = make('div', 'ref-rule-summary');
  const ruleCount = ruleDialog.querySelector('.renewal-rules-count');
  const ruleInstruction = ruleDialog.querySelector('.renewal-rules-summary');
  const ruleCaution = make('p', 'ref-rule-caution');
  ruleCaution.textContent = label('흔들리면 손 떼기', 'Release if the clay wobbles');
  ruleCount.before(ruleSummary);
  ruleSummary.append(ruleCount, ruleInstruction, ruleCaution);
  for (const [rule, icon] of [[ruleCount, '☝'], [ruleInstruction, '◌'], [ruleCaution, '≋']]) {
    rule.dataset.refIcon = icon;
  }
  const warnings = make('div', 'ref-rule-warnings');
  const warningTitle = make('b', '');
  warningTitle.textContent = label('이럴 때 흙이 주저앉아요', 'When the clay may collapse');
  const warningList = make('div', 'ref-rule-warning-list');
  ruleDialog.querySelectorAll('.howSteps li b').forEach((reason) => {
    const text = make('span', '');
    text.textContent = reason.textContent;
    warningList.append(text);
  });
  warnings.append(warningTitle, warningList);
  const ruleDetails = ruleDialog.querySelector('.renewal-rules-detail');
  ruleDetails.before(warnings);
  ruleDetails.querySelector('summary').textContent = label('점수 기준 보기 ›', 'Scoring criteria ›');

  const moveCaptions = () => {
    const reset = id('resetPhoto');
    reset.title = label('보기 초기화', 'Reset view');
    const navigation = header.querySelector('.ui-header-actions');
    navigation.classList.add('ref-utility');
    for (const button of groups.throw.querySelectorAll('[data-t]')) {
      const name = button.dataset.t === 'shape' ? button.querySelector(':scope > span') : button;
      button.title = (name || button).textContent.trim();
    }
  };
  moveCaptions();
  for (const group of Object.values(groups)) {
    for (const button of group.querySelectorAll('[data-t],[data-d],[data-slot]')) {
      const photo = button.querySelector(':scope > .renewal-tool-photo');
      if (photo) {
        const artwork = make('span', 'ref-dock-art');
        photo.replaceWith(artwork);
        artwork.append(photo);
      }
      const caption = make('small', 'ref-dock-caption');
      caption.setAttribute('aria-hidden', 'true');
      caption.textContent = button.id === 'rackGlazeBase' ? label('바탕 유약', 'Base glaze')
        : button.id === 'rackGlazeBrush' ? label('붓 유약', 'Brush glaze') : button.dataset.t ? button.title : button.textContent.trim();
      const shortLabels = { shape: label('모양 빚기', 'Shape'), thick: label('두께', 'Wall'),
        sponge: label('매끈하게', 'Smooth'), carve: label('새김', 'Carve'), erase: label('지움', 'Erase') };
      const short = shortLabels[button.dataset.t || button.dataset.d];
      if (short) caption.dataset.short = short;
      button.append(caption);
    }
  }

  const stamps = id('stamps');
  const stampButtons = [...stamps.querySelectorAll('[data-s]')];
  const commonStamps = ['flower', 'leaf', 'star', 'wave', 'moon'].map(shape =>
    stampButtons.find(button => button.dataset.s === shape));
  const extraStamps = stampButtons.filter(button => !commonStamps.includes(button));
  const stampMore = make('button', 'chip ref-stamp-more');
  stampMore.id = 'stampMore';
  stampMore.type = 'button';
  stampMore.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  stampMore.setAttribute('aria-controls', 'stamps');
  stamps.append(...commonStamps, ...extraStamps, stampMore);
  extraStamps.forEach(button => button.classList.add('ref-stamp-secondary'));
  let expandedStamps = false;
  function refreshStamps() {
    const selectedExtra = !expandedStamps && extraStamps.find(button => button.getAttribute('aria-pressed') === 'true');
    commonStamps.at(-1).hidden = Boolean(selectedExtra);
    extraStamps.forEach(button => {
      button.hidden = !expandedStamps && button !== selectedExtra;
      button.classList.toggle('ref-stamp-current-extra', button === selectedExtra);
    });
    const title = expandedStamps ? label('도장 모양 접기', 'Show fewer stamps') : label('도장 모양 더 보기', 'Show more stamps');
    if (stampMore.title !== title) {
      stampMore.title = title;
      stampMore.setAttribute('aria-label', title);
      stampMore.setAttribute('aria-expanded', String(expandedStamps));

    }
  }
  stampMore.onclick = () => {
    expandedStamps = !expandedStamps;
    refreshStamps();
  };
  new MutationObserver(refreshStamps).observe(stamps, {subtree:true, attributes:true, attributeFilter:['aria-pressed']});
  refreshStamps();

  let lastStage;
  let lastOpenMode;
  let lastSettingsTool;
  let lastEditingBounds;
  let coachBottom = 0;
  let kilnCoachHeight = 0;
  let kilnViewport = '';
  // A compact unfolded display is still a tablet workspace, even when browser bars reduce its height.
  const tablet = () => directTouch.matches && innerWidth <= 1700 && (
    (innerWidth >= 600 && innerHeight >= 600) ||
    (innerWidth >= 650 && innerHeight >= 480 && innerWidth / innerHeight <= 1.8)
  );
  const compactTablet = () => tablet() && Math.min(innerWidth, innerHeight) < 744;
  const landscapeTablet = () => tablet() && innerWidth > innerHeight;
  const shortLandscape = () => innerWidth < 600 && innerHeight < 450 && innerWidth > innerHeight;
  const notebook = matchMedia('(pointer: fine) and (min-width: 1101px) and (max-width: 1599px) and (max-height: 1000px)');
  const stackedWorkspace = () => tablet() ? !landscapeTablet() : innerWidth < 600 || (innerHeight > 560 && (innerWidth < 960 ||
    (directTouch.matches && innerWidth <= 1400 && innerHeight >= innerWidth)));
  const compactWorkspace = () => innerWidth < 960 || tablet();
  const toolSettings = () => editable(stage.dataset.stage) && compactWorkspace();
  const activeTool = () => dock.querySelector('[data-t][aria-pressed=true], [data-d][aria-pressed=true], [data-slot][aria-pressed=true]');
  const lucky = id('lucky');
  const luckySlot = document.createComment('random glaze');
  lucky.before(luckySlot);
  lucky.textContent = label('랜덤', 'Random');
  lucky.title = label('색과 표면을 무작위로 고르기', 'Randomize glaze and finish');
  function positionToolSettings() {
    const button = activeTool();
    const panel = sheet.getBoundingClientRect();
    if (!button || !panel.width) return;
    const bounds = button.getBoundingClientRect();
    if (landscapeTablet()) {
      const minTop = header.getBoundingClientRect().bottom + 12;
      const dockTop = dock.getBoundingClientRect().top;
      const top = Math.max(minTop, Math.min(dockTop - panel.height - 12, bounds.top + (bounds.height - panel.height) / 2));
      sheet.style.setProperty('--ref-settings-side-top', `${Math.round(top)}px`);
      return;
    }
    const panelWidth = panel.width;
    const handle = bounds.left + bounds.width / 2;
    const left = tablet()
      ? Math.max(12, Math.min(innerWidth - panelWidth - 12, handle - panelWidth / 2))
      : (innerWidth - panelWidth) / 2;
    sheet.style.setProperty('--ref-settings-left', `${Math.round(left)}px`);
    sheet.style.setProperty('--ref-settings-pointer', `${Math.round(Math.max(18, Math.min(panelWidth - 18, handle - left)))}px`);
  }
  function arrange(step, layout) {
    const editing = editable(step);
    const onHome = !home.hidden || !id('chSel').hidden;
    const useDock = editing && !onHome;
    if (expandedStamps && (step !== 'deco' || id('f-stamp').hidden || !sheet.classList.contains('open') || onHome)) {
      expandedStamps = false;
      refreshStamps();
    }
    const touchLayout = layout === 'sheet';
    const horizontalDock = compactWorkspace() || directTouch.matches;
    const workspace = compactWorkspace() ? (touchLayout ? 'stacked' : 'side') : '';
    if (step !== 'fire' || onHome) kilnCoachHeight = 0;
    document.body.dataset.refWorkspace = workspace;
    document.body.classList.toggle('ref-short-landscape', shortLandscape());
    document.body.dataset.refForm = tablet() ? (landscapeTablet() ? 'tablet-landscape' : 'tablet-portrait') : notebook.matches ? 'notebook' : '';
    document.body.toggleAttribute('data-ref-compact-tablet', compactTablet());
    const glazeBaseOpen = step === 'glaze' && workspace && id('rackGlazeBase').getAttribute('aria-pressed') === 'true';
    if (glazeBaseOpen) {
      const help = id('stageHelpButton');
      if (lucky.nextElementSibling !== help) help.before(lucky);
    }
    else if (lucky.previousSibling !== luckySlot) luckySlot.after(lucky);
    lucky.classList.toggle('ref-random-glaze', Boolean(glazeBaseOpen));
    id('shelfBtn').hidden = step !== 'done';
    dock.hidden = !useDock;
    dock.dataset.orientation = horizontalDock ? 'horizontal' : 'vertical';
    toolbar.hidden = !editing && step !== 'done';
    document.body.classList.toggle('ref-editing', editing);
    document.body.classList.toggle('ref-finished', step === 'done');
    document.body.classList.toggle('ref-firing', step === 'fire');
    const workState = id('modeChip').textContent;
    const challengeSculpt = step === 'throw' && !id('chRestart').hidden;
    const modeName = workState.includes('튜토리얼') ? label('연습', 'Practice')
      : workState.includes('도전') ? label('도전', 'Challenge') : label('자유', 'Free');
    if (mode.textContent !== modeName) mode.textContent = modeName;

    if (editing || step === 'done') beforeIfMoved(toolbar, views);
    const showChallengeStatus = challengeSculpt && !onHome;
    const usePhoneChallenge = showChallengeStatus && phoneHeader.matches;
    brand.toggleAttribute('data-challenge-status', usePhoneChallenge);
    toolbar.toggleAttribute('data-challenge-status', showChallengeStatus && !usePhoneChallenge);
    if (usePhoneChallenge) {
      const separator = workState.indexOf(' · ');
      const caption = separator < 0 ? label('도전', 'Challenge') : workState.slice(0, separator);
      const name = separator < 0 ? workState : workState.slice(separator + 3);
      if (mobileChallengeLabel.textContent !== caption) mobileChallengeLabel.textContent = caption;
      if (mobileChallengeName.textContent !== name) mobileChallengeName.textContent = name;
      mobileChallengeName.title = name;
      beforeIfMoved(brand, workInfo);
    } else if (showChallengeStatus) {
      if (workInfo.parentElement !== toolbar) toolbar.prepend(workInfo);
    } else if (workInfo.previousSibling !== workInfoSlot) {
      workInfoSlot.after(workInfo);
    }
    const showRotation = ['deco', 'glaze', 'done'].includes(step);
    if (showRotation && rotation.previousElementSibling !== views) views.after(rotation);
    rotation.hidden = !showRotation;
    for (const button of rotation.querySelectorAll('button')) button.hidden = !showRotation;
    if (editing) beforeIfMoved(toolbar, next);
    else if (step === 'done') beforeIfMoved(resultLinks, next);
    else if (next.parentElement !== footer) nextSlot.after(next);
    if (step === 'done') {
      beforeIfMoved(toolbar, background);
      beforeIfMoved(toolbar, resultSize);
    } else {
      if (background.previousSibling !== backgroundSlot) backgroundSlot.after(background);
      resultSize.remove();
    }
    for (const [key, group] of Object.entries(groups)) {
      if (key === step && editing) beforeIfMoved(dockTools, group);
      else if (group.previousSibling !== slots[key]) slots[key].after(group);
    }
    if (editing) beforeIfMoved(dockHistory, history);
    dockHistory.hidden = !editing;
    dock.dataset.stage = step;
    dock.toggleAttribute('data-challenge-sculpt', challengeSculpt);
    const throwAgain = step === 'throw';
    const resetLabel = challengeSculpt ? label('다시 도전하기', 'Retry challenge')
      : throwAgain ? label('처음부터', 'Start over') : label('다시 꾸미기', 'Decorate again');
    if (dockReset.textContent !== resetLabel) {
      dockReset.textContent = resetLabel;
      dockReset.title = resetLabel;
      dockReset.setAttribute('aria-label', resetLabel);
    }
    dockReset.hidden = !editing;
    viewSettings.hidden = true;
    resultBadge.hidden = step !== 'done' || !window.TodakRealPhoto?.awardedPoints();
    if (!resultBadge.hidden) resultBadge.textContent = '+' + window.TodakRealPhoto.awardedPoints() + 'P';

    if (useDock && workspace && (lastStage !== step || lastOpenMode !== workspace)) {
      if (sheet.classList.contains('open')) id('sheetToggle').click();
    }
    if (step === 'done' && touchLayout && !onHome && lastStage !== step && !sheet.classList.contains('open')) {
      id('sheetToggle').click();
    }
    const appearancePicker = id('ui-appearance-dialog');
    if (step === 'done' && tablet()) {
      appearancePicker.style.setProperty('--ref-tablet-picker-top', `${Math.ceil(header.getBoundingClientRect().bottom) + 8}px`);
    }
    if (step === 'done' && appearancePicker.open && appearancePicker.hasAttribute('data-keep-sheet-interactive')) {
      const room = sheet.getBoundingClientRect().top - appearancePicker.getBoundingClientRect().top - 8;
      appearancePicker.style.setProperty('--ref-appearance-room', `${Math.max(70, Math.round(room))}px`);
    }
    const toolStatus = [...dock.querySelectorAll('[aria-pressed=true]')].map((b) => b.dataset.t || b.dataset.d || b.dataset.slot).join('/');
    if (toolStatus !== lastSettingsTool) {
      id('sheetBody').scrollTop = 0;
      lastSettingsTool = toolStatus;
    }
    if (useDock && (workspace === 'stacked' || landscapeTablet()) && sheet.classList.contains('open')) positionToolSettings();
    lastStage = onHome ? undefined : step;
    lastOpenMode = workspace;
    window.TodakReferenceLesson?.sync(step);
  }

  dockReset.onclick = () => {
    if (stage.dataset.stage === 'throw') {
      if (dock.hasAttribute('data-challenge-sculpt')) id('chRestart').click();
      else document.dispatchEvent(new Event('todak-preview-reset-clay'));
    } else if (stage.dataset.stage === 'deco') {
      id('dClear').click();
    } else {
      id('backDeco').click();
    }
  };
  let activeBeforeClick = false;
  dock.addEventListener('click', (event) => {
    const tool = event.target.closest('[data-t],[data-d],[data-slot]');
    activeBeforeClick = tool?.getAttribute('aria-pressed') === 'true';
  }, true);
  dock.addEventListener('click', (event) => {
    if (!toolSettings() || !event.target.closest('[data-t],[data-d],[data-slot]')) return;
    const open = sheet.classList.contains('open');
    if (!open || activeBeforeClick) id('sheetToggle').click();
  });
  new MutationObserver(() => window.TodakResponsive.refresh()).observe(home, {
    attributes: true, attributeFilter: ['hidden'],
  });
  new MutationObserver(() => window.TodakResponsive.refresh()).observe(id('chSel'), {
    attributes: true, attributeFilter: ['hidden'],
  });
  directTouch.addEventListener('change', () => window.TodakResponsive.refresh());
  notebook.addEventListener('change', () => window.TodakResponsive.refresh());
  const changes = new ResizeObserver(() => {
    const current = editingBounds(stage.dataset.stage) || fireBounds() || resultBounds();
    const key = current ? Object.values(current).join('/') : '';
    if (key !== lastEditingBounds) {
      lastEditingBounds = key;
      window.TodakResponsive.schedule();
    }
  });
  for (const node of [sheet, toolbar, id('tutorialCoach'), dock]) changes.observe(node);
  function editingBounds(step) {
    if (!toolSettings() || !editable(step) || dock.hidden) return null;
    const sideways = !stackedWorkspace();
    const coach = id('tutorialCoach');
    if (!document.body.classList.contains('tutorial-guided')) coachBottom = 0;
    else if (!coach.hidden) coachBottom = coach.getBoundingClientRect().bottom;
    const top = Math.max(header.getBoundingClientRect().bottom,
      coachBottom,
      id('ui-work-info').getBoundingClientRect().bottom) + 12;
    const settingsTop = `${Math.round(top)}px`;
    if (sheet.style.getPropertyValue('--ref-settings-top') !== settingsTop) sheet.style.setProperty('--ref-settings-top', settingsTop);
    const horizontal = dock.dataset.orientation === 'horizontal';
    const dockTop = horizontal ? dock.getBoundingClientRect().top : innerHeight;
    const panelOpen = sheet.classList.contains('open');
    if (shortLandscape()) {
      const width = (innerWidth - 24) / 2;
      return { x: width / 2 + 8, width, top, base: dockTop - 38, fitToRoom: true };
    }
    const bottom = !sideways && panelOpen ? sheet.getBoundingClientRect().top : dockTop;
    const lift = tablet() && !sideways ? Math.min(62, Math.max(0, (bottom - top) * .10)) : 0;
    const roomClearance = !sideways ? (panelOpen ? 12 : 20) + lift : Math.min(90, Math.max(24, (bottom - top) * .15));
    const clearance = horizontal && !panelOpen ? Math.max(50, roomClearance) : roomClearance;
    if (landscapeTablet()) {
      const x = innerWidth * .47;
      const panelWidth = Math.max(Math.min(365, Math.max(240, innerWidth * .25)), panelOpen ? sheet.offsetWidth : 0);
      const panelLeft = innerWidth - panelWidth - 14;
      const base = Math.min(top + (innerHeight - top) * .75, dockTop - 46);
      return { x, width: Math.max(170, 2 * (panelLeft - x) + 46), top, base, fitToRoom: false };
    }
    const workWidth = sideways ? innerWidth * .7 : innerWidth;
    return {
      x: workWidth / 2,
      width: workWidth,
      top,
      base: bottom - clearance,
      fitToRoom: !sideways,
    };
  }
  function fireBounds() {
    if (stage.dataset.stage !== 'fire') return null;
    const guided = !!window.TodakTutorial?.state().active;
    if (!guided && !compactWorkspace()) return null;
    const short = guided && innerWidth >= 600 && innerHeight <= 560;
    const headerBottom = header.getBoundingClientRect().bottom;
    const viewport = `${innerWidth}/${innerHeight}/${guided}`;
    if (viewport !== kilnViewport) {
      kilnViewport = viewport;
      kilnCoachHeight = 0;
    }
    if (guided) {
      const guideBox = id('tutorialCoach').getBoundingClientRect();
      if (guideBox.height) kilnCoachHeight = Math.max(kilnCoachHeight, Math.min(guideBox.height, innerHeight * .44));
    }
    const gap = Math.round(Math.min(38, Math.max(20, innerHeight * .036)));
    return {x: innerWidth * (short ? .73 : .5), top: headerBottom + (short ? 0 : kilnCoachHeight + gap) + 14, gap, short};
  }
  function resultBounds() {
    if (stage.dataset.stage !== 'done' || !compactWorkspace()) return null;
    // Keeping this space stable lets a tutorial gesture hide its hint without reframing the photo.
    const top = header.getBoundingClientRect().bottom + (stackedWorkspace() ? 56 : 8);
    const bottom = stage.getBoundingClientRect().bottom;
    const width = stackedWorkspace() ? innerWidth : Math.max(innerWidth * .46, sheet.getBoundingClientRect().left - 12);
    return { top, bottom, width };
  }
  window.TodakReferenceLayout = {
    arrange,
    stackedWorkspace,
    toolSettings,
    activeTool,
    editingBounds,
    compactCoach: () => (toolSettings() || stage.dataset.stage === 'done' && compactWorkspace()) ? {
      width: stackedWorkspace() ? Math.min(innerWidth - 24, tablet() ? 540 : 480) : Math.min(380, innerWidth * .55),
      top: header.getBoundingClientRect().bottom + 8,
    } : null,
    fireBounds,
    resultBounds,
    usesTop: (step) => editable(step) || step === 'done',
    cueAnchor: (group) => slots[Object.keys(groups).find((key) => groups[key] === group)],
    canvasWidth: (step) => editable(step) || step === 'fire' || step === 'done',
    fullHeight: (step) => editable(step) || step === 'fire',
    reserve: (step, height) => editable(step) ? innerHeight * (innerWidth >= 600 ? .2 : .361)
      : step === 'fire' && innerWidth < 600 ? innerHeight * .44 : height,
    scale: (step) => editable(step) && innerWidth >= 600 && innerWidth < 960 && innerHeight > 560 ? .79 : 1,
  };
  const style = make('link', '');
  style.rel = 'stylesheet';
  style.href = 'reference-layout.css?v=887f063d5092';
  style.onload = () => window.TodakResponsive.refresh();
  document.head.append(style);
  const fidelity = make('link', '');
  fidelity.rel = 'stylesheet';
  fidelity.href = 'reference-fidelity.css?v=78a629446bc5';
  fidelity.onload = () => window.TodakResponsive.refresh();
  document.head.append(fidelity);
  document.body.classList.add('todak-reference');
  window.TodakResponsive.refresh();
})();
