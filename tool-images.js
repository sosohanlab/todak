/* Transparent tool photographs. Load each tool when its workspace is opened. */
(() => {
  const items = {
    trim: {"url": "assets/tool-trim.webp?v=9890070288f9", "box": [199.5, 35.5, 112.0, 440.0]},
    brush: {"url": "assets/tool-brush.webp?v=88c86e6b15c7", "box": [239.0, 35.5, 34.0, 440.5]},
    carve: {"url": "assets/tool-carve.webp?v=5e16ec007354", "box": [233.0, 36.0, 45.5, 440.0]},
    stamp: {"url": "assets/tool-stamp.webp?v=aa2c8c68a0a0", "box": [144.0, 38.0, 224.5, 435.0]},
    erase: {"url": "assets/tool-erase.webp?v=97c6673ee468", "box": [120.0, 40.5, 271.5, 432.0]},
    glaze: {"url": "assets/tool-glaze.webp?v=0dbef84f2806", "box": [181.0, 35.5, 148.5, 440.5]},
    glazeBrush: {"url": "assets/tool-glazeBrush.webp?v=12bc5f58e29c", "box": [216.5, 36.5, 78.0, 439.5]},
    sponge: {"url": "assets/tool-sponge.webp?v=485a8b2c0f97", "box": [38, 38, 400, 333], "size": [476, 409]}
  };
  const tools = {
    throw: ['trim', 'sponge'],
    deco: ['brush', 'carve', 'stamp', 'erase'],
    glaze: ['glaze', 'glazeBrush'],
  };
  const active = new Set();
  window.TodakToolImages = {
    activate(stage) {
      const keys = tools[stage];
      if (!keys || active.has(stage)) return;
      active.add(stage);
      for (const key of keys) {
        for (const image of document.querySelectorAll('[data-tool-image="' + key + '"]')) {
          image.setAttribute('href', items[key].url);
        }
      }
    },
    markup(key) {
      const item = items[key];
      if (!item) return '';
      const [width, height] = item.size || [512, 512];
      return '<svg class="toolPhoto" viewBox="' + item.box.join(' ') + '" aria-hidden="true">' +
        '<image data-tool-image="' + key + '" width="' + width + '" height="' + height + '"/></svg>';
    },
    draw(context, key, x, y, height, angle) {
      const item = items[key];
      if (!item) return false;
      if (!item.image) {
        item.image = new Image();
        item.image.addEventListener('load', () => document.dispatchEvent(new Event('todak-tool-image-ready')), { once: true });
        item.image.src = item.url;
      }
      if (!item.image.complete || !item.image.naturalWidth) return false;
      const [sx, sy, sw, sh] = item.box;
      const width = height * sw / sh;
      context.save();
      context.translate(x, y);
      context.rotate(angle || 0);
      context.drawImage(item.image, sx, sy, sw, sh, -width / 2, -2, width, height);
      context.restore();
      return true;
    },
  };
})();
