from playwright.sync_api import sync_playwright
from pathlib import Path
import json, sys, os, shutil

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'flagcraft-standalone.html').read_text()
profile_base={
  'level':1,'levelXp':0,'totalXp':0,'theme':'golden','achievements':[],
  'stats':{'games':0,'correct':0,'flagsCorrect':0,'capitalsCorrect':0,'bestCombo':0,'perfectGames':0}
}

def content_for(level=1, theme='golden', lang='tr'):
    profile=dict(profile_base)
    profile['level']=level
    profile['theme']=theme
    initial={
      'flagcraft_username':'whoisyuripa',
      'flagcraft_player_id':'test-player',
      'flagcraft_profile_v1':json.dumps(profile),
      'flagcraft_lang':lang,
      'flagcraft_sound':'false',
      'flagcraft_motion':'true',
    }
    payload=json.dumps(initial)
    mock=f'''<script>
      (() => {{
        const initial = {payload};
        const store = new Map(Object.entries(initial));
        Object.defineProperty(window, 'localStorage', {{ value: {{
          getItem(key) {{ return store.has(String(key)) ? store.get(String(key)) : null; }},
          setItem(key, value) {{ store.set(String(key), String(value)); }},
          removeItem(key) {{ store.delete(String(key)); }},
          clear() {{ store.clear(); }},
          key(index) {{ return [...store.keys()][index] ?? null; }},
          get length() {{ return store.size; }}
        }} }});
      }})();
    </script>'''
    return HTML.replace('<head>', '<head>'+mock, 1)

