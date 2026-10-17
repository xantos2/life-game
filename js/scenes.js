/* =====================================================================
   Life — SCENE DATA
   Keys = Twine passage names exactly as in the .twee (so tools/twee_import.py can match).
   Sub-scenes for conditional passages use "Passage (variant)" keys.

   Scene fields:
     type     : 'dialogue' (default) | 'menu' | 'name' | 'cutscene' | 'branch' | 'tbc' | 'action'
     art      : background id in js/art.js (ART registry);  artOpts: extra options for it
     effect   : 'eyelids' (eyes slowly opening);  delay: seconds before the first line
     intro    : text card shown on black before the scene fades in
     letterbox: cinematic black bars (cutscenes)
     onEnter  : hidden effects applied ONCE each time the scene is entered through a choice
     lines    : strings or { text, speaker, actor, if, hold }
                speaker -> name tag;  actor 'Name' or 'Name:expression' -> big character on the left
                {name} = player name, {lastItem} = last item added
     choices  : [{ label, to, effects:[...], if:cond }]
     branches : (type 'branch') [{ if:cond, to }] -> first match wins, last one is the fallback
   Effects: {type:'karma', delta} {type:'rel', char, delta} {type:'addItem', item, from}
            {type:'addRandomItem', pool, from} {type:'removeItem', item} {type:'flag', key, value}
   Conditions: see js/logic.js (visited, chose, hasItem, flag, karma tiers, relationship tiers, not/all/any)
   A passage that is missing here or has type 'tbc' shows "To be continued...".
   ===================================================================== */

window.ITEMS = {
  sari_biber:   { name: 'Sarı Biber',   icon: 'pepper', from: 'Found in: your room',
                  desc: 'A squishy yellow bell-pepper plushie with a sleepy little smile. It still smells like your pillow.' },
  mole_father:  { name: 'Father Mole',  icon: 'mole', color: '#3f6fd8', acc: 'overalls', from: 'Found in: your room',
                  desc: 'Sylvanian Families mole dad in blue overalls. He looks like he has worked hard all his life.' },
  mole_mother:  { name: 'Mother Mole',  icon: 'mole', color: '#e2557a', acc: 'apron', from: 'Found in: your room',
                  desc: 'Sylvanian Families mole mom in a pink dress and a tiny white apron. Smells faintly of cookies.' },
  mole_brother: { name: 'Brother Mole', icon: 'mole', color: '#3fb36a', acc: 'cap', from: 'Found in: your room',
                  desc: 'Sylvanian Families mole brother with a green cap, always ready for an adventure underground.' },
  mole_sister:  { name: 'Sister Mole',  icon: 'mole', color: '#b06ae0', acc: 'bow', from: 'Found in: your room',
                  desc: 'Sylvanian Families mole sister with a pink bow. The smallest smile you have ever seen.' },
  mole_baby:    { name: 'Baby Mole',    icon: 'mole', color: '#ffb3c8', acc: 'bib', small: true, from: 'Found in: your room',
                  desc: 'The tiny Sylvanian Families baby mole in a little bib. Easy to lose, impossible not to love.' },
  pebble:       { name: 'Pebble',       icon: 'pebble', from: 'Given by: Osvaldo',
                  desc: 'A small, ordinary pebble.' },
};

const MOLES = ['mole_father', 'mole_mother', 'mole_brother', 'mole_sister', 'mole_baby'];
const CHATTED = { visited: 'Sohbet et' };   // "player chose to chat with Osvaldo"

