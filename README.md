# Life — a tiny pixel-art visual novel demo

Play: https://xantos2.github.io/life-game/

Plain HTML/CSS/JS, no build step. All art is procedural pixel art drawn on a 320×180 canvas
(`js/art.js`) and scaled with `image-rendering: pixelated`. Fonts (Press Start 2P, Pixelify Sans,
SIL OFL 1.1) are bundled in `fonts/`.

## Files
- `js/scenes.js` — **the story**. One entry per Twine passage (keys = passage names). Text, speaker, art id, choices, effects.
- `js/state.js` — save data in `localStorage` (`life.save.v1`): name, trinket, flags, current scene, visited.
- `js/engine.js` — scene flow, typing effect, fades, intro cards, cutscene eyelids, HUD, keyboard (Space/Enter, 1–9).
- `js/art.js` — pixel-art backgrounds (`ART.menu`, `morningSky`, `bedroom`, `street`, `streetEnd`, `tbc`), speaker portraits (`PORTRAITS.Osvaldo`), item icons.
- `tools/twee_import.py` — parses a Twine `.twee` export, lists passages/links/empty ones and what's missing in `scenes.js`; `--skeleton` prints ready-to-fill entries.
- `tools/shoot.py` — Playwright click-through of every path + screenshots.

## Adding a scene
1. Export Twine → *Build → Export as Twee*. Run `python tools/twee_import.py story.twee --skeleton`.
2. Paste the skeleton into `window.SCENES` in `js/scenes.js`, translate text, set `art`.
3. New background? Add `ART.myPlace = { draw(ctx, t) { ... } }` in `js/art.js`.
4. A passage that is missing or `{ type: 'tbc' }` shows "To be continued...".

```js
'Some passage': {
  art: 'street', intro: 'Optional text card on black.',
  lines: ['Narration...', { text: 'Hi {name}!', speaker: 'Osvaldo' }],
  choices: [{ label: 'Go', to: 'Next passage', effects: [{ type: 'flag', key: 'brave', value: true }] }],
},
```
