(() => {
  const id = (value) => document.getElementById(value);
  const english = window.TODAK_LANG === 'en';
  const text = (ko, en) => english ? en : ko;
  const element = (tag, className, value) => {
    const node = document.createElement(tag);
    node.className = className;
    if (value) node.textContent = value;
    return node;
  };
  const asset = 'renewal-assets/lessons/';
  const courses = {
    throw: [text('빚기 도구 익히기', 'Learn the shaping tools'), [
      ['controls', text('조작방법', 'Controls'), text('휠·두 손가락으로 확대·축소해요.\n꾸미기·유약은 좌우 버튼으로 돌려요.', 'Zoom with the wheel or pinch.\nUse arrows in Decorate or Glaze.')],
      ['shape', text('모양 잡기', 'Shape'), text('옆면을 잡고 좌우로 끌면 모양이 바뀌어요.', 'Drag the clay sideways to shape it.')],
      ['trim', text('깎기', 'Trim'), text('깎을 곳에 도구를 대고 안쪽으로 살짝 밀어요.', 'Press the tool gently into the area you want to trim.')],
      ['thick', text('속·두께', 'Hollow'), text('단면에서 안쪽 벽을 끌어 두께를 바꿔요.', 'Drag the inner wall in section view to change its thickness.')],
      ['smooth', text('매끈하게', 'Smooth'), text('전체에서는 바깥면을, 단면에서는 안쪽 벽을 문질러요.', 'Rub the outside in full view or the inner wall in section view.')],
    ]],
    deco: [text('꾸미기 도구 익히기', 'Learn the decorating tools'), [
      ['brush', text('붓', 'Brush'), text('굵기를 고르고 작품 위를 끌어 그려요.', 'Choose a size and drag across the piece to paint.')],
      ['carve', text('조각칼', 'Carve'), text('조각칼로 선을 그으면 홈을 파거나 돋울 수 있어요.', 'Drag the carving tool to cut or raise a line.')],
      ['stamp', text('도장', 'Stamp'), text('모양을 고르고 원하는 곳을 눌러 찍어요.', 'Choose a stamp and tap where you want it.')],
      ['erase', text('지우개', 'Erase'), text('지울 무늬 위를 가볍게 문질러요.', 'Rub over the decoration to erase it.')],
    ]],
    glaze: [text('유약 도구 익히기', 'Learn the glazing tools'), [
      ['base-glaze', text('바탕 유약', 'Base glaze'), text('색을 고르면\n작품 전체에 입혀져요.', 'Pick a color to glaze the whole piece.')],
      ['brush-glaze', text('붓 유약', 'Brush glaze'), text('색을 고르고 붓을 움직인 자리에 유약을 칠해요.', 'Choose a color, then drag to glaze just where the brush touches.')],
    ]],
  };

  const dialog = element('dialog', 'ref-lesson-card');
  dialog.id = 'refLessonCard';
  dialog.setAttribute('aria-labelledby', 'refLessonTitle');
  const title = element('h2', 'ref-lesson-title');
  title.id = 'refLessonTitle';
  const tabs = element('div', 'ref-lesson-steps');
  tabs.setAttribute('role', 'tablist');
  const panel = element('div', 'ref-lesson-panel');
  panel.id = 'refLessonPanel';
  panel.setAttribute('role', 'tabpanel');
  const media = element('div', 'ref-lesson-media');
  function lessonArrow(direction, name) {
    const button = element('button', 'ref-lesson-arrow ref-lesson-arrow-' + direction);
    button.type = 'button';
    button.setAttribute('aria-label', name);
    button.setAttribute('aria-controls', panel.id);
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m10 5.5 5.4 6.5-5.4 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return button;
  }
  const previous = lessonArrow('previous', text('이전 설명', 'Previous explanation'));
  const next = lessonArrow('next', text('다음 설명', 'Next explanation'));
  const figure = element('div', 'ref-lesson-figure');
  const sample = element('img', 'ref-lesson-sample');
  sample.width = 840;
  sample.height = 420;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const touchDemoLayout = matchMedia('(hover: none) and (pointer: coarse) and (max-width: 1700px), (max-width: 599px)');
  const touchRecorded = new Set(['shape', 'trim', 'thick']);
  const mediaToggle = element('button', 'ref-lesson-media-toggle');
  mediaToggle.type = 'button';
  const caption = element('p', 'ref-lesson-instruction');
  caption.setAttribute('aria-live', 'polite');
  figure.append(sample, mediaToggle);
  media.append(previous, figure);
  const foot = element('div', 'ref-lesson-actions');
  next.className = 'ghost ref-lesson-next';
  next.removeAttribute('aria-label');
  next.textContent = text('다음', 'Next');
  panel.append(media, caption);
  const practice = element('button', 'primary ref-practice', text('직접 해보기 →', 'Try it →'));
  practice.type = 'button';
  const close = element('button', 'textBtn ref-skip-lesson', text('닫기', 'Close'));
  close.type = 'button';
  close.onclick = () => dialog.close();
  const skip = element('button', 'textBtn ref-skip-lesson', text('튜토리얼 건너뛰기', 'Skip tutorial'));
  skip.type = 'button';
  foot.append(practice, next);
  dialog.append(title, tabs, panel, foot, skip, close);
  document.body.append(dialog);
  let currentStage;
  let selected = 0;
  let playing = !reducedMotion.matches;
  const shown = new Set();

  function showSample(name) {
    const touchClip = touchRecorded.has(name) && touchDemoLayout.matches;
    dialog.toggleAttribute('data-touch-clip', touchClip);
    const nameOnDisk = touchClip ? name + '-touch' : name;
    const version = name === 'thick' ? '?v=outward-wall' : name === 'controls' ? '?v=2' : '';
    sample.src = asset + nameOnDisk + (playing ? '-demo' : '-still') + '.webp' + version;
    mediaToggle.textContent = playing ? 'Ⅱ' : '▶';
    mediaToggle.setAttribute('aria-label', playing ? text('시연 일시정지', 'Pause demonstration') : text('시연 재생', 'Play demonstration'));
  }
  mediaToggle.onclick = () => {
    playing = !playing;
    showSample(courses[currentStage][1][selected][0]);
  };
  function select(index, focus = false) {
    selected = index;
    const [name, tool, instruction] = courses[currentStage][1][index];
    dialog.dataset.lesson = name;
    const buttons = [...tabs.children];
    buttons.forEach((button, position) => {
      button.tabIndex = position === index ? 0 : -1;
      button.setAttribute('aria-selected', String(position === index));
    });
    previous.setAttribute('aria-disabled', String(index === 0));
    next.setAttribute('aria-disabled', String(index === buttons.length - 1));
    panel.setAttribute('aria-labelledby', buttons[index].id);
    showSample(name);
    sample.alt = text(tool + ' 실습 화면', tool + ' practice view');
    caption.textContent = instruction;
    if (focus) buttons[index].focus();
  }
  previous.onclick = () => { if (selected > 0) select(selected - 1); };
  next.onclick = () => {
    if (selected + 1 >= tabs.children.length) return;
    select(selected + 1);
    if (next.getAttribute('aria-disabled') === 'true') (practice.hidden ? close : practice).focus();
  };
  reducedMotion.addEventListener('change', () => {
    playing = !reducedMotion.matches;
    if (dialog.open && courses[currentStage]) select(selected);
  });
  touchDemoLayout.addEventListener('change', () => {
    if (dialog.open && courses[currentStage]) select(selected);
  });
  tabs.addEventListener('keydown', (event) => {
    const length = tabs.children.length;
    const choices = { ArrowRight: (selected + 1) % length, ArrowLeft: (selected + length - 1) % length,
      Home: 0, End: length - 1 };
    if (!Object.hasOwn(choices, event.key)) return;
    event.preventDefault();
    select(choices[event.key], true);
  });
  practice.onclick = () => dialog.close();
  skip.onclick = () => {
    dialog.close();
    id('tutorialSkip').click();
  };
  dialog.addEventListener('close', () => window.TodakTutorialPresentation?.refresh());
  window.addEventListener('todak-tutorial-reset', () => shown.clear());

  function open(stage, initialTab = 0, help = false) {
    if ((!courses[stage] && stage !== 'done') || document.querySelector('dialog[open]')) return false;
    currentStage = stage;
    practice.hidden = help;
    skip.hidden = help;
    close.hidden = !help;
    tabs.hidden = media.hidden = foot.hidden = stage === 'done';
    if (stage === 'done') {
      title.textContent = text('완성작 살펴보기', 'View your finished piece');
      panel.removeAttribute('aria-labelledby');
      caption.textContent = text('상단에서 배경을 바꾸거나 360°로 감상해요.\n카드로 저장·공유를 누르면 작품을 이미지로 저장할 수 있어요.',
        'Use the top bar to change the background or view your piece in 360°. Open the work card to save an image.');
      dialog.showModal();
      close.focus({ preventScroll: true });
      return true;
    }
    const [heading, steps] = courses[stage];
    foot.hidden = false;
    title.textContent = heading;
    tabs.setAttribute('aria-label', heading);
    tabs.replaceChildren(...steps.map((entry, index) => {
      const button = element('button', 'ref-lesson-tab');
      button.type = 'button';
      button.id = 'refLessonTab' + (index + 1);
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', panel.id);
      button.textContent = entry[1];
      button.onclick = () => select(index);
      return button;
    }));
    select(initialTab);
    dialog.showModal();
    (help ? close : practice).focus({ preventScroll: true });
    return true;
  }

  function sync(stage) {
    if (!courses[stage] || shown.has(stage) || !id('home').hidden) return;
    const state = window.TodakTutorialLesson?.state();
    if (!window.TodakTutorial?.state().active || state?.stage !== stage || state.done) return;
    if (open(stage)) {
      shown.add(stage);
      if (stage === 'glaze' && state.exercise === 'baseColor' &&
          id('rackGlazeBase').getAttribute('aria-pressed') !== 'true') id('rackGlazeBase').click();
    }
  }

  const coach = id('tutorialCoach');
  const strip = element('div', 'ref-coach-header');
  const tool = element('strong', 'ref-coach-tool');
  const counter = element('span', 'ref-coach-counter');
  strip.append(tool, counter);
  coach.prepend(strip);
  const compactTitle = element('span', 'ref-coach-compact-title');
  compactTitle.setAttribute('aria-hidden', 'true');
  strip.after(compactTitle);
  const footer = element('div', 'ref-coach-footer');
  const dots = element('div', 'ref-coach-dots');
  dots.setAttribute('aria-hidden', 'true');
  const coachSkip = id('tutorialSkip');
  coachSkip.dataset.shortLabel = text('건너뛰기', 'Skip');
  footer.append(dots, coachSkip);
  coach.append(footer);
  const fireButtons = [id('ui-fire-start'), id('openKiln')];
  const fireSlots = fireButtons.map((button) => {
    const slot = document.createComment('firing control');
    button.before(slot);
    return slot;
  });
  function syncFire(stage) {
    const coached = stage === 'fire' && window.TodakTutorial?.state().active && id('home').hidden;
    const inline = stage === 'fire' && !coached &&
      (!!document.body.dataset.refWorkspace || document.body.dataset.refForm === 'notebook');
    document.body.classList.toggle('ref-coached-fire', coached);
    document.body.classList.toggle('ref-inline-fire', inline);
    fireButtons.forEach((button, index) => {
      const host = coached || (inline && index === 0) ? id('stage') : null;
      if (host && button.parentElement !== host) host.append(button);
      else if (!host && button.previousSibling !== fireSlots[index]) fireSlots[index].after(button);
    });
  }
  new MutationObserver(() => syncFire(document.body.dataset.uiStage)).observe(coach, {
    attributes: true, attributeFilter: ['hidden'],
  });
  const stageNames = {
    throw: text('빚기', 'Shaping'), deco: text('꾸미기', 'Decorating'), glaze: text('유약', 'Glazing'),
    fire: text('굽기', 'Firing'), done: text('완성', 'Finish'),
  };
  const shortTasks = new Set(['baseColor', 'finish', 'effect', 'dip', 'brushColor',
    'rotate', 'topView', 'bottomView', 'sideView', 'dipColor']);
  const actions = {
    shape: ['옆면을 좌우로 끌어 보세요', 'Drag the side left or right'],
    height: ['↕ 손잡이를 위아래로 끌어요', 'Drag the ↕ handle up or down'],
    trimWidth: ['날 두께를 정해요', 'Set the blade width'],
    trimStrength: ['깎는 강도를 정해요', 'Set the trimming strength'],
    trim: ['옆면을 안쪽으로 밀어 보세요', 'Push the side inward'],
    depth: ['속 깊이를 조절해요', 'Adjust the depth'],
    inside: ['안쪽 벽을 좌우로 끌어 보세요', 'Drag the inner wall sideways'],
    smoothOuter: ['바깥벽을 문질러 보세요', 'Rub the outer wall'],
    smoothInner: ['안쪽 벽을 문질러 보세요', 'Rub the inner wall'],
    brushSize: ['붓 굵기를 정해요', 'Set the brush width'],
    brush: ['작품 위를 끌어 그려 보세요', 'Drag across the piece to paint'],
    stampChoice: ['도장 모양을 골라요', 'Choose a stamp'],
    stamp: ['작품을 눌러 도장을 찍어요', 'Tap the piece to stamp it'],
    incised: ['파내기로 선을 그어 보세요', 'Carve a recessed line'],
    raised: ['돋우기로 선을 그어 보세요', 'Carve a raised line'],
    erase: ['그린 무늬를 문질러 지워요', 'Rub to erase a mark'],
    rotate: ['오른쪽 버튼으로 돌려 보세요', 'Tap the right arrow to turn'],
    topView: ['위를 눌러 위에서 살펴봐요', 'Tap Top to look inside'],
    bottomView: ['밑바닥을 눌러 뒤집어 봐요', 'Tap Bottom to look underneath'],
    sideView: ['옆을 눌러 옆면으로 돌아가요', 'Tap Side to return'],
    baseColor: ['전체에 입힐 색을 골라요', 'Choose a base glaze color'],
    finish: ['유광·무광을 골라요', 'Choose gloss or matte'],
    dip: ['덧입힐 담그기 방향을 골라요', 'Choose a dipping direction'],
    dipColor: ['덧입힐 색을 골라요', 'Choose a dip color'],
    dipDepth: ['담그는 깊이를 조절해요', 'Adjust the dipping depth'],
    dipAngle: ['담그는 기울기를 조절해요', 'Adjust the dipping angle'],
    effect: ['표면 무늬를 골라요', 'Choose a surface pattern'],
    brushColor: ['붓으로 칠할 색을 골라요', 'Choose a brush glaze color'],
    glazeOpacity: ['붓 유약 불투명도를 정해요', 'Set the glaze opacity'],
    glazeSize: ['유약 붓 굵기를 정해요', 'Set the glaze brush width'],
    glazePaint: ['작품 위를 끌어 유약을 칠해요', 'Drag to apply the glaze'],
    photoSize: ['− 또는 ＋로 크기를 바꿔요', 'Use − or + to resize'],
    photoMove: ['작품을 끌어 위치를 바꿔요', 'Drag to move the piece'],
    background: ['완성 사진 배경을 골라요', 'Choose a photo background'],
    orbit: ['360° 감상으로 돌려 봐요', 'Turn the piece in 360° view'],
    photoReturn: ['완성 사진으로 돌아와요', 'Return to the finished photo'],
    photo: ['작품 카드를 열어 봐요', 'Open the work card'],
    searchOpen: ['뭘 닮았을까?를 열어 봐요', 'Open Find similar objects'],
  };
  let lastProgress;
  function styleCoach(stage, lesson, done) {
    const step = lesson?.exercise;
    const number = lesson?.exerciseNumber || 1;
    const total = lesson?.exerciseTotal + 1 || 0;
    const group = courses[stage]?.[1];
    let index = 0;
    if (stage === 'throw') index = number >= 8 ? 4 : number >= 6 ? 3 : number >= 3 ? 2 : 1;
    if (stage === 'deco') index = number === 7 ? 3 : number >= 5 && number <= 6 ? 1 : number >= 3 && number <= 4 ? 2 : 0;
    if (stage === 'glaze') index = number >= 8 ? 1 : 0;
    tool.textContent = done || stage === 'deco' && number >= 8 ? stageNames[stage] : group?.[index]?.[1] || stageNames[stage];
    const current = done ? total : number;
    counter.textContent = total > 1 ? current + ' / ' + total : '';
    const actionCopy = actions[step || lesson?.key];
    const compact = done ? text('준비되면 다음 단계로 가요', 'Continue when you are ready')
      : actionCopy ? text(...actionCopy) : id('tutorialTitle').textContent;
    if (compactTitle.textContent !== compact) compactTitle.textContent = compact;
    coach.classList.toggle('ref-coach-short', shortTasks.has(step));
    coach.classList.toggle('ref-coach-next', done && ['throw', 'deco', 'glaze'].includes(stage));
    const progress = current + '/' + total;
    if (lastProgress === progress) return;
    lastProgress = progress;
    dots.replaceChildren(...Array.from({ length: Math.max(0, total > 1 ? total : 0) }, (_, position) =>
      element('span', position + 1 === current ? 'is-current' : '')));
  }
  window.TodakReferenceLesson = {
    sync(stage) { syncFire(stage); sync(stage); },
    help(stage, tool) {
      const index = courses[stage]?.[1].findIndex(([name]) => name === tool) ?? -1;
      return open(stage, Math.max(0, index), true);
    },
    coach: styleCoach,
  };
  window.TodakResponsive.refresh();
})();
