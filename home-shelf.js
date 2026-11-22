(() => {
  const home = document.getElementById('home');
  const scene = home.querySelector('.renewal-home-scene img');
  const menu = home.querySelector('.homeMenus');
  const homeBox = home.querySelector('.homeBox');
  const gallery = document.getElementById('goShelf');
  const worksAPI = window.TodakHomeWorks;
  const english = window.TODAK_LANG === 'en';
  const label = (ko, en) => english ? en : ko;
  const settingsKey = 'todak.home-shelf.slots.v1';
  const desktopKey = 'todak.home-shelf.desktop-slots.v1';
  const wheelKey = 'todak.home-wheel.work.v1';
  const desktop = matchMedia('(pointer: fine) and (min-width: 1600px), (pointer: fine) and (min-width: 1101px) and (min-height: 1001px)');
  // Positions are counted from the lowest rail. The top-left planter has no slot.
  const desktopPositions = Array.from({ length: 18 }, (_, index) => index).filter(index => index !== 12);
  const legacyDesktopSlots = [0, 2, 3, 5, 6, 8, 9, 11, 12, 13, 14, 16];
  const compactPlanter = 8;
  // Shelf edges, rail heights, and the wheel center in each photograph.
  const shelfGeometry = {
    'home-wheel-desktop.webp': [0.523, 0.956, [0.217, 0.321, 0.427], [.748, .700, .208]],
    'home-wheel-tablet.webp': [0.367, 0.913, [0.281, 0.384, 0.475], [.583, .737, .278]],
    'home-wheel-mobile.webp': [0.294, 0.936, [0.499, 0.581, 0.666], [.584, .819, .429]],
  };

  function readSlots(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      if (Array.isArray(value)) return value;
    } catch {}
    return null;
  }

  let wide = desktop.matches;
  function loadSlots() {
    const saved = readSlots(wide ? desktopKey : settingsKey);
    const size = wide ? desktopPositions.length : 12;
    const layout = Array.from({ length: size }, (_, index) =>
      typeof saved?.[index] === 'string' ? saved[index] : null
    );
    if (wide && !saved) {
      readSlots(settingsKey)?.slice(0, legacyDesktopSlots.length).forEach((id, index) => {
        if (typeof id === 'string') layout[legacyDesktopSlots[index]] = id;
      });
    }
    return layout;
  }
  let slots = loadSlots();
  function saveSlots() {
    try {
      const key = wide ? desktopKey : settingsKey;
      const value = JSON.stringify(slots);
      if (localStorage.getItem(key) !== value) localStorage.setItem(key, value);
    } catch {}
  }
  let works = new Map();
  let moving = false;
  let selected = -1;
  let frame = 0;
  const pictures = new Map();

  const shelf = document.createElement('div');
  shelf.className = 'home-work-shelf';
  shelf.setAttribute('role', 'group');
  shelf.setAttribute('aria-label', label('홈 선반의 작품', 'Works on your home shelf'));
  home.prepend(shelf);
  const empty = document.createElement('div');
  empty.className = 'home-shelf-empty';
  empty.hidden = true;
  const emptyText = document.createElement('span');
  emptyText.textContent = label('첫 작품이 여기 놓여요', 'Your first work goes here');
  empty.append(emptyText);
  const wheel = document.createElement('div');
  wheel.className = 'home-showcase-wheel';
  wheel.hidden = true;
  const turn = document.createElement('button');
  turn.className = 'home-showcase-turn';
  turn.type = 'button';
  turn.disabled = true;
  turn.hidden = true;
  turn.setAttribute('aria-label', label('첫 작품 돌리기', 'Rotate your first work'));
  const wheelPhoto = document.createElement('img');
  wheelPhoto.alt = '';
  wheelPhoto.draggable = false;
  const wheelCanvas = document.createElement('canvas');
  wheelCanvas.width = wheelCanvas.height = 256;
  wheelCanvas.hidden = true;
  const wheelContext = wheelCanvas.getContext('2d');
  turn.append(wheelPhoto, wheelCanvas);
  wheel.append(empty, turn);
  shelf.after(wheel);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const overlays = [document.getElementById('drawer'), document.getElementById('chSel')];
  let preferredWork;
  try { preferredWork = localStorage.getItem(wheelKey); } catch {}
  let wheelId = null;
  let wheelRequest = 0;
  let wheelModel;
  let rotation = 0;
  let rotationTimer = 0;
  let manualFrame = 0;
  let lastPaint = 0;
  let manualUntil = 0;
  let spin = 0;
  let drag;
  let paintCost = 0;

  function wheelVisible() {
    return !home.hidden && !wheel.hidden && !document.hidden &&
      !overlays.some((overlay) => !overlay.hidden) && !document.querySelector('dialog[open]');
  }

  function paintWheel() {
    const start = performance.now();
    const result = window.TodakPhoto?.renderWheel({
      ...wheelModel, rotation, transparent: true, elevation: .32, objectScale: 1.3, fastPreview: true, lighting: 'workshop'
    }, wheelCanvas.width);
    if (!result || !wheelContext) return false;
    const size = wheelCanvas.width;
    wheelContext.clearRect(0, 0, size, size);
    wheelContext.drawImage(result, 0, 0, size, size);
    if (wheelCanvas.hidden) {
      const pixels = wheelContext.getImageData(0, 0, size, size).data;
      let end = size * size - 1;
      while (end >= 0 && pixels[end * 4 + 3] < 96) end--;
      turn.style.setProperty('--home-wheel-base', Math.max(0, size - 1 - Math.floor(end / size)) / size);
      wheelCanvas.hidden = false;
      wheelPhoto.hidden = true;
    }
    paintCost = paintCost * .75 + (performance.now() - start) * .25;
    return true;
  }

  function canRotate() {
    return wheelVisible() && wheelModel && !moving && !drag && !reducedMotion.matches;
  }

  function scheduleTurn() {
    if (rotationTimer || !canRotate()) return;
    const interval = spin ? Math.max(32, Math.min(70, paintCost * 1.6)) : 125;
    rotationTimer = setTimeout(() => {
      rotationTimer = 0;
      if (!canRotate()) { spin = 0; return; }
      const now = performance.now();
      const elapsed = Math.min(interval * 2, now - lastPaint);
      rotation = (rotation + (spin || .25) * elapsed / 1000) % (2 * Math.PI);
      lastPaint = now;
      spin *= Math.exp(-elapsed / 295);
      if (Math.abs(spin) < .45) spin = 0;
      if (paintWheel()) scheduleTurn();
    }, spin ? interval : Math.max(interval, manualUntil - performance.now()));
  }

  function coast(velocity) {
    if (reducedMotion.matches) return;
    spin = Math.max(-18, Math.min(18, velocity));
    lastPaint = performance.now();
    clearTimeout(rotationTimer);
    rotationTimer = 0;
    scheduleTurn();
  }

  function turnBy(angle) {
    if (!angle || moving || !wheelModel) return;
    rotation = (rotation + angle) % (2 * Math.PI);
    manualUntil = performance.now() + 1600;
    clearTimeout(rotationTimer);
    rotationTimer = 0;
    if (!manualFrame) manualFrame = requestAnimationFrame(() => {
      manualFrame = 0;
      if (wheelVisible() && !moving) paintWheel();
      scheduleTurn();
    });
  }

  function refreshWheel(items) {
    // The gallery lists newer works first, so the last work is the earliest saved one.
    const first = items.find((work) => work.id === preferredWork) || items.at(-1);
    if (home.hidden || wheelId === first?.id) return;
    const request = ++wheelRequest;
    wheelId = first?.id;
    wheelModel = undefined;
    rotation = 0;
    spin = 0;
    drag = undefined;
    turn.hidden = !first;
    turn.disabled = true;
    wheelCanvas.hidden = true;
    wheelPhoto.hidden = true;
    wheelPhoto.removeAttribute('src');
    empty.hidden = !!first;
    if (!first) return;

    const showPhoto = (url) => {
      if (url && request === wheelRequest && wheelCanvas.hidden) {
        wheelPhoto.src = url;
        wheelPhoto.hidden = false;
      }
    };
    if (first.thumb) showPhoto(first.thumb);
    else worksAPI.image(first.id).then(showPhoto).catch(() => {});

    Promise.all([worksAPI.model(first.id), window.TodakLoad3D?.()]).then(async ([model]) => {
      if (request !== wheelRequest || !window.TodakPhoto?.available) return;
      await window.TodakPhoto.ready?.(model);
      if (request !== wheelRequest) return;
      wheelModel = model;
      rotation = model.rotation || 0;
      scheduleLayout();
    }).catch(() => {});
  }

  turn.addEventListener('pointerdown', (event) => {
    if (moving || turn.disabled || !event.isPrimary || event.button !== 0) return;
    spin = 0;
    drag = { id: event.pointerId, x: event.clientX, time: event.timeStamp, velocity: 0 };
    turn.setPointerCapture(event.pointerId);
  });
  turn.addEventListener('pointermove', (event) => {
    if (event.pointerId !== drag?.id) return;
    const angle = (event.clientX - drag.x) * .017;
    const elapsed = Math.max(12, event.timeStamp - drag.time);
    drag.velocity = angle / elapsed * 1000;
    turnBy(angle);
    drag.x = event.clientX;
    drag.time = event.timeStamp;
  });
  turn.addEventListener('pointerup', (event) => {
    if (event.pointerId !== drag?.id) return;
    const velocity = event.timeStamp - drag.time < 95 ? drag.velocity : 0;
    drag = undefined;
    if (Math.abs(velocity) > .7) coast(velocity);
    else scheduleTurn();
  });
  turn.addEventListener('lostpointercapture', () => { drag = undefined; scheduleTurn(); });
  turn.addEventListener('wheel', (event) => {
    if (moving || turn.disabled) return;
    const delta = event.deltaY || event.deltaX;
    if (!delta) return;
    event.preventDefault();
    const pixels = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 160 : 1);
    turnBy(Math.max(-.95, Math.min(.95, pixels * .004)));
    coast(spin * .55 + pixels * .063);
  }, { passive: false });
  turn.addEventListener('keydown', (event) => {
    if (moving || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    spin = 0;
    turnBy(event.key === 'ArrowLeft' ? -.18 : .18);
  });
  reducedMotion.addEventListener('change', scheduleTurn);
  document.addEventListener('visibilitychange', scheduleLayout);
  function placeOnWheel(index) {
    const id = slots[index];
    if (!moving || !id || !works.has(id)) return;
    preferredWork = id;
    try { localStorage.setItem(wheelKey, id); } catch {}
    selected = -1;
    refreshWheel([...works.values()]);
    render();
    status.textContent = label('물레 위 작품을 바꿨어요.', 'The work on the wheel was changed.');
    move.focus({ preventScroll: true });
  }
  turn.addEventListener('click', () => { if (selected !== -1) placeOnWheel(selected); });
  turn.addEventListener('dragover', (event) => { if (moving && selected !== -1) event.preventDefault(); });
  turn.addEventListener('drop', (event) => {
    if (event.dataTransfer.getData('text/plain') !== slots[selected]) return;
    event.preventDefault();
    placeOnWheel(selected);
  });
  const move = document.createElement('button');
  move.type = 'button';
  move.className = 'home-shelf-move';
  move.textContent = label('자리 바꾸기', 'Rearrange');
  move.setAttribute('aria-pressed', 'false');
  shelf.append(move);
  const status = document.createElement('span');
  status.className = 'home-shelf-status';
  status.setAttribute('role', 'status');
  shelf.append(status);

  const cells = Array.from({ length: desktopPositions.length }, (_, index) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'home-shelf-slot';
    const image = document.createElement('img');
    image.alt = '';
    image.draggable = false;
    const placeholder = document.createElement('span');
    placeholder.className = 'home-work-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    cell.append(image, placeholder);
    cell.addEventListener('click', () => {
      if (!moving) {
        if (slots[index]) gallery.click();
        return;
      }
      if (selected === -1) {
        if (slots[index]) {
          selected = index;
          status.textContent = label('물레나 선반 자리를 눌러 주세요.', 'Choose the wheel or a place on the shelf.');
          render();
        }
      } else if (selected === index) {
        selected = -1;
        status.textContent = label('옮길 작품을 고르세요.', 'Choose a work to move.');
        render();
      } else {
        moveWork(selected, index);
      }
    });
    cell.addEventListener('dragstart', (event) => {
      if (!slots[index]) { event.preventDefault(); return; }
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', slots[index]);
      selected = index;
      if (!moving) setMoving(true);
    });
    cell.addEventListener('dragover', (event) => {
      if (selected !== -1) event.preventDefault();
    });
    cell.addEventListener('drop', (event) => {
      if (selected === -1 || event.dataTransfer.getData('text/plain') !== slots[selected]) return;
      event.preventDefault();
      if (selected !== index) moveWork(selected, index);
    });
    cell.addEventListener('dragend', () => {
      selected = -1;
      render();
    });
    shelf.append(cell);
    return { cell, image, placeholder };
  });

  function moveWork(from, to) {
    if (!usable(from) || !usable(to) || !slots[from]) return;
    [slots[from], slots[to]] = [slots[to], slots[from]];
    selected = -1;
    saveSlots();
    render();
    status.textContent = label('작품 자리를 바꿨어요.', 'Work moved.');
  }
  function usable(index) {
    return index >= 0 && index < slots.length && (wide || index !== compactPlanter);
  }

  function setMoving(value) {
    moving = value;
    if (!value) selected = -1;
    move.setAttribute('aria-pressed', String(value));
    move.textContent = value ? label('배치 끝내기', 'Done') : label('자리 바꾸기', 'Rearrange');
    status.textContent = value ? label('작품을 누른 뒤 옮길 자리를 누르세요.', 'Select a work, then choose a place.') : '';
    render();
  }
  move.onclick = (event) => {
    setMoving(!moving);
    if (moving && event.detail === 0) {
      cells.find(({ cell }) => !cell.hidden && cell.classList.contains('has-work') &&
        !cell.classList.contains('is-outside'))?.cell.focus();
    }
  };
  home.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && moving) {
      setMoving(false);
      move.focus();
    }
  });

  let thumbnailFrame = 0;
  function render() {
    move.hidden = !slots.some((id, index) => id && usable(index));
    turn.classList.toggle('is-placement-target', moving && selected !== -1);
    turn.disabled = moving ? selected === -1 : wheelCanvas.hidden;
    turn.setAttribute('aria-label', moving
      ? label('선택한 작품을 물레에 올리기', 'Put the selected work on the wheel')
      : label('물레 위 작품 돌리기', 'Rotate the work on the wheel'));
    cells.forEach(({ cell, image, placeholder }, index) => {
      const work = works.get(slots[index]);
      cell.hidden = !usable(index) || (!work && !moving);
      cell.classList.toggle('has-work', !!work);
      cell.classList.toggle('is-selected', selected === index);
      cell.classList.toggle('is-moving', moving);
      cell.draggable = usable(index) && !!work;
      cell.setAttribute('aria-label', work?.name || label('빈 자리 ' + (index + 1), 'Empty slot ' + (index + 1)));
      if (moving) cell.setAttribute('aria-pressed', String(selected === index));
      else cell.removeAttribute('aria-pressed');
      const url = work?.thumb || pictures.get(work?.id);
      if (url && image.getAttribute('src') !== url) image.src = url;
      if (!url) image.removeAttribute('src');
      image.hidden = !url;
      placeholder.hidden = !work || !!url;
      if (work && !url && !pictures.has(work.id)) {
        pictures.set(work.id, '');
        worksAPI.image(work.id).then((cutout) => {
          if (works.has(work.id)) {
            pictures.set(work.id, cutout);
            if (!home.hidden && !thumbnailFrame) thumbnailFrame = requestAnimationFrame(() => {
              thumbnailFrame = 0;
              if (!home.hidden) render();
            });
          }
        }).catch(() => {});
      }
    });
    scheduleTurn();
  }

  function refresh() {
    if (home.hidden) return;
    const items = worksAPI.list();
    refreshWheel(items);
    works = new Map(items.map((item) => [item.id, item]));
    [...pictures.keys()].forEach((id) => { if (!works.has(id)) pictures.delete(id); });
    const shown = new Set();
    slots.forEach((id, index) => {
      if (!works.has(id) || shown.has(id)) slots[index] = null;
      else shown.add(id);
    });
    const free = (_, index) => usable(index) && slots[index] === null;
    if (!wide && slots[compactPlanter]) {
      const replacement = slots.findIndex(free);
      if (replacement >= 0) {
        slots[replacement] = slots[compactPlanter];
        slots[compactPlanter] = null;
      }
    }
    for (const work of [...items].reverse()) {
      const place = slots.findIndex(free);
      if (place < 0) break;
      if (!shown.has(work.id)) {
        slots[place] = work.id;
        shown.add(work.id);
      }
    }
    if (!items.length && moving) setMoving(false);
    saveSlots();
    render();
    scheduleLayout();
  }

  function scheduleLayout() {
    if (!frame) frame = requestAnimationFrame(layout);
  }
  function layout() {
    frame = 0;
    if (home.hidden) return;
    const box = scene.getBoundingClientRect();
    const width = scene.naturalWidth;
    const height = scene.naturalHeight;
    const asset = new URL(scene.currentSrc || scene.src).pathname.split('/').pop();
    const geometry = shelfGeometry[asset];
    if (!geometry || !width || !height || !box.width || !box.height) return;
    const scale = Math.max(box.width / width, box.height / height);
    const position = getComputedStyle(scene).objectPosition.split(' ').map((value) => parseFloat(value) / 100);
    const x = box.left + (box.width - width * scale) * position[0];
    const y = box.top + (box.height - height * scale) * position[1];
    const [start, end, rails, [wheelX, wheelY, wheelWidth]] = geometry;
    const center = x + wheelX * width * scale;
    const base = y + wheelY * height * scale;
    const size = Math.min(wheelWidth * width * scale * .92, innerWidth * .70, 425);
    wheel.style.left = center + 'px';
    wheel.style.top = base + 'px';
    wheel.style.setProperty('--home-wheel-size', size + 'px');
    wheel.hidden = center < 0 || center > innerWidth || base < 0 || base > innerHeight;
    if (wheelVisible() && wheelModel && wheelCanvas.hidden && paintWheel() && !moving) turn.disabled = false;
    scheduleTurn();
    const left = Math.max(8, x + width * scale * start);
    const right = Math.min(innerWidth - 8, x + width * scale * end);
    shelf.hidden = right - left < 80;
    const columns = wide ? 6 : 4;
    const slotWidth = Math.max(20, (right - left) / columns);
    const shelfDepth = height * scale * Math.min(rails[1] - rails[0], rails[2] - rails[1]);
    const mobile = asset === 'home-wheel-mobile.webp';
    const slotHeight = mobile
      ? Math.min(slotWidth * .96, shelfDepth * .86)
      : Math.min(slotWidth * .77, shelfDepth * .71);
    if (mobile) {
      const gap = parseFloat(getComputedStyle(homeBox).rowGap);
      const topSlot = y + rails[0] * height * scale - slotHeight;
      const available = topSlot - (menu.getBoundingClientRect().bottom + home.scrollTop - gap) - 8;
      const limit = Math.max(8, Math.floor(available)) + 'px';
      if (homeBox.style.getPropertyValue('--home-menu-gap-limit') !== limit) {
        homeBox.style.setProperty('--home-menu-gap-limit', limit);
      }
    }
    const lowestRail = y + rails.at(-1) * height * scale;
    const buttonTop = Math.max(112, Math.min(innerHeight - 46, lowestRail + Math.max(8, shelfDepth * .16)));
    shelf.style.setProperty('--shelf-controls-right', Math.max(8, innerWidth - right) + 'px');
    shelf.style.setProperty('--shelf-controls-top', buttonTop + 'px');
    cells.forEach(({ cell }, index) => {
      if (index >= slots.length) return;
      const position = wide ? desktopPositions[index] : index;
      const row = rails.length - 1 - Math.floor(position / columns);
      const bottom = y + rails[row] * height * scale;
      cell.style.left = left + position % columns * slotWidth + 'px';
      cell.style.top = bottom - slotHeight + 'px';
      cell.style.width = slotWidth + 'px';
      cell.style.height = slotHeight + 'px';
      cell.classList.toggle('is-outside', bottom - slotHeight < 0 || bottom > innerHeight);
    });
  }
  document.addEventListener('todak-home-works-changed', refresh);
  scene.addEventListener('load', scheduleLayout);
  const menuObserver = new ResizeObserver(scheduleLayout);
  menuObserver.observe(menu);
  menuObserver.observe(home.querySelector('.homeIntro'));
  window.addEventListener('resize', scheduleLayout);
  desktop.addEventListener('change', (event) => {
    wide = event.matches;
    slots = loadSlots();
    setMoving(false);
    refresh();
  });
  new MutationObserver(() => { if (!home.hidden) refresh(); })
    .observe(home, { attributes: true, attributeFilter: ['hidden'] });
  const overlayObserver = new MutationObserver(scheduleLayout);
  [...document.querySelectorAll('dialog'), ...overlays].forEach((overlay) =>
    overlayObserver.observe(overlay, { attributes: true, attributeFilter: ['open', 'hidden'] })
  );
  refresh();
})();
