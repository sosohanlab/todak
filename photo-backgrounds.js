/* User supplied photographic backgrounds. */
(function(){var urls={"studio": "renewal-assets/photo-source-studio.jpg?v=02d370c376d0", "warm": "renewal-assets/photo-source-warm.jpg?v=8d1211e4ebf3", "dark": "renewal-assets/photo-source-dark.jpg?v=2a65c26a4a1c", "wheel": "assets/workshop-shelf-wall.webp"
  };
  // Vertical position of the display surface in each photograph.
  const surfaces = { 'leaf-shadow': .75, 'olive-stone': .72, 'sunny-desk': .71, 'amber-arch': .788, 'linen-light': .758 };
  const premium = Object.keys(surfaces);
  for (const id of premium) urls[id] = 'renewal-assets/photo-' + id + '.webp';
  const images = Object.create(null);
  function imageFor(mode) {
    if (!Object.hasOwn(urls, mode)) return null;
    if (images[mode]) return images[mode];
    const image = new Image();
    images[mode] = image;
    image.addEventListener('load', () => {
      window.dispatchEvent(new CustomEvent('todak-photo-background-ready', { detail: mode }));
    }, { once: true });
    image.src = urls[mode];
    return image;
  }
  const colorKey = 'todak.studio-tint.v1';
  const validColor = value => /^#[0-9a-f]{6}$/i.test(value ?? '');
  const papers = new Map([
    ['paper-studio-gray', '스튜디오 회색', 'Studio gray'],
    ['paper-powder-blue', '파우더 블루', 'Powder blue'],
    ['paper-sky-blue', '하늘색', 'Sky blue'],
    ['paper-espresso', '에스프레소', 'Espresso'],
    ['paper-warm-taupe', '웜 토프', 'Warm taupe'],
    ['paper-lavender', '라벤더', 'Lavender'],
    ['paper-black', '검정', 'Black'],
    ['paper-clay-orange', '흙빛 주황', 'Clay orange'],
    ['paper-sand-beige', '모래 베이지', 'Sand beige'],
    ['paper-soft-apricot', '연한 살구색', 'Soft apricot'],
    ['paper-terracotta', '테라코타', 'Terracotta'],
    ['paper-steel-blue', '스틸 블루', 'Steel blue'],
    ['paper-brick-red', '벽돌 레드', 'Brick red'],
    ['paper-slate-lilac', '슬레이트 라일락', 'Slate lilac'],
    ['paper-deep-teal', '딥 틸', 'Deep teal'],
    ['paper-dark-gray', '짙은 회색', 'Dark gray'],
    ['paper-silver-gray', '실버 그레이', 'Silver gray'],
    ['paper-dark-cocoa', '다크 코코아', 'Dark cocoa'],
    ['paper-blush-pink', '블러시 핑크', 'Blush pink'],
    ['paper-golden-yellow', '골든 옐로', 'Golden yellow'],
    ['paper-gradient-blue-lilac', '블루·라일락', 'Blue to lilac'],
    ['paper-gradient-peach-pink', '피치·핑크', 'Peach to pink'],
    ['paper-gradient-ochre-rose', '오커·로즈', 'Ochre to rose'],
    ['paper-gradient-teal-sky', '틸·하늘색', 'Teal to sky'],
    ['extra-steel-blue', '밝은 스틸 블루', 'Light steel blue'],
    ['extra-mist-blue', '미스트 블루', 'Mist blue'],
    ['extra-lemon-yellow', '레몬 옐로', 'Lemon yellow'],
    ['extra-biscuit-beige', '비스킷 베이지', 'Biscuit beige'],
    ['extra-dusty-mauve', '더스티 모브', 'Dusty mauve'],
    ['extra-orchid-pale', '연한 오키드', 'Pale orchid'],
    ['extra-aqua-blue', '아쿠아 블루', 'Aqua blue'],
    ['extra-blossom-pink', '블로섬 핑크', 'Blossom pink'],
    ['extra-brick-red', '진한 벽돌 레드', 'Deep brick red'],
    ['extra-gradient-steel-orchid', '스틸 블루·오키드', 'Steel blue to orchid'],
    ['extra-gradient-lemon-blush', '레몬·블러시', 'Lemon to blush'],
    ['extra-gradient-aqua-mauve', '아쿠아·모브', 'Aqua to mauve']
  ].map(([id, ko, en]) => [id, { id, ko, en }]));
  const paperUrl = (id, thumb = false) => 'renewal-assets/studio-paper/' + id + (thumb ? '-thumb' : '') + '.webp';
  const isLoaded = image => !!(image && image.complete && image.naturalWidth);
  let studioColor = null;
  try {
    const saved = localStorage.getItem(colorKey);
    if (validColor(saved) || papers.has(saved)) studioColor = saved;
  } catch (_) {}
  let studioTexture;
  let tintFrame;
  let tintColor;
  let tintUrl;

  function paperImage(id) {
    if (!images[id]) {
      const image = new Image();
      images[id] = image;
      image.addEventListener('load', () => {
        if (studioColor === id) window.dispatchEvent(new CustomEvent('todak-photo-background-ready', { detail: 'studio' }));
      }, { once: true });
      image.addEventListener('error', () => {
        if (images[id] === image) delete images[id];
      }, { once: true });
      image.src = paperUrl(id);
    }
    return images[id];
  }

  function studioImage(color) {
    if (papers.has(color)) {
      const paper = paperImage(color);
      return isLoaded(paper) ? paper : imageFor('studio');
    }
    const image = imageFor('studio');
    if (!color || !image.complete || !image.naturalWidth) return image;
    if (tintColor === color) return tintFrame;
    if (!studioTexture) {
      tintFrame = document.createElement('canvas');
      tintFrame.width = image.naturalWidth;
      tintFrame.height = image.naturalHeight;
      const context = tintFrame.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const source = context.getImageData(0, 0, tintFrame.width, tintFrame.height).data;
      studioTexture = new Uint8Array(source.length / 4);
      for (let i = 0; i < studioTexture.length; i++) {
        const p = i * 4;
        studioTexture[i] = Math.round(source[p] * .2126 + source[p + 1] * .7152 + source[p + 2] * .0722);
      }
    }
    const context = tintFrame.getContext('2d');
    const frame = context.createImageData(tintFrame.width, tintFrame.height);
    const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
    // Use the studio's luminance as light and shadow around the chosen base color.
    const shades = Array.from({ length: 256 }, (_, level) => {
      const shade = (level - 218) / 255;
      return rgb.map(channel => channel + shade * (shade < 0 ? Math.max(channel, 65) : Math.max(255 - channel, 85)));
    });
    for (let i = 0; i < studioTexture.length; i++) {
      const [r, g, b] = shades[studioTexture[i]];
      const p = i * 4;
      frame.data[p] = r;
      frame.data[p + 1] = g;
      frame.data[p + 2] = b;
      frame.data[p + 3] = 255;
    }
    context.putImageData(frame, 0, 0);
    tintColor = color;
    tintUrl = null;
    return tintFrame;
  }
  window.TodakBackgrounds = {
    hasSurface(mode) { return Object.hasOwn(surfaces, mode); },
    url(mode) { return Object.hasOwn(urls, mode) ? urls[mode] : ''; },
    studioColor() { return studioColor; },
    studioPapers() {
      return Array.from(papers.values(), paper => ({ ...paper, thumbnail: paperUrl(paper.id, true) }));
    },
    async prepareStudioColor(color) {
      if (papers.has(color)) await paperImage(color).decode();
    },
    setStudioColor(color) {
      if (color !== null && !validColor(color) && !papers.has(color)) return false;
      try {
        if (color === null) localStorage.removeItem(colorKey);
        else localStorage.setItem(colorKey, color);
      } catch (_) {
        return false;
      }
      studioColor = color;
      return true;
    },
    previewUrl(mode) {
      if (mode !== 'studio' || !studioColor) return this.url(mode);
      if (papers.has(studioColor)) return paperUrl(studioColor, true);
      const image = studioImage(studioColor);
      if (image !== tintFrame) return urls.studio;
      if (!tintUrl) {
        const thumb = document.createElement('canvas');
        thumb.width = 420;
        thumb.height = Math.round(420 * tintFrame.height / tintFrame.width);
        thumb.getContext('2d').drawImage(tintFrame, 0, 0, thumb.width, thumb.height);
        tintUrl = thumb.toDataURL('image/webp', .82);
      }
      return tintUrl;
    },
    ready(mode, color = studioColor) {
      return isLoaded(mode === 'studio' && papers.has(color) ? paperImage(color) : imageFor(mode));
    },
    draw(context, width, height, mode, view = {}) {
      const color = Object.hasOwn(view, 'studioColor') ? view.studioColor : studioColor;
      const image = mode === 'studio' ? studioImage(papers.has(color) || validColor(color) ? color : null) : imageFor(mode);
      if (!image || image instanceof HTMLImageElement && (!image.complete || !image.naturalWidth)) return false;
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      if (mode === 'wheel') {
        const wide = innerWidth >= 960;
        const scale = Math.max(width / sourceWidth, height / sourceHeight) * (wide ? 1.24 : 1.07);
        const drawWidth = sourceWidth * scale;
        const drawHeight = sourceHeight * scale;
        const x = Math.max(width - drawWidth, Math.min(0, width * (wide ? .433 : .365) - 555 * scale));
        const y = Math.max(height - drawHeight, Math.min(0, height * (wide ? .083 : innerWidth >= 600 ? .202 : .16) - 175 * scale));
        context.drawImage(image, x, y, drawWidth, drawHeight);
        return true;
      }
      const zoom = Math.max(1, view.zoom || 1);
      const scale = Math.max(width / sourceWidth, height / sourceHeight) * zoom;
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      const x = Math.max(-(drawWidth-width)/2, Math.min((drawWidth-width)/2,(view.panX||0)*width));
      const centerY = (height - drawHeight) / 2;
      const surface = Object.hasOwn(surfaces, mode) ? surfaces[mode] : null;
      const anchorY = surface && view.surfaceY ? height * view.surfaceY - surface * drawHeight : centerY;
      const y = Math.max(height - drawHeight, Math.min(0, anchorY + (view.panY || 0) * height));
      context.drawImage(image, (width-drawWidth)/2+x, y, drawWidth, drawHeight);
      return true;
    },
  };
})();
