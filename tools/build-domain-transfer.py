"""Build a standalone bridge to publish at sosohanlab.github.io/todak-transfer/."""
from pathlib import Path
root = Path(__file__).resolve().parents[1] / 'migration'
(root / 'index.html').write_text(
    (root / 'bridge-body.html').read_text().replace(
        '<!-- TRANSFER_CORE -->', '<script>\n' + (root / 'transfer-core.js').read_text() + '\n</script>'
    )
)