window.SCENES = {
  'Menü': { type: 'menu', art: 'menu', choices: [{ label: 'Start', action: 'resume' }, { label: 'Restart', action: 'restart' }] },
  'Restart': { type: 'action', action: 'restart' },
  'Start': { type: 'name', art: 'menu', artOpts: { dim: true }, title: 'Who are you?', next: 'Continue' },

  'Continue': {
    type: 'cutscene', art: 'morningSky', effect: 'eyelids',
    lines: ['Good morning, {name}.', 'Looks like today is going to be a beautiful day.', "If you're ready, let's begin."],
    choices: [{ label: "Yes, I'm Ready", to: "Yes, I'm Ready" }],
  },

  /* ---------------- bedroom ---------------- */
  "Yes, I'm Ready": {
    art: 'bedroom',
    lines: ['You open your eyes in a cozy little room. Sunlight spills across the floor.', 'Would you like to take a trinket with you today?'],
    choices: [
      { label: 'Sarı Biber', to: 'Sarı Biber' },
      { label: 'Random Sylvanian Family', to: 'Random Slyvanian Family' },
      { label: 'No', to: 'No' },
    ],
  },
  'Sarı Biber': {
    art: 'bedroom',
    onEnter: [{ type: 'addItem', item: 'sari_biber' }, { type: 'karma', delta: 3 }],
    lines: ['You pick up Sarı Biber and tuck it into your bag.'],
    choices: [{ label: 'Continue', to: 'No' }],
  },
  'Random Slyvanian Family': {
    art: 'bedroom',
    onEnter: [{ type: 'addRandomItem', pool: MOLES }, { type: 'karma', delta: 2 }],
    lines: ['You pick a random member of the mole family off the desk... it\'s {lastItem}! Into the bag it goes.'],
    choices: [{ label: 'Continue', to: 'No' }],
  },

  /* ---------------- street + Osvaldo ---------------- */
  'No': {
    art: 'street',
    lines: [
      'You step out the door. The street is warm, loud and full of life. A man is lying on a flattened cardboard box by the wall.',
      { text: "Hey, what's your name, gorgeous? Wanna chat?", speaker: 'Osvaldo' },
    ],
    choices: [
      { label: 'Get lost, you idiot!', to: 'Defol git, aptal herif!' },
      { label: 'Ignore him', to: 'Görmezden gel' },
      { label: 'Chat with him', to: 'Sohbet et' },
    ],
  },
  'Defol git, aptal herif!': {
    art: 'street',
    onEnter: [{ type: 'karma', delta: -10 }, { type: 'rel', char: 'Osvaldo', delta: -10 }],
    lines: [{ text: 'Osvaldo bursts into tears and buries his head in his hands.', actor: 'Osvaldo:cry' }],
    choices: [{ label: 'Continue', to: 'İlerle' }],
  },
  'Sohbet et': {
    art: 'street',
    onEnter: [{ type: 'karma', delta: 2 }, { type: 'rel', char: 'Osvaldo', delta: 10 }],
    lines: [
      { text: 'You walk over to chat with him. Osvaldo looks surprised.', actor: 'Osvaldo:surprised' },
      { text: "Sorry, that came out like a catcall. People usually just ignore me... I'm a pretty lonely guy.", speaker: 'Osvaldo', actor: 'Osvaldo:soft' },
      { text: "You're the first person in ages who treated me like a human being and actually talked to me. You're a good person.", speaker: 'Osvaldo', actor: 'Osvaldo:smile' },
      { text: 'I want to give you a little gift.', speaker: 'Osvaldo', actor: 'Osvaldo:gift' },
      { text: 'He holds out a small pebble in his dirty palm.', actor: 'Osvaldo:gift' },
    ],
    choices: [
      { label: "Thank you, that's very kind of you", to: 'Hediyeyi Kabul et' },
      { label: 'Thank you, but you keep it', to: ' Hediyeyi Reddet' },
    ],
  },
  'Hediyeyi Kabul et': {
    art: 'street',
    onEnter: [{ type: 'addItem', item: 'pebble' }, { type: 'karma', delta: 1 }, { type: 'rel', char: 'Osvaldo', delta: 5 }],
    lines: [
      'You accept the gift and put it in your bag.',
      { text: 'Good luck out there, kid.', speaker: 'Osvaldo', actor: 'Osvaldo:smile' },
      { text: 'Osvaldo smiles, curls up on his cardboard and goes back to sleep.', actor: 'Osvaldo:sleep' },
    ],
    choices: [{ label: 'Continue', to: 'İlerle' }],
  },
  ' Hediyeyi Reddet': {
    art: 'street',
    lines: [
      { text: 'Osvaldo looks a little hurt.', actor: 'Osvaldo:sad' },
      { text: 'He shrugs, curls up on his cardboard and goes back to sleep.', actor: 'Osvaldo:sleep' },
    ],
    choices: [{ label: 'Continue', to: 'İlerle' }],
  },

  /* ---------------- the fight ---------------- */
  'Görmezden gel': {
    art: 'streetEnd',
    intro: 'You quickly walk past Osvaldo without a word.',
    lines: ['You reach the end of the street.', 'Two people are fighting right in front of the bar. Fists fly, voices rise, and a pigeon flees for its life.'],
    choices: [
      { label: 'Keep walking', to: 'İlerle' },
      { label: 'Intervene', to: 'Müdahale et' },
      { label: 'Call the police', to: 'Polisi ara' },
    ],
  },
  'Müdahale et': {
    art: 'streetEnd', artOpts: { variant: 'knife' },
    lines: [
      'You are scared, but you step in anyway. "Please, stop! Break it up! Grown men brawling in the street, aren\'t you ashamed?"',
      { text: 'One of them spins around. There is a knife in his hand.', actor: 'Knife Man' },
      { text: "Who the hell asked you?! Keep running your mouth and you're next. I'll stick this knife in you, so shut it!", speaker: 'Knife Man', actor: 'Knife Man' },
    ],
    choices: [
      { label: 'Run', to: 'Kaç' },
      { label: "I'll beat YOU up, you pickle!", to: 'Kavga Et' },
    ],
  },
  'Kavga Et': { type: 'branch', branches: [{ if: CHATTED, to: 'Kavga Et (Osvaldo)' }, { to: 'Kavga Et (stabbed)' }] },
  'Kavga Et (Osvaldo)': {
    type: 'cutscene', art: 'osvaldoSlap', letterbox: true,
    lines: [
      { text: 'Before the man can move, Osvaldo bursts onto the scene!', hold: 1.6 },
      { text: 'SLAP! He smacks the knife man right across the face.', hold: 1.4 },
      { text: 'Then he chases him down the street, waving his bitten onion like a sword.', hold: 1.8 },
    ],
    choices: [{ label: 'Continue', to: 'İlerle' }],
  },
  'Kavga Et (stabbed)': {
    type: 'cutscene', art: 'stab', letterbox: true,
    lines: [
      { text: 'You raise your fists.', hold: 1.2 },
      { text: 'He lunges at you, furious. A sharp, cold pain...', hold: 1.6 },
      { text: 'Everything goes dark.', hold: 1.6 },
    ],
    choices: [{ label: 'Continue', to: 'Cutscene - Pre-Hospital' }],
  },
  'Kaç': { type: 'branch', branches: [{ if: CHATTED, to: 'Kaç (Osvaldo)' }, { to: 'Kaç (escape)' }] },
  'Kaç (Osvaldo)': {
    type: 'cutscene', art: 'osvaldoHeadbutt', letterbox: true,
    lines: [
      { text: 'You turn to run... and Osvaldo comes charging in!', hold: 1.6 },
      { text: 'BONK! He headbutts the man with the knife.', hold: 1.6 },
      { text: "I'll handle this, you go!", speaker: 'Osvaldo', hold: 1.8 },
    ],
    choices: [{ label: 'Continue', to: 'İlerle' }],
  },
  'Kaç (escape)': {
    type: 'cutscene', art: 'escape', letterbox: true,
    lines: [
      { text: 'You turn around and run as fast as you can!', hold: 1.4 },
      { text: 'His angry shouts chase you down the street...', hold: 1.6 },
      { text: '...until they fade away. You stop to catch your breath. You are safe.', hold: 1.6 },
    ],
    choices: [{ label: 'Continue', to: 'İlerle' }],
  },
  'Polisi ara': {
    art: 'streetEnd',
    onEnter: [{ type: 'karma', delta: 1 }],
    lines: [
      { text: 'You pull out your phone and call the police.', actor: 'Police' },
      { text: "We're on our way to intervene right now. Don't worry.", speaker: 'Police', actor: 'Police' },
    ],
    choices: [{ label: 'Continue', to: 'İlerle' }],
  },

  /* ---------------- Samara ---------------- */
  'İlerle': {
    art: 'brightStreet',
    lines: [
      'Further down the road, the sun is shining and everything feels bright. Someone calls out to you: it\'s Samara!',
      { text: "I have a strange feeling inside... but I'm so happy to see you, {name}! It's been such a long time.", speaker: 'Samara', actor: 'Samara' },
      { text: 'We should hang out more often. I love the cookies you make!', speaker: 'Samara', actor: 'Samara:happy' },
    ],
    choices: [
      { label: "Let's definitely meet up! I have to go now, though.", to: 'Mutlaka görüşelim, şimdi gitmem lazım' },
      { label: "Honestly, I didn't miss you at all.", to: 'Açıkcası ben seni hiç özlemedim' },
    ],
  },
  'Mutlaka görüşelim, şimdi gitmem lazım': {
    art: 'brightStreet',
    lines: [{ text: 'Samara smiles and waves goodbye.', actor: 'Samara:wave' }],
    choices: [{ label: 'Move on', to: 'İlerle 1' }],
  },
  'Açıkcası ben seni hiç özlemedim': {
    art: 'brightStreet',
    onEnter: [{ type: 'karma', delta: -5 }],
    lines: [
      { text: "Samara's face falls. She looks unhappy.", actor: 'Samara:sad' },
      { text: "Why would you say that? Aren't we really good friends? Did I do something to upset you?", speaker: 'Samara', actor: 'Samara:sad' },
    ],
    choices: [
      { label: 'Do I have to see everyone? Do I owe you an explanation?', to: 'Herkesle görüşmek zorunda mıyım? Sana hesap mı vereceğim?' },
      { label: "That's just how I decided it.", to: 'Ben öyle uygun gördüm' },
    ],
  },
  'Herkesle görüşmek zorunda mıyım? Sana hesap mı vereceğim?': {
    art: 'brightStreet',
    onEnter: [{ type: 'karma', delta: -5 }],
    lines: [
      { text: 'Samara looks heartbroken and starts to cry.', actor: 'Samara:cry' },
      { text: "I really didn't think you were like this. Why are you treating me this way? I've been your friend for so many years.", speaker: 'Samara', actor: 'Samara:cry' },
      { text: 'You really hurt me. You were my only friend, {name}.', speaker: 'Samara', actor: 'Samara:cry' },
    ],
    choices: [{ label: 'Continue', to: 'İlerle 1' }],
  },
  'Ben öyle uygun gördüm': {
    art: 'brightStreet',
    onEnter: [{ type: 'karma', delta: -5 }],
    lines: [
      { text: 'Samara is taken aback. Surprise spreads across her face.', actor: 'Samara:surprised' },
      { text: 'Well then... I hope we see each other again. I guess I was wrong about you...', speaker: 'Samara', actor: 'Samara:surprised' },
    ],
    choices: [{ label: 'Continue', to: 'İlerle 1' }],
  },

  /* ---------------- university ---------------- */
  'İlerle 1': {
    art: 'campus',
    lines: [
      'You arrive at your university. Today is your very first day. A teacher walks up to you.',
      { text: 'Welcome! Which department are you in?', speaker: 'Teacher', actor: 'Teacher' },
    ],
    choices: [
      { label: 'Traditional Chinese Medicine', to: 'Geleneksel Çin Tıbbı' },
      { label: 'Ice Cream Expertise', to: 'Dondurma Uzmanlığı' },
      { label: "I don't remember", to: 'Hatırlamıyorum' },
    ],
  },
  'Geleneksel Çin Tıbbı': {
    art: 'campus',
    lines: [
      { text: 'The teacher smiles.', actor: 'Teacher:happy' },
      { text: "Wonderful! I've always been curious about that field, but it seemed so hard that I never studied it.", speaker: 'Teacher', actor: 'Teacher:happy' },
      { text: "I hope you do really well, and maybe help me out too! Want me to show you my tongue? You could do a quick analysis right now.", speaker: 'Teacher', actor: 'Teacher' },
    ],
    choices: [
      { label: 'Sure, show me your tongue', to: 'Dil göster' },
      { label: "I don't have that much experience yet. I'd better get to class.", to: 'TCM Sınıfı' },
    ],
  },
  'Dil göster': {
    art: 'campus',
    lines: [{ text: 'The teacher sticks out her tongue. "Aaah..."', actor: 'Teacher:tongue' }],
    choices: [
      { label: 'Tell her what you know', to: 'Doğru analiz' },
      { label: 'Tell her what you know, but exaggerate a little', to: 'Abartılı analiz' },
      { label: 'Make something up', to: 'Uydur' },
    ],
  },
  'Doğru analiz': {
    art: 'campus',
    onEnter: [{ type: 'karma', delta: 5 }],
    lines: [
      { text: 'You read her tongue based on what you know. The teacher thanks you warmly: most of it turned out to be right. She is delighted.', actor: 'Teacher:happy' },
      { text: "Thank you so much! Now off to class, don't be late!", speaker: 'Teacher', actor: 'Teacher:happy' },
    ],
    choices: [{ label: 'Go to class', to: 'TCM Sınıfı' }],
  },
  'Abartılı analiz': {
    art: 'campus',
    onEnter: [{ type: 'karma', delta: 3 }],
    lines: [
      { text: 'Starting from her tongue, you go all out with your analysis. The teacher is stunned.', actor: 'Teacher:surprised' },
      { text: "Some of that was spot on... and some of it I'd never have guessed in a million years!", speaker: 'Teacher', actor: 'Teacher:surprised' },
      { text: "Now go to your class, don't be late.", speaker: 'Teacher', actor: 'Teacher' },
    ],
    choices: [{ label: 'Go to class', to: 'TCM Sınıfı' }],
  },
  'Uydur': {
    art: 'campus',
    onEnter: [{ type: 'karma', delta: -10 }],
    lines: [
      { text: 'You say a whole bunch of nonsense. The teacher looks a little suspicious... but she believes you.', actor: 'Teacher:surprised' },
      { text: "I'm going to change my whole lifestyle because of this. Thank you so much!", speaker: 'Teacher', actor: 'Teacher:happy' },
    ],
    choices: [{ label: 'Go to class', to: 'TCM Sınıfı' }],
  },
  'Dondurma Uzmanlığı': {
    art: 'campus',
    lines: [
      { text: 'The teacher smiles.', actor: 'Teacher:happy' },
      { text: "How lovely! It's the door just ahead, on the second floor. Hurry to class, don't be late on your first day.", speaker: 'Teacher', actor: 'Teacher:happy' },
    ],
    choices: [{ label: 'Go to class', to: 'Dondurma Sınıfı' }],
  },
  'Hatırlamıyorum': {
    art: 'campus',
    lines: [
      { text: 'The teacher looks surprised, then annoyed.', actor: 'Teacher:surprised' },
      { text: "You don't remember? Are you joking, or are you serious? If you're messing with me, it's not funny at all. This is a serious institution!", speaker: 'Teacher', actor: 'Teacher:angry' },
    ],
    choices: [
      { label: 'Sorry, I was joking. Ice Cream Expertise.', to: 'Dondurma Uzmanlığı' },
      { label: 'Sorry, I was joking. Traditional Chinese Medicine.', to: 'Geleneksel Çin Tıbbı' },
      { label: "I really don't remember, how should I know?!", to: 'Okul Drop' },
    ],
  },
  'Okul Drop': {
    art: 'campus',
    lines: [
      { text: 'The teacher loses her temper.', actor: 'Teacher:angry' },
      { text: "Leave this place at once! Mocking us isn't funny. Don't waste our time.", speaker: 'Teacher', actor: 'Teacher:angry' },
    ],
    choices: [{ label: 'Go home', to: 'Eve gidip dinlen' }],
  },

  /* ---------------- hospital ---------------- */
  'Cutscene - Pre-Hospital': {
    art: 'hospital', effect: 'eyelids', delay: 3.2,
    lines: [
      'Your eyes slowly open. You are lying in a hospital bed. A monitor beeps softly beside you.',
      { text: 'A nurse appears at your side.', actor: 'Nurse' },
      { text: "Are you alright, {name}? You finally woke up! You've been unconscious for three days.", speaker: 'Nurse', actor: 'Nurse' },
      { text: "They couldn't catch the man who stabbed you. I'd advise you to be careful out on the street.", speaker: 'Nurse', actor: 'Nurse:serious' },
      { text: 'We can get you discharged right away.', speaker: 'Nurse', actor: 'Nurse' },
    ],
    choices: [{ label: 'Get discharged', to: 'Hastaneden Çık' }],
  },
  'Hastaneden Çık': {
    art: 'hospitalExit',
    lines: ['You walk out of the hospital into the daylight. Then it hits you: you are supposed to be at school.'],
    choices: [
      { label: 'Go to school', to: 'Okula Git' },
      { label: 'Go home', to: 'Eve gidip dinlen' },
    ],
  },
  'Okula Git': {
    art: 'schoolGate',
    lines: [
      { text: 'You reach the school. A teacher meets you at the gate, looking sad.', actor: 'Teacher:sad' },
      { text: "Your name is {name}, isn't it? I heard what happened to you, and I'm so sorry.", speaker: 'Teacher', actor: 'Teacher:sad' },
      { text: "But unfortunately you couldn't start your classes on time. Even if it was a health emergency, rules are rules.", speaker: 'Teacher', actor: 'Teacher:sad' },
      { text: 'You can take the entrance exam again next year and start university then.', speaker: 'Teacher', actor: 'Teacher:sad' },
    ],
    choices: [{ label: 'Go home', to: 'Eve gidip dinlen' }],
  },

  /* ---------------- night ---------------- */
  'Eve gidip dinlen': {
    art: 'bedroomNight', effect: 'eyelids', delay: 2.8,
    intro: 'You go home, close your eyes and drift off to sleep...',
    lines: ['When you wake up, it is already night. The house is very quiet.'],
    choices: [
      { label: 'Go outside', to: 'Gece- dışarı çık' },
      { label: 'Turn on the computer', to: 'Gece - bilgisayarı aç' },
    ],
  },

  /* ---- not written yet in the Twine file -> "To be continued..." ---- */
  'Dondurma Sınıfı':       { type: 'tbc' },
  'TCM Sınıfı':            { type: 'tbc' },
  'Gece - bilgisayarı aç': { type: 'tbc' },
  'Gece- dışarı çık':      { type: 'tbc' },
};

window.START_SCENE = 'Menü';
window.STORY_START = 'Start'; // first story scene (root of the karma/relationship reach graph)