with sync_playwright() as p:
    browser_path = os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
    launch_args = {'headless': True, 'args': ['--no-sandbox']}
    if browser_path: launch_args['executable_path'] = browser_path
    browser = p.chromium.launch(**launch_args)
    context = browser.new_context(viewport={'width':1440,'height':1000})
    page = context.new_page()
    errors=[]
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    page.on('console', lambda m: errors.append(f'console:{m.type}:{m.text}') if m.type=='error' else None)
    page.route('**/minecraft.wiki/**', lambda route: route.abort())
    page.route('**/myinstants.com/**', lambda route: route.abort())
    page.route('**/flagcdn.com/**', lambda route: route.fulfill(status=200, content_type='image/svg+xml', body='<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" fill="#eee"/></svg>'))
    page.set_content(content_for(level=1), wait_until='load')
    page.wait_for_selector('#homeView.active')

    assert page.locator('#usernameModal').get_attribute('open') is None
    assert page.locator('#difficultyControl [data-difficulty]').count() == 2
    assert 'selected' in page.locator('#difficultyControl [data-difficulty="easy"]').get_attribute('class')
    assert page.locator('#difficultyControl [data-difficulty="medium"]').count() == 0
    page.wait_for_timeout(100)
    assert page.locator('.asset-golden-apple').first.get_attribute('src').startswith('data:image/svg+xml')
    page.wait_for_timeout(100)
    assert page.locator('.asset-diamond').get_attribute('src').startswith('data:image/svg+xml')

    bg = page.locator('.quiz-type-button').first.evaluate("e => getComputedStyle(e).backgroundImage")
    assert 'linear-gradient' in bg and ('10, 11, 9' in bg or '5, 6, 5' in bg), bg

    page.locator('#languageButton').click()
    assert page.locator('#languageLabel').inner_text() == 'English'
    assert page.locator('[data-i18n="chooseChallenge"]').inner_text() == 'Choose your challenge.'
    assert page.locator('[data-i18n="flags"]').first.inner_text() == 'Flags'
    assert page.locator('[data-i18n="hard"]').first.inner_text() == 'Hard'
    assert page.locator('[data-i18n="soundDesc"]').inner_text() == 'Subtle interface clicks and a level-up sound'
    assert page.locator('meta[name="description"]').get_attribute('content') == 'FlagCraft — a flag and capital quiz game.'

    page.locator('#achievementsButton').click()
    assert page.locator('#achievementsModal').get_attribute('open') is not None
    assert page.locator('#achievementList .achievement-item strong').first.inner_text() == 'First Block'
    page.locator('#closeAchievementsButton').click()
    page.locator('#leaderboardButton').click()
    assert page.locator('#leaderboardModal').get_attribute('open') is not None
    assert page.locator('[data-i18n="worldRanking"]').inner_text() == 'WORLD RANKING'
    page.locator('#closeLeaderboardButton').click()

    page.locator('#settingsButton').click()
    assert page.locator('#settingsModal').get_attribute('open') is not None
    assert page.locator('#themeGrid .theme-button:disabled').count() == 5
    page.keyboard.press('Escape')
    assert page.locator('#settingsModal').get_attribute('open') is None

    page.locator('[data-quiz="capitals"]').first.click()
    page.locator('#difficultyControl [data-difficulty="hard"]').click()
    page.locator('#startButton').click()
    page.wait_for_selector('#gameView.active')
    assert page.locator('#questionTitle').inner_text().startswith('What is the capital of')
    t1=float(page.locator('#timerValue').inner_text())
    page.wait_for_timeout(450)
    t2=float(page.locator('#timerValue').inner_text())
    assert t2 < t1 and t2 > 18.5, (t1,t2)

    # The in-game quit flow must always work and must pause/resume the timer.
    page.locator('#quitButton').click()
    assert page.locator('#quitModal').get_attribute('open') is not None
    paused=float(page.locator('#timerValue').inner_text())
    page.wait_for_timeout(500)
    paused_after=float(page.locator('#timerValue').inner_text())
    assert abs(paused_after-paused) < .15, (paused,paused_after)
    assert page.locator('[data-i18n="quitGameTitle"]').inner_text() == 'Return to the main menu?'
    page.locator('#cancelQuitButton').click()
    assert page.locator('#quitModal').get_attribute('open') is None
    page.wait_for_timeout(350)
    resumed=float(page.locator('#timerValue').inner_text())
    assert resumed < paused_after, (paused_after,resumed)

    q1=page.locator('#questionNumber').inner_text()
    page.locator('.answer-button').first.click()
    page.wait_for_timeout(1150)
    q2=page.locator('#questionNumber').inner_text()
    assert q2 != q1, (q1,q2)
    page.locator('#quitButton').click()
    page.locator('#confirmQuitButton').click()
    page.wait_for_selector('#homeView.active')

    page.close(); context.close()
    context = browser.new_context(viewport={'width':1440,'height':1000})
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    page.on('console', lambda m: errors.append(f'console:{m.type}:{m.text}') if m.type=='error' else None)
    page.route('**/minecraft.wiki/**', lambda route: route.abort())
    page.route('**/myinstants.com/**', lambda route: route.abort())
    page.set_content(content_for(level=10, theme='golden', lang='en'), wait_until='load')
    page.wait_for_selector('#homeView.active')
    page.locator('#settingsButton').click()
    assert page.locator('#themeGrid .theme-button:disabled').count() == 0
    expected=['golden','space','minecraft','dark','sakura','japan']
    actual=page.locator('#themeGrid .theme-button').evaluate_all("els => els.map(e => e.dataset.theme)")
    assert actual == expected, actual
    for theme in expected:
        page.locator(f'#themeGrid [data-theme="{theme}"]').click()
        assert page.locator('body').get_attribute('data-theme') == theme
        color=page.locator('.quiz-type-button').first.evaluate("e => getComputedStyle(e).color")
        bgimg=page.locator('.quiz-type-button').first.evaluate("e => getComputedStyle(e).backgroundImage")
        assert color == 'rgb(255, 253, 244)', (theme,color)
        assert 'linear-gradient' in bgimg
    page.locator('#settingsModal').click(position={'x':5,'y':5})
    assert page.locator('#settingsModal').get_attribute('open') is None

    # Mobile regression: no horizontal overflow and gameplay remains usable.
    page.close(); context.close()
    context = browser.new_context(viewport={'width':390,'height':844})
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    page.on('console', lambda m: errors.append(f'console:{m.type}:{m.text}') if m.type=='error' else None)
    page.route('**/minecraft.wiki/**', lambda route: route.abort())
    page.route('**/myinstants.com/**', lambda route: route.abort())
    page.route('**/flagcdn.com/**', lambda route: route.fulfill(status=200, content_type='image/svg+xml', body='<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" fill="#eee"/></svg>'))
    page.set_content(content_for(level=10, theme='sakura', lang='en'), wait_until='load')
    page.wait_for_selector('#homeView.active')
    dimensions=page.evaluate("() => ({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})")
    assert dimensions['sw'] <= dimensions['cw'] + 1, dimensions
    page.locator('#startButton').click()
    page.wait_for_selector('#gameView.active')
    assert page.locator('.answer-button').count() == 4
    page.locator('.answer-button').nth(1).click()
    page.wait_for_timeout(1050)
    assert page.locator('#questionNumber').inner_text() == 'QUESTION 02'

    browser.close()

bad=[e for e in errors if 'Failed to load resource' not in e and 'ERR_FAILED' not in e and 'Content Security Policy' not in e]
if bad:
    print('\n'.join(bad), file=sys.stderr)
    raise SystemExit(1)
print('Browser tests passed: bilingual UI, 2 difficulties, paused quit flow, timer flow, all 6 themes, diamond fallback, and mobile layout.')
