"""Stable names + content hashes in HTML/manifest; run before publishing."""
import hashlib
import json
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def version(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]

def refresh(verbose=True):
    manifest_path = ROOT / 'manifest.webmanifest'
    manifest = json.loads(manifest_path.read_text())
    for icon in manifest['icons']:
        name = icon['src'].split('?')[0]
        icon['src'] = name + '?v=' + version(ROOT / name)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    html_path = ROOT / 'index.html'
    html = html_path.read_text()
    # Match only real local files, including absolute canonical OG URLs.
    pattern = r'((?:src|href|content)=["\'])([^"\']+)(["\'])'
    def replace(match):
        value = match[2]
        if value.startswith(('data:', '#')):
            return match[0]
        base = value.split('?')[0]
        relative = base
        if base.startswith('https://sosohanlab.github.io/todak/'):
            relative = base.removeprefix('https://sosohanlab.github.io/todak/')
        elif '://' in base:
            return match[0]
        file = ROOT / relative
        if file.is_file() and file.suffix in ('.png', '.jpg', '.jpeg', '.webp', '.js', '.css', '.webmanifest'):
            return match[1] + base + '?v=' + version(file) + match[3]
        return match[0]
    html = re.sub(pattern, replace, html)
    if '<meta http-equiv="Cache-Control"' not in html:
        html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta http-equiv="Cache-Control" content="no-cache">')
    html_path.write_text(html)
    if verbose:
        print('Updated content hashes for assets, icons and OG image.')

if __name__ == '__main__':
    refresh()
