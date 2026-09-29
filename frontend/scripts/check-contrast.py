"""Check the palette used by Pidu components with the repository's WCAG checker."""

from pathlib import Path
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[2]
css = (root / 'frontend/src/styles/tokens.css').read_text(encoding='utf-8')
checker = root / '.claude/skills/antislop-human/contrast-check.py'
blocks = css.split('}')
common = dict(re.findall(r'--pidu-([\w-]+):\s*(#[\da-fA-F]{6});', blocks[2]))
surfaces = ['canvas', 'surface', 'recess', 'peach', 'shine-peak']
foregrounds = ['ink', 'muted', 'accent', 'accent-hover', 'income', 'expense', 'warning']
failed = 0
checked = 0

print('Perintah tiap pasangan: python .claude/skills/antislop-human/contrast-check.py "#fg" "#bg"')
print('\n| Tema | Token depan / belakang | Hex depan / belakang | Rasio | Ambang | Hasil |')
print('|---|---|---|---|---|---|')
for theme, block in zip(['light', 'dark'], blocks):
    tokens = dict(re.findall(r'--pidu-([\w-]+):\s*(#[\da-fA-F]{6});', block))
    tokens.update(common)
    tokens['checkmark'] = '#ffffff'
    pairs = [(fg, bg, 4.5) for fg in foregrounds for bg in surfaces]
    pairs += [('on-color', bg, 4.5) for bg in foregrounds]
    pairs += [(fg, bg, 3) for fg in ['control-line', 'focus'] for bg in surfaces]
    pairs += [('checkmark', 'check-fill', 3)]
    pairs += [(fg, 'recess', 3) for fg in ['income', 'expense', 'warning']]
    for fg, bg, threshold in pairs:
        result = subprocess.run(
            [sys.executable, str(checker), tokens[fg], tokens[bg]],
            capture_output=True, text=True, check=False,
        )
        if result.returncode not in (0, 1):
            raise RuntimeError(result.stderr or result.stdout)
        ratio = re.search(r'ratio: ([\d.]+):1', result.stdout).group(1)
        passed = ('normal text (4.5:1): PASS' if threshold == 4.5 else 'large text  (3.0:1): PASS') in result.stdout
        failed += not passed
        checked += 1
        print(f'| {theme} | {fg} / {bg} | {tokens[fg]} / {tokens[bg]} | {ratio}:1 | {threshold}:1 | {"PASS" if passed else "FAIL"} |')

print(f'\n{checked - failed}/{checked} pasangan PASS. Ambang 3:1 untuk batas kontrol, fokus, centang, dan isian budget.')
sys.exit(1 if failed else 0)
