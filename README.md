# Life — a tiny pixel-art visual novel demo

Play: https://xantos2.github.io/life-game/ · debug: `?debug=1` · fast (tests): `?fast=1`

Plain HTML/CSS/JS, no build step. All art is procedural pixel art drawn on a 320×180 canvas and
scaled with `image-rendering: pixelated`; speaking characters are drawn big on a separate 100×140
canvas. Fonts (Press Start 2P, Pixelify Sans, SIL OFL 1.1) are bundled in `fonts/`.

Story source: `story/demo-v2.twee` (Twine export). `story/demo-v1.twee` is the first demo.

## Files
| file | what |
|---|---|
| `js/scenes.js` | **the story**: `ITEMS` and `SCENES` (keys = exact Twine passage names) |
| `js/state.js` | save data (`localStorage` key `life.save.v2`, migrates `life.save.v1`) |
| `js/logic.js` | hidden karma / relationship tiers (`TIER_CONFIG`), conditions |
| `js/engine.js` | scene flow, typing, fades, cutscenes, talk layout, inventory, debug overlay |
| `js/art.js`, `js/art2.js` | backgrounds + cutscene animations (`ART.*`) |
| `js/actors.js` | big speaking characters (`ACTORS.Osvaldo/Samara/Teacher/Nurse/Knife Man/Police`) |
| `tools/twee_import.py` | twee → report of passages, links, button texts, effect hints, missing scenes; `--skeleton` |
| `tools/shoot.py` | Playwright verification (all edges, effects, branches, inventory, migration, mobile) |
| `tools/gallery.py` | screenshot every scene via debug jumps |

## Systems
**Talk layout.** A line whose `speaker` (or `actor`) is in `ACTORS` shows that character big on the
left with the text box on the right. `actor: 'Osvaldo:cry'` picks an expression
(smile, happy, sad, cry, surprised, angry, grumpy, soft, serious, tongue, sleep, gift, wave).
Narration without an actor uses the full-width box. On portrait screens the box goes under the picture.

**Inventory.** Bag button top-right (or `I`). Items have icon, name, description and source
(`Given by: Osvaldo` / `Found in: your room`). Hover/click shows details; *Trash* asks to confirm.
Items are defined in `ITEMS`; a `useItem` effect removes an item automatically.

**Karma** (hidden) starts at **+10**, no min/max. **Relationships** (hidden) start at 0 per character.
Both are sorted into 5 tiers — `catastrophic, bad, neutral, good, very good` — *relative to the maximum
reachable at the current scene* (computed from the scene graph in `js/logic.js`, longest/shortest path
over every `onEnter`/choice/branch effect, starting at the `Start` scene). Thresholds live in
`TIER_CONFIG` at the top of `js/logic.js`:

```js
karma:        { bad: 0.30, neutral: 0.60, good: 0.85 }   // value / maxReachableHere
              // < 0 → catastrophic, < 0.30 → bad, < 0.60 → neutral, < 0.85 → good, else very good
relationship: { catastrophic: 0.5, neutral: 0.30, good: 0.85 }
              // < 0: catastrophic if ≤ 0.5 × lowest reachable here, else bad
              // 0 → neutral; > 0: value / max reachable: < 0.30 neutral, < 0.85 good, else very good
```

**Flags.** Every entered scene is recorded in `visited` (+ `visits` count), every choice in
`choices` as `"From => To"`, plus free `flags`.

**Effects** (`onEnter: [...]` of a scene, or `effects: [...]` on a choice). `onEnter` runs once per
visit, when you arrive through a choice — not when resuming a save.
```js
{ type: 'karma', delta: 5 }            { type: 'rel', char: 'Osvaldo', delta: -10 }
{ type: 'addItem', item: 'pebble' }    { type: 'addRandomItem', pool: ['mole_father', ...] }
{ type: 'removeItem', item: 'pebble' } { type: 'useItem', item: 'pebble' }
{ type: 'flag', key: 'brave', value: true }
```

**Conditions** (`if:` on a choice or line, or in `branches`):
```js
{ visited: 'Sohbet et' }  { chose: 'No => Sohbet et' }  { hasItem: 'pebble' }  { flag: 'k', eq: 1 }
{ karma: ['good', 'very good'] }  { karmaAtLeast: 'good' }  { karmaAtMost: 'bad' }
{ rel: 'Osvaldo', tier: ['good'] }  { relAtLeast: { Osvaldo: 'good' } }  { relAtMost: { Samara: 'bad' } }
{ not: c }  { all: [c1, c2] }  { any: [c1, c2] }
```
A `type: 'branch'` scene jumps straight to the first matching branch, e.g. `Kavga Et` →
`Kavga Et (Osvaldo)` if you chatted with Osvaldo, else `Kavga Et (stabbed)`.

**Cutscenes.** `type: 'cutscene'` with `art` that animates per line: the art gets `opts.beat`
(line index) and `opts.beatT` (seconds into that line). Lines may set `hold` (seconds) and `speaker`.

**Debug** (`?debug=1`): live karma/relationship values with tiers and reachable ranges, items, flags;
buttons to toggle "chatted with Osvaldo", karma ±5, +pebble; a jump list of every scene
(optionally applying its effects). Use it to test the `Kavga Et` / `Kaç` branches.

**Saves.** `life.save.v2` = `{version, name, inventory:[{id,from}], karma, rel, flags, visited,
visits, choices, currentScene}`. A v1 save (trinket) is migrated: the trinket becomes an
inventory item. *Restart* wipes the save.

## Adding a scene
1. Twine → *Build → Export as Twee*; run `python3 tools/twee_import.py story.twee --skeleton`.
2. Paste into `window.SCENES`, translate, set `art`, add `onEnter` effects / `if` conditions.
3. New background: `ART.myPlace = { draw(ctx, t, opts) { ... } }` in `js/art2.js`.
4. An empty passage / `{ type: 'tbc' }` shows "To be continued...".
5. `python3 -m http.server` then `/workspace/.pwvenv/bin/python tools/shoot.py http://localhost:8000/`.

```js
'Some passage': {
  art: 'street', intro: 'Optional text card on black.',
  onEnter: [{ type: 'karma', delta: 2 }],
  lines: ['Narration...', { text: 'Hi {name}!', speaker: 'Osvaldo', actor: 'Osvaldo:smile' }],
  choices: [{ label: 'Go', to: 'Next passage' }, { label: 'Give pebble', to: 'X', if: { hasItem: 'pebble' } }],
},
```
