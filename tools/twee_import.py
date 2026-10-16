#!/usr/bin/env python3
"""
twee_import.py — read a Twine "Export as Twee" file and compare it with js/scenes.js.

Usage:
  python tools/twee_import.py story.twee                 # report
  python tools/twee_import.py story.twee --skeleton      # also print JS skeletons for passages missing in scenes.js
  python tools/twee_import.py story.twee --json out.json # dump parsed passages as JSON

Conventions (from the author):
  [NOT]       tag  -> author notes / instructions (never a scene)
  [Character] tag  -> character description
  [Cutscene]  tag  -> cutscene
  empty passage    -> not written yet ("To be continued...")
  [[Target]], [[Label->Target]], [[Target<-Label]], [[Label|Target]] -> choices
"""
import json, re, sys, os

HEADER = re.compile(r'^::\s*(?P<name>.*?)\s*(?:\[(?P<tags>[^\]]*)\])?\s*(?P<meta>\{.*\})?\s*$')
LINK = re.compile(r'\[\[(.+?)\]\]')
SPECIAL = {'StoryTitle', 'StoryData'}


def parse(path):
    passages, cur = [], None
    with open(path, encoding='utf-8') as f:
        for line in f.read().splitlines():
            m = HEADER.match(line) if line.startswith('::') else None
            if m:
                cur = {'name': m.group('name'), 'tags': (m.group('tags') or '').split(), 'body': []}
                passages.append(cur)
            elif cur is not None:
                cur['body'].append(line)
    for p in passages:
        body = '\n'.join(p['body']).strip()
        p['body'] = body
        links = []
        for raw in LINK.findall(body):
            if '->' in raw: label, target = raw.split('->', 1)
            elif '<-' in raw: target, label = raw.split('<-', 1)
            elif '|' in raw: label, target = raw.split('|', 1)
            else: label = target = raw
            links.append({'label': label.strip(), 'to': target.strip()})
        p['links'] = links
        p['empty'] = body == ''
        t = [x.lower() for x in p['tags']]
        p['kind'] = ('meta' if p['name'] in SPECIAL else 'note' if 'not' in t else
                     'character' if 'character' in t else 'cutscene' if 'cutscene' in t else
                     'tbc' if p['empty'] else 'scene')
    return passages


def scene_ids(scenes_js):
    if not os.path.exists(scenes_js): return set()
    src = open(scenes_js, encoding='utf-8').read()
    src = src[src.find('window.SCENES'):]
    return set(m.group(2) for m in re.finditer(r'^\s*(["\'])(.+?)\1\s*:\s*\{', src, re.M))


def main():
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    path = sys.argv[1]
    ps = parse(path)
    here = os.path.dirname(os.path.abspath(__file__))
    have = scene_ids(os.path.join(here, '..', 'js', 'scenes.js'))
    names = {p['name'] for p in ps}
    start = None
    for p in ps:
        if p['name'] == 'StoryData':
            try: start = json.loads(p['body']).get('start')
            except Exception: pass

    print(f'File: {path}\nStart passage: {start}\n')
    for kind in ['note', 'character', 'scene', 'cutscene', 'tbc']:
        group = [p for p in ps if p['kind'] == kind]
        if not group: continue
        print(f'== {kind.upper()} ({len(group)}) ==')
        for p in group:
            flag = '' if kind in ('note', 'character') else ('  [in scenes.js]' if p['name'] in have else '  [MISSING in scenes.js]')
            print(f'- {p["name"]}{flag}')
            for l in p['links']:
                warn = '' if l['to'] in names else '   <-- BROKEN LINK (no such passage)'
                print(f'    -> [{l["label"]}] => {l["to"]}{warn}')
        print()
    extra = have - names
    if extra: print('In scenes.js but not in the twee:', ', '.join(sorted(extra)), '\n')

    if '--json' in sys.argv:
        out = sys.argv[sys.argv.index('--json') + 1]
        json.dump(ps, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2); print('wrote', out)

    if '--skeleton' in sys.argv:
        print('// ---- skeletons for passages not yet in scenes.js (translate + fill in) ----')
        for p in ps:
            if p['kind'] in ('meta', 'note', 'character') or p['name'] in have: continue
            if p['empty']:
                print(f'  {json.dumps(p["name"], ensure_ascii=False)}: {{ type: \'tbc\' }},'); continue
            body = [l for l in p['body'].splitlines() if l.strip() and not LINK.search(l)]
            print(f'  {json.dumps(p["name"], ensure_ascii=False)}: {{')
            if p['kind'] == 'cutscene': print("    type: 'cutscene', effect: 'eyelids',")
            print("    art: 'TODO',")
            print('    // author notes: ' + ' | '.join(body)[:400])
            print("    lines: ['TODO'],")
            print('    choices: [')
            for l in p['links']:
                print(f'      {{ label: {json.dumps(l["label"], ensure_ascii=False)}, to: {json.dumps(l["to"], ensure_ascii=False)} }},')
            print('    ],\n  },')


if __name__ == '__main__':
    main()
