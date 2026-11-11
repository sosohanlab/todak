import base64
import importlib.util
import io
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import server

class SearchTests(unittest.TestCase):
    def test_only_image_results_with_sale_evidence(self):
        rows = [
            {'title': '청자 그릇', 'link': 'https://shop.example/bowl', 'thumbnail': 'https://shop.example/1.jpg', 'price': {'value': '₩25,000'}, 'source': '공방'},
            {'title': 'Pinterest collection', 'link': 'https://pinterest.com/pin/1', 'thumbnail': 'https://example.com/2.jpg'},
            {'title': 'unsafe', 'link': 'javascript:alert(1)', 'thumbnail': 'https://example.com/x.jpg', 'price': '1'},
        ]
        matches = server.normalize_matches({'visual_matches': rows + [rows[0]]})
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]['price'], '₩25,000')
        self.assertNotIn('similarity', matches[0])

    def test_empty_does_not_substitute_keyword_results(self):
        self.assertEqual(server.normalize_matches({'visual_matches': []}), [])

    def test_upload_bytes_then_search_by_image_id(self):
        calls = []
        def fake(req):
            calls.append(req)
            return {'image_id': 'actual-upload-id'} if len(calls) == 1 else {'visual_matches': []}
        with patch.object(server, 'provider_json', fake):
            result = server.search_image(b'\xff\xd8\xfftest-image', 'test-key')
        self.assertIn(b'test-image', calls[0].data)
        self.assertIn('image_id=actual-upload-id', calls[1].full_url)
        self.assertNotIn('&q=', calls[1].full_url)
        self.assertEqual(result['method'], 'image')

    def test_missing_key_is_explicit(self):
        h = server.Handler.__new__(server.Handler)
        h.path = '/api/image-search'
        h.headers = {}
        answers = []
        h.reply = lambda status, data: answers.append((status, data))
        with patch.dict(server.os.environ, {}, clear=True):
            h.do_POST()
        self.assertEqual(answers, [(503, {'error': 'search_not_configured'})])

    def test_unsafe_origin_rejected(self):
        h = server.Handler.__new__(server.Handler)
        h.path = '/api/image-search'
        h.headers = {'Origin': 'https://evil.example', 'Host': 'localhost:8765'}
        answers = []
        h.reply = lambda status, data: answers.append(status)
        h.do_POST()
        self.assertEqual(answers, [403])

if __name__ == '__main__':
    unittest.main()
