from pathlib import Path
import re,shutil
ROOT=Path(__file__).resolve().parent
source=ROOT/'index.html'
s=source.read_text()
# Rebuild only the local extension block; the original pottery mechanics remain intact.
a=s.index('/* Private local prototype:');b=s.index('\nif(hot&&hot.ready){hot.ready(start);}',a)
community=(ROOT/'community.js').read_text();marker=' window.TodakCommunity='
addons='\n'.join((ROOT/name).read_text() for name in ['market.js','display-assets.js','shop.js','shelf-display.js','shelf-break.js','real-photo.js','wheel-freedom.js','home-layout.js','tutorial.js','trimming.js'])
community=community.replace(marker,'\n'+addons+'\n'+marker)
s=s[:a]+community+s[b:]
for name in ['market.css','shop.css','brand.css','tutorial.css','shelf-display.css','wheel-freedom.css','shelf-break.css','home-layout.css','trimming.css']:
 if not re.search(r'href="'+re.escape(name)+r'(?:\?[^"]*)?"',s):s=s.replace('</head>','<link rel="stylesheet" href="'+name+'">\n</head>')
# Refresh the community templates without changing the studio DOM.
a=s.index('<dialog class="community" id="communityDlg"');b=s.index('<dialog id="marketDlg"',a) if '<dialog id="marketDlg"' in s else s.index('</main>',a)
s=s[:a]+(ROOT/'community.html').read_text()+'\n'+s[b:]
# Additional dialogs are code-native UI; they are not image stand-ins.
if '<dialog id="marketDlg"' in s:
 a=s.index('<dialog id="marketDlg"');b=s.index('</main>',a);s=s[:a]+s[b:]
s=s.replace('</main>','\n'.join((ROOT/name).read_text() for name in ['market.html','shop.html','real-photo.html'])+'\n</main>')
s=re.sub(r'(<link rel="stylesheet" href="[^"]+"[^>]*>)(?:\n(?=))?',lambda m:m[0],s)
seen=set()
def unique_style(m):
 key=m[1].split('?')[0]
 if key in seen:return ''
 seen.add(key);return m[0]
s=re.sub(r'<link rel="stylesheet" href="([^"]+)"[^>]*>',unique_style,s)
source.write_text(s)
(ROOT/'dist').mkdir(exist_ok=True)
for p in ROOT.iterdir():
 if p.name in ['dist','.openai','tests','render-cache','quality-samples','models','__pycache__'] or p.suffix in ['.py','.blend']:continue
 if p.is_dir():shutil.copytree(p,ROOT/'dist'/p.name,dirs_exist_ok=True)
 else:shutil.copy2(p,ROOT/'dist'/p.name)
if (ROOT/'quality-samples').exists():
 out=ROOT/'dist/quality-samples';out.mkdir(exist_ok=True)
 for p in (ROOT/'quality-samples').glob('*.png'):shutil.copy2(p,out/p.name)
