from pathlib import Path
import base64, re, urllib.parse
root=Path(__file__).parent
html=(root/'index.html').read_text(encoding='utf-8')
css=(root/'styles.css').read_text(encoding='utf-8')
order=['storage.js','countries.js','capitals.js','flag-similarity.js','answer-balance.js','config.js','profile-service.js','leaderboard-service.js','app.js']
parts=[]
for name in order:
    src=(root/name).read_text(encoding='utf-8')
    src=re.sub(r"^import[\s\S]*?from\s+['\"][^'\"]+['\"];\s*",'',src,flags=re.M)
    src=re.sub(r"\bexport\s+async\s+function\b",'async function',src)
    src=re.sub(r"\bexport\s+function\b",'function',src)
    src=re.sub(r"\bexport\s+const\b",'const',src)
    parts.append(f"\n/* {name} */\n{src}\n")
bundle=''.join(parts)
# Inline local sound assets so the standalone file remains genuinely portable.
for filename in ['minecraft-click.mp3', 'minecraft-xp-orb.mp3', 'minecraft-level-up.mp3']:
    audio=(root/'assets'/'sounds'/filename).read_bytes()
    data_uri='data:audio/mpeg;base64,'+base64.b64encode(audio).decode('ascii')
    bundle=bundle.replace(f"'./assets/sounds/{filename}'", repr(data_uri))
# Inline stylesheet and script.
html=re.sub(r'<link rel="stylesheet" href="\.\/styles\.css"\s*/>', lambda _m: f'<style>\n{css}\n</style>', html)
html=re.sub(r'<script type="module" src="\.\/app\.js"></script>', lambda _m: f'<script>\n{bundle}\n</script>', html)
html=re.sub(r'\s*<link rel="manifest" href="\.\/manifest\.webmanifest"\s*/>','',html)
html=html.replace("script-src 'self'", "script-src 'unsafe-inline'")
html=html.replace("connect-src 'self'", "connect-src 'self' data:")
# Inline local image fallbacks so a single file works offline.
for filename in ['favicon.svg', 'diamond-fallback.svg']:
    svg=(root/filename).read_text(encoding='utf-8')
    fallback='data:image/svg+xml;charset=utf-8,'+urllib.parse.quote(svg, safe='')
    html=html.replace(f'data-fallback="./{filename}"', f'data-fallback="{fallback}"')
(root/'flagcraft-standalone.html').write_text(html, encoding='utf-8')
print('built', (root/'flagcraft-standalone.html').stat().st_size)
