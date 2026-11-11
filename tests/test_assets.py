import importlib.util
import re
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('assets', ROOT / 'tools' / 'refresh_assets.py')
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)

class CacheTests(unittest.TestCase):
    def test_same_name_replacement_changes_static_og_url(self):
        with tempfile.TemporaryDirectory() as name:
            path = Path(name)
            for file in ['index.html', 'manifest.webmanifest', 'og.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'config.js', 'pottery-renderer.js']:
                shutil.copy(ROOT / file, path / file)
            old_root = assets.ROOT
            assets.ROOT = path
            try:
                assets.refresh(False)
                before = (path / 'index.html').read_text()
                assets.refresh(False)
                self.assertEqual(before, (path / 'index.html').read_text())
                with (path / 'og.png').open('ab') as f:
                    f.write(b'updated-image-content')
                assets.refresh(False)
                after = (path / 'index.html').read_text()
                def og(text):
                    return re.search(r'property="og:image" content="([^"]+)"', text)[1]
                self.assertNotEqual(og(before), og(after))
                self.assertIn('og.png?v=', og(after))
                self.assertIn(og(after), after.split('name="twitter:image"')[1])
            finally:
                assets.ROOT = old_root

if __name__ == '__main__':
    unittest.main()
