/* =====================================================================
   Life — SCENE DATA
   Keys are the Twine passage names (exactly as in the .twee file), so
   tools/twee_import.py can match them. Player-facing text is English.

   Scene fields:
     type     : 'dialogue' (default) | 'menu' | 'name' | 'cutscene' | 'tbc'
     art      : id of a pixel-art background in js/art.js (ART registry)
     effect   : optional visual effect, e.g. 'eyelids' (cutscene)
     intro    : optional text card shown on black before the scene fades in
     lines    : array of strings or { text, speaker }  ({name} = player name)
     speaker  : default speaker for all lines (null = narration)
     choices  : [{ label, to, effects:[...] , action }]
                effects: {type:'setTrinket', item} | {type:'randomTrinket', pool:[...]}
                         {type:'clearTrinket'} | {type:'flag', key, value}
                action : 'resume' | 'restart' | 'menu'   (menu buttons)
     hud      : show trinket slot (default true for dialogue/tbc)
   A passage that is missing here, or has type 'tbc', shows "To be continued...".
   ===================================================================== */

window.ITEMS = {
  sari_biber:    { name: 'Sarı Biber',   icon: 'pepper' },
  mole_father:   { name: 'Father Mole',  icon: 'mole', color: '#3f6fd8', acc: 'overalls' },
  mole_mother:   { name: 'Mother Mole',  icon: 'mole', color: '#e2557a', acc: 'apron' },
  mole_brother:  { name: 'Brother Mole', icon: 'mole', color: '#3fb36a', acc: 'cap' },
  mole_sister:   { name: 'Sister Mole',  icon: 'mole', color: '#b06ae0', acc: 'bow' },
  mole_baby:     { name: 'Baby Mole',    icon: 'mole', color: '#ffb3c8', acc: 'bib', small: true },
};

window.SCENES = {
  'Menü': {
    type: 'menu', art: 'menu',
    choices: [
      { label: 'Start',   action: 'resume' },
      { label: 'Restart', action: 'restart' },
    ],
  },

  // Twine passage "Restart" is handled by the menu button action.
  'Restart': { type: 'action', action: 'restart' },

  'Start': {
    type: 'name', art: 'menu', artOpts: { dim: true },
    title: 'Who are you?', next: 'Continue',
  },

  'Continue': {
    type: 'cutscene', art: 'morningSky', effect: 'eyelids',
    lines: [
      'Good morning, {name}.',
      'Looks like today is going to be a beautiful day.',
      "If you're ready, let's begin.",
    ],
    choices: [{ label: "Yes, I'm Ready", to: "Yes, I'm Ready" }],
  },

  "Yes, I'm Ready": {
    art: 'bedroom',
    lines: [
      'You open your eyes in a cozy little room. Sunlight spills across the floor.',
      'Would you like to take a trinket with you today?',
    ],
    choices: [
      { label: 'Sarı Biber', to: 'Sarı Biber', effects: [{ type: 'setTrinket', item: 'sari_biber' }] },
      { label: 'Random Sylvanian Family', to: 'Random Slyvanian Family',
        effects: [{ type: 'randomTrinket', pool: ['mole_father', 'mole_mother', 'mole_brother', 'mole_sister', 'mole_baby'] }] },
      { label: 'No', to: 'No', effects: [{ type: 'clearTrinket' }] },
    ],
  },

  'No': {
    art: 'street',
    lines: [
      { text: 'You step out the door. The street is warm, loud and full of life. A man is lying on a flattened cardboard box by the wall.', speaker: null },
      { text: "Hey, what's your name, gorgeous? Wanna chat?", speaker: 'Osvaldo' },
    ],
    choices: [
      { label: 'Get lost, you idiot!', to: 'Defol git, aptal herif!' },
      { label: 'Ignore him',           to: 'Görmezden gel' },
      { label: 'Chat with him',        to: 'Sohbet et' },
    ],
  },

  'Görmezden gel': {
    art: 'streetEnd',
    intro: 'You quickly walk past Osvaldo without a word.',
    lines: [
      'You reach the end of the street.',
      'Two people are fighting right in front of the bar. Fists fly, voices rise, and a pigeon flees for its life.',
    ],
    choices: [
      { label: 'Keep walking',    to: 'İlerle' },
      { label: 'Intervene',       to: 'Müdahale et' },
      { label: 'Call the police', to: 'Polisi ara' },
    ],
  },

  // ---- not written yet in the Twine file -> "To be continued..." ----
  'Sarı Biber':              { type: 'tbc' },
  'Random Slyvanian Family': { type: 'tbc' },
  'Defol git, aptal herif!': { type: 'tbc' },
  'Sohbet et':               { type: 'tbc' },
  'İlerle':                  { type: 'tbc' },
  'Müdahale et':             { type: 'tbc' },
  'Polisi ara':              { type: 'tbc' },
};

window.START_SCENE = 'Menü';
