"""Local/static server + image-based Google Lens search proxy. Python 3.10+.
SERPAPI_API_KEY stays on the server. No images written to disk.
"""
import base64
import hashlib
import json
import os
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from tools.refresh_assets import refresh

ROOT = Path(__file__).resolve().parent
CACHE = {}
RECENT = {}

def safe_url(value):
    if not isinstance(value, str):
        return None
    p = urlparse(value)
    return value if p.scheme == 'https' and p.hostname else None

def normalize_matches(payload):
    """Retain visual matches with sale evidence; never invent scores/prices."""
    results, seen = [], set()
    for item in payload.get('visual_matches', []):
        if not isinstance(item, dict):
            continue
        url, image = safe_url(item.get('link')), safe_url(item.get('thumbnail'))
        # Lens visual matches include editorials/Pinterest. Require price evidence.
        price = item.get('price')
        if not (url and image and item.get('title') and price) or url in seen:
            continue
        if isinstance(price, dict):
            price = price.get('value') or price.get('extracted_value')
        if not price:
            continue
        seen.add(url)
        results.append(dict(url=url, image=image, title=str(item['title'])[:250],
                            source=str(item.get('source', urlparse(url).hostname))[:100],
                            price=str(price)[:80]))
    return results[:8]

def provider_json(req):
    with urlopen(req, timeout=22) as r:
        payload = json.load(r)
    if payload.get('error'):
        raise ValueError('provider_failure')
    return payload

def search_image(image, key):
    boundary = 'TodakImageBoundary'
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="api_key"\r\n\r\n{key}\r\n'
            f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="pottery.jpg"\r\n'
            'Content-Type: image/jpeg\r\n\r\n').encode() + image + f'\r\n--{boundary}--\r\n'.encode()
    upload = provider_json(Request('https://serpapi.com/image', body,
                           {'Content-Type': f'multipart/form-data; boundary={boundary}'}))
    image_id = upload.get('image_id')
    if not image_id:
        raise ValueError('provider_failure')
    query = urlencode(dict(engine='google_lens', type='visual_matches', image_id=image_id,
                           api_key=key, hl='ko', country='kr'))
    payload = provider_json(Request('https://serpapi.com/search.json?' + query))
    return {'matches': normalize_matches(payload), 'method': 'image', 'checked_at': int(time.time())}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def allowed_origin(self):
        origin = self.headers.get('Origin', '')
        allowed = [s.strip() for s in os.environ.get('ALLOWED_ORIGINS', '').split(',') if s.strip()]
        return origin if origin in allowed else None

    def do_OPTIONS(self):
        if not self.allowed_origin():
            return self.reply(403, {'error': 'origin_not_allowed'})
        self.send_response(204)
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def end_headers(self):
        origin = self.allowed_origin()
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        self.send_header('Cache-Control', 'no-cache, max-age=0, must-revalidate')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/health':
            return self.reply(200, {'search_configured': bool(os.environ.get('SERPAPI_API_KEY'))})
        if any(part.startswith('.') for part in path.split('/') if part) or path.endswith(('.py', '.md', '.yml')):
            return self.send_error(404)
        if path in ('/', '/index.html'):
            refresh(verbose=False)
        super().do_GET()

    def reply(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if urlparse(self.path).path != '/api/image-search':
            return self.reply(404, {'error': 'not_found'})
        origin = self.headers.get('Origin')
        if origin and urlparse(origin).netloc != self.headers.get('Host') and not self.allowed_origin():
            return self.reply(403, {'error': 'origin_not_allowed'})
        key = os.environ.get('SERPAPI_API_KEY')
        if not key:
            return self.reply(503, {'error': 'search_not_configured'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 720000:
                return self.reply(413, {'error': 'image_too_large'})
            payload = json.loads(self.rfile.read(length))
            data = payload.get('image', '')
            prefix = 'data:image/jpeg;base64,'
            if not isinstance(data, str) or not data.startswith(prefix):
                return self.reply(400, {'error': 'invalid_image'})
            image = base64.b64decode(data[len(prefix):], validate=True)
            if not 4 < len(image) <= 500000 or not image.startswith(b'\xff\xd8\xff'):
                return self.reply(400, {'error': 'invalid_image'})
            now = time.time()
            digest = hashlib.sha256(image).hexdigest()
            if digest in CACHE and CACHE[digest][0] > now:
                return self.reply(200, CACHE[digest][1])
            address = self.client_address[0]
            if RECENT.get(address, 0) > now - 10:
                return self.reply(429, {'error': 'try_later'})
            RECENT[address] = now
            result = search_image(image, key)
            for stale in list(CACHE):
                if CACHE[stale][0] < now:
                    del CACHE[stale]
            if len(CACHE) >= 64:
                CACHE.pop(next(iter(CACHE)))
            CACHE[digest] = (now + 600, result)
            return self.reply(200, result)
        except (ValueError, TypeError, AttributeError):
            return self.reply(400, {'error': 'invalid_request_or_provider_response'})
        except (HTTPError, URLError, TimeoutError, OSError):
            return self.reply(502, {'error': 'search_unavailable'})

if __name__ == '__main__':
    host = os.environ.get('HOST', '127.0.0.1')
    port = int(os.environ.get('PORT', '8765'))
    print(f'토닥: http://{host}:{port}', flush=True)
    ThreadingHTTPServer((host, port), Handler).serve_forever()
