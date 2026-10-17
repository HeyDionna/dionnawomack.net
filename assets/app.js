// Dionna Womack — portfolio behaviour. Everything enhances; the page reads fine without it.

// Reveal blocks once as they arrive. Never leaves content hidden.
(() => {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((e) => io.observe(e));
  addEventListener('load', () => setTimeout(() => els.forEach((e) => { const r = e.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) e.classList.add('is-in'); }), 2500));
})();

// Frozen nav: a shadow once you scroll, and the section you're in lights up.
(() => {
  const bar = document.querySelector('.topbar');
  const links = [...document.querySelectorAll('[data-nav] a')];
  if (!bar) return;
  const onScroll = () => bar.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const secs = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const mark = () => {
    const y = scrollY + innerHeight * 0.35;
    let cur = null;
    secs.forEach((s) => { if (s.offsetTop <= y) cur = s; });
    if (cur && innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = secs[secs.length - 1];
    links.forEach((a) => a.setAttribute('aria-current', cur && a.getAttribute('href') === '#' + cur.id ? 'true' : 'false'));
  };
  let raf = 0;
  addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(mark); }, { passive: true });
  addEventListener('resize', mark); mark();
})();

// The Sphere loop plays only while it's on screen.
(() => {
  const v = document.querySelector('.card--video video');
  if (!v) return;
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }).observe(v);
})();

// Headline: the last word rotates (a plain fade when the visitor prefers less motion).
(() => {
  const rot = document.querySelector('.rotator');
  if (!rot) return;
  const words = rot.dataset.words.split(',');
  const el = rot.querySelector('.rotator__word');
  // reserve the widest word so the headline never reflows
  const probe = el.cloneNode(); probe.style.position = 'absolute'; probe.style.visibility = 'hidden'; rot.appendChild(probe);
  let w = 0; words.forEach((t) => { probe.textContent = t + '.'; w = Math.max(w, probe.getBoundingClientRect().width); }); probe.remove();
  el.style.minWidth = Math.ceil(w) + 'px';
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    el.classList.remove('is-in'); el.classList.add('is-out');
    setTimeout(() => { i = (i + 1) % words.length; el.textContent = words[i] + '.'; el.classList.remove('is-out'); el.classList.add('is-in'); }, 380);
  }, 2400);
})();

// GIF wall: each tile loops one clip at a time and rotates through its title card and favorites.
// Clips load only when the tile is near the screen. One tile changes at a time, round robin, so the wall shimmers instead of flashing.
(() => {
  const tiles = [...document.querySelectorAll('.gif[data-clips]')];
  if (!tiles.length) return;
  const state = tiles.map((li) => ({ li, v: li.querySelector('video'), dots: li.querySelectorAll('.gif__dots i'), clips: li.dataset.clips.split(','), i: 0, seen: false }));
  const show = (t) => {
    const c = t.clips[t.i];
    t.v.poster = 'gifs/' + c + '.webp';
    t.v.src = 'gifs/' + c + '.mp4';
    t.dots.forEach((d, n) => d.classList.toggle('is-on', n === t.i));
    if (t.seen) t.v.play().catch(() => {});
  };
  const next = (t) => { t.i = (t.i + 1) % t.clips.length; show(t); };
  state.forEach((t) => t.li.querySelector('.gif__screen').addEventListener('click', () => { t.seen = true; next(t); }));
  const wake = (t, on) => { t.seen = on; if (on) { if (!t.v.src) show(t); t.v.play().catch(() => {}); } else t.v.pause(); };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => wake(state.find((t) => t.li === e.target), e.isIntersecting)), { rootMargin: '150px' });
    state.forEach((t) => io.observe(t.li));
  } else state.forEach((t) => wake(t, true));
  let k = 0;
  setInterval(() => {
    if (document.hidden) return;
    const live = state.filter((t) => t.seen && !t.li.matches(':hover'));
    if (!live.length) return;
    next(live[k++ % live.length]);
  }, 1700);
})();

// Elara: a scripted conversation partner.
// Topics answer first, suggest follow-up questions, then ASK before moving the visitor anywhere.
// Small talk intents just answer. Every reply has variants so she never sounds canned.
(() => {
  const root = document.querySelector('[data-elara]');
  if (!root) return;
  const face = root.querySelector('[data-elara-face]');
  const log = root.querySelector('[data-elara-log]');
  const form = root.querySelector('[data-elara-form]');
  const input = form.querySelector('input');
  const chipBox = root.querySelector('[data-elara-chips]');
  const faces = { idle: 'img/elara_idle.webp', thinking: 'img/elara_thinking.webp', eureka: 'img/elara_happy.webp' };
  Object.values(faces).forEach((src) => { const i = new Image(); i.src = src; });
  const alts = { idle: 'Elara, idle', thinking: 'Elara, thinking', eureka: 'Elara, delighted' };
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOME = ['AI conversation design', 'Interactive prototypes', 'Content and design', 'Who is Dionna?'];
  const PROJECTS = [['PixelPlay', 'pixelplay'], ['Zine Room', 'zine'], ['Ho Ho Ahoy', 'cruise']];

  // ---- topics: intro variants, follow-ups (chip label + typed pattern + answer), and an offer ----
  const topics = [
    { id: 'ai', t: /^ai conversation design$|conversation design|\bai work\b|\bai (projects?|stuff|side)\b/, r: [
        'That\'s where I live. Dionna designs how AI talks: who it is, what it understands, and what it says when it\'s lost. She also teaches people how to judge what AI says.',
        'My favorite subject, since it includes me. She writes personas, intents and fallback lines, and she builds the rubrics that grade AI output.'],
      more: [
        { q: 'What\'s in that section?', m: /what'?s (in|there)|which projects|what projects/, a: 'Three pieces: me, her UX and AI consulting for CyFire.ai, and the rubrics she co-writes at gTech for judging AI-generated ads.' },
        { q: 'What is conversation design?', m: /what is conversation design|what does that mean|define/, a: 'Deciding what an AI says and how it says it. Its personality, what it understands, and what it does when it\'s confused. My fallback lines get read more than anything else, so she gave them extra care.' },
        { q: 'How do you judge AI?', m: /judge|grade|rubric/, a: 'With rubrics. At gTech she co-writes them, builds decision trees for the tricky cases, and runs calibration so 80+ raters score the same way.' }],
      offer: { q: ['Want me to take you to her AI work?', 'Shall I walk you down to that section?'], go: '#ai' } },

    { id: 'proto', t: /prototype|interactive|demos?\b|something (i can )?(click|play)|other projects/, r: [
        'She doesn\'t stop at mockups. There are three builds here you can actually play: PixelPlay, a design-learning app for girls 8 to 18. The Zine Room, a WebVR room for every love language. And Ho Ho Ahoy, a companion app for a group cruise.',
        'Prototypes! Bring snacks. Three real builds: PixelPlay teaches girls UX through games, the Zine Room lets you walk through a love language, and Ho Ho Ahoy runs a group cruise from your phone.'],
      ask: ['Which one should we start with?', 'Which one sounds the most fun?'],
      more: [
        { q: 'PixelPlay', to: 'pixelplay' },
        { q: 'Zine Room', to: 'zine' },
        { q: 'Ho Ho Ahoy', to: 'cruise' },
        { q: 'Help me pick', m: /help me pick|pick for me|which (one )?(first|should)|recommend|start with|can'?t decide/, stay: true, a: 'On a phone, start with Ho Ho Ahoy. On a laptop, PixelPlay. And if you want to wander around a very pink room, the Zine Room.' },
        { q: 'What does she build with?', m: /built with|build with|tools|tech|stack/, stay: true, a: 'HTML, CSS and JavaScript for most of it, A-Frame for the Zine Room, and Apps Script with Google Sheets behind the cruise app.' }],
      offer: { q: ['Want to see all three?'], go: '#prototypes' } },

    { id: 'content', t: /^content and design$|content and design|design work|branding|graphic design|social media|\blogos?\b/, r: [
        'The loops, the logos and the feeds. Years of GIFs at Tenor, her own short-form video, social design and freelance branding.',
        'This is the designer-first part. GIFs for Netflix and BET, social grids, brand kits and a whole magazine.'],
      more: [
        { q: 'Tell me about the GIFs', m: /gifs?|tenor/, a: 'At Tenor she cut partner video into GIFs, tagged every one for search and built partner pages to match each brand. Later she coordinated 25+ campaigns a quarter and wrote the team\'s style guide.' },
        { q: 'What branding has she done?', m: /brand|kit|freelance|logo/, a: 'Freelance since 2013: a cartoon persona for Joney Fieldz, a seal and brand kit for Warren County Community College, a full package for Explicit Box Co., and a 12-spread magazine. Each one opens as the full PDF.' },
        { q: 'Does she make videos?', m: /video|tiktok|sphere/, a: 'She\'s @soup_rat on TikTok, mostly funny stuff, and a review of the Sphere in Las Vegas is on its way.' }],
      offer: { q: ['Want to see it all?', 'Shall I show you the work?'], go: '#content' } },

    { id: 'about', t: /(what does|who is|tell me about) (dionna|she|her)|what do(es)? (she|dionna) do|about dionna|who'?s dionna|^who is dionna/, r: [
        'Dionna is a creative technologist. She designs AI conversations (hi), prototypes playful interfaces, and makes content people actually watch.',
        'Short version: designer first, systems thinker always. AI conversation design, UX prototypes and short-form content.'],
      more: [
        { q: 'What\'s she doing now?', m: /now|currently|job|work(ing)? at/, a: 'She\'s a Content Analyst at gTech via Highspring, where she evaluates AI-generated content, and she consults on UX and AI for CyFire.ai.' },
        { q: 'Where did she study?', m: /study|school|degree|smu|college|masters?/, a: 'An M.A. in Creative Technology from SMU, finished in May 2026, and a B.S. in Public Relations from Texas State.' },
        { q: 'Is she open to work?', m: /open to|hiring|hire|available|looking/, a: 'She is, for remote roles. AI conversation design, interactive prototyping and creative content are her sweet spots.' }],
      offer: { q: ['Want to meet her properly? Her About section has her photo and résumé.', 'Shall I take you to her About section?'], go: '#about' } },

    { id: 'cruise', t: /cruise|ho ?ho|ahoy|offline app|\bpwa\b/, r: [
        'Ho Ho Ahoy is the companion app Dionna built for a group Christmas cruise. Itinerary, RSVPs, a packing list and games, all in one place.',
        'Ahoy! It\'s a real app for a real trip: a Christmas cruise with her group, from Galveston to Progreso and Cozumel.'],
      more: [
        { q: 'Why did she build it?', m: /why/, a: 'The group ranges from about 22 to 60, and they needed real headcounts, plus-ones included, before sailing. So she built RSVPs that sync to one sheet.' },
        { q: 'Does it work at sea?', m: /sea|signal|offline|wifi|wi-fi|internet/, a: 'Yes. It installs from the browser and keeps working with no signal. RSVPs wait patiently and sync to a Google Sheet once someone\'s back online.' },
        { q: 'What games are in it?', m: /games?|bingo|trivia|fun/, a: 'Cruise bingo with photo proof, a scavenger hunt, holiday trivia, and Called It, where everyone locks in predictions that get revealed on the last night.' }],
      offer: { q: ['Would you like to play the demo?', 'Want to try it yourself? I can take you to the demo.'], go: '#hohoahoy', yes: 'Here it is. It\'s best on a phone, and nothing you type in the demo leaves your device.' } },

    { id: 'pixelplay', t: /pixel ?play|capstone|girls|dress.?up/, r: [
        'PixelPlay is Dionna\'s capstone: an app that teaches girls 8 to 18 UX design through games inspired by dress-up games.',
        'PixelPlay\'s big idea: design is a real way into tech, not just coding.'],
      more: [
        { q: 'Who is it for?', m: /who('s| is) it for|audience|ages?/, a: 'Girls 8 to 18 with strong visual skills who keep hearing that tech means coding. Three age tiers, so an 8-year-old and a 17-year-old both get the right challenge.' },
        { q: 'What do you do in it?', m: /what do (you|i)|how does it work|play it/, a: 'You design for client briefs, solve palette puzzles and build pages. One brief is a bakery that wants to feel cozy.' },
        { q: 'Is it accessible?', m: /accessib|a11y|disab/, a: 'That was the rule from day one: 44px touch targets, no time limits, no dark patterns. Accessibility goes in first, not last.' }],
      offer: { q: ['Want to play the prototype?', 'Shall I take you to it so you can play?'], go: '#pixelplay' } },

    { id: 'zine', t: /zine|\bvie\b|\bvr\b|love language|doja|a-?frame|immersive/, r: [
        'Vie was a concept for an immersive listening party, one room per love language. The Zine Room is the version she built in WebVR.',
        'Concept first, then build: Vie started on a board, and the Zine Room is where she made it real in A-Frame.'],
      more: [
        { q: 'What was Vie?', m: /what was vie|vie\b|concept|doja/, a: 'A listening-party concept for Doja Cat\'s album. Every love language got its own room, mood and color.' },
        { q: 'What can I do in there?', m: /what can i do|how does it work|inside/, a: 'Pick your love language, walk its room, and take a photo on your way out.' },
        { q: 'Do I need a headset?', m: /headset|vr goggles|quest|oculus|need/, a: 'Nope. It\'s built with A-Frame, so it runs right in your browser.' }],
      offer: { q: ['Want to step inside?', 'Shall I take you to the Zine Room?'], go: '#zine' } },

    { id: 'elara', t: /(how were you|how are you) (made|built)|who made you|are you (an? )?(ai|bot|real)|yourself|\belara\b/, r: [
        'I\'m scripted on purpose: topics, a few replies each so I don\'t repeat myself, a face for every mood, and fallback lines that send you somewhere useful.',
        'No model behind me, just careful conversation design. Dionna wrote my persona, my topics and my moods.'],
      more: [
        { q: 'Why script you?', m: /why script|why not (an? )?(ai|llm|model)|why/, a: 'Because the craft is the point. Every line was chosen, so I stay in character and never make things up about her.' },
        { q: 'What if you get stumped?', m: /stump|don'?t know|confus|fallback/, a: 'Then I say so and point you toward something I do know. A good fallback is a door, not a wall.' },
        { q: 'Is there more of you?', m: /more of you|original|full version|dnd|d&d|dungeon/, a: 'There is. The original me is a sidekick for Dungeon Masters, with spells, NPC names and three moods.' }],
      offer: { q: ['Want to meet the original me?', 'Shall I show you where I came from?'], go: '#elara-card' } },

    { id: 'cyfire', t: /cy ?fire|consult|startup|\bqa\b|bugs?\b/, r: [
        'Dionna consults on UX, UI and AI for CyFire.ai, a crisis-readiness platform. She joined at V2.',
        'At CyFire she finds the problems before users do, then writes up how to fix the experience around them.'],
      more: [
        { q: 'What did she work on?', m: /what did she|work on|do there/, a: 'QA passes, bug reports, an accessibility report and a page restructure, plus notes on their AI coach.' },
        { q: 'Did anything ship?', m: /ship|change|v3|implement/, a: 'Yes. V3 shipped with several of her suggestions, and the difference shows.' },
        { q: 'What about the AI coach?', m: /coach|ai\b|repeat/, a: 'It kept repeating itself. She suggested scripted replies or a token budget for variety, which is very much my department.' }],
      offer: { q: ['Want to see the V2 and V3 side by side?', 'Shall I take you to her CyFire work?'], go: '#cyfire' } },

    { id: 'gtech', t: /gtech|google|rubrics?|raters?|evaluat|calibrat|judg(e|ing) ai/, r: [
        'At gTech she co-writes the rubrics for judging AI-generated ads and runs calibration for more than 80 raters.',
        'She teaches people how to judge AI output consistently: decks, guidance docs, decision trees and plenty of edge cases.'],
      more: [
        { q: 'What does calibration mean?', m: /calibrat|mean/, a: 'Getting 80+ people to score the same thing the same way. She runs the sessions and settles the edge cases.' },
        { q: 'Did she build tools too?', m: /tools?|automat|build/, a: 'She did: Apps Script automations that cut manual coordination by 30%, and a web app that replaced a spreadsheet 50 people were editing at once.' }],
      offer: { q: ['Want to read more about it?', 'Shall I take you to that part of her work?'], go: '#rubrics' } },

    { id: 'tenor', t: /tenor|gifs?\b|netflix|\bbet\b|riot/, r: [
        'At Tenor, Dionna turned partner video into GIFs for Netflix, BET, Riot Games and lots of creators.',
        'She was making loops for Netflix before short-form was everyone\'s job.'],
      more: [
        { q: 'Which shows and movies?', m: /which|shows?|movies?|titles?/, a: 'Stranger Things, Bridgerton, Sabrina, Aggretsuko, Spider-Man, Venom, Talladega Nights and more. Fifteen titles on her GIF wall.' },
        { q: 'What else did she do there?', m: /what else|else|job|role/, a: 'Search tagging, partner pages that matched each brand, coordinating 25+ campaigns a quarter, and writing the team\'s style guide.' }],
      offer: { q: ['Want to see the GIF wall?', 'Shall I show you some of her GIFs?'], go: '#gifs' } },

    { id: 'tiktok', t: /tiktok|soup_?rat|\bvideos?\b|sphere|ugc/, r: [
        'She\'s @soup_rat on TikTok. Mostly funny, I\'m told.',
        'Short-form is her thing: GIFs at Tenor, and now her own videos.'],
      more: [
        { q: 'What\'s the Sphere review?', m: /sphere|review/, a: 'A review of the Sphere in Las Vegas, shot on her phone and cut for TikTok. It\'s coming soon.' }],
      offer: { q: ['Want to see a clip?', 'Shall I show you the Sphere footage?'], go: '#sphere' } },

    { id: 'contact', t: /hire|contact|email|reach|get in touch|work with|resume|résumé/, r: [
        'Send a raven, or just email dionnacymone@gmail.com. She\'s open to remote roles.',
        'The fastest route is email: dionnacymone@gmail.com. LinkedIn works too.'],
      more: [],
      offer: { q: ['Want me to open an email to her?'], href: 'mailto:dionnacymone@gmail.com?subject=Hi%20Dionna', yes: 'Opening your email now. She\'ll be glad you wrote.' } },
  ];

  // ---- small talk: answer and stay put ----
  const intents = [
    { t: /^(hi|hello|hey|well met|greetings|yo|hiya)\b/, r: [
      'Well met! Ask me what Dionna does, or about PixelPlay, Tenor or Ho Ho Ahoy.',
      'Hello, traveler. I can tell you about Dionna\'s work, or hand you an NPC name. Your pick.'] },
    { t: /your name|who are you/, r: [
      'I\'m Elara, an elf with a fondness for tidy campaign notes. Dionna designed me.',
      'Elara. Sidekick to Dungeon Masters, and today, tour guide to Dionna\'s work.'] },
    { t: /skill|software|figma|code|program/, r: [
      'HTML, CSS and JavaScript, Figma, Adobe Creative Cloud, Canva, Three.js, A-Frame and Apps Script.',
      'She prototypes in code, designs in Figma and Adobe, and automates the boring parts with Apps Script.'] },
    { t: /heal|cure|potion/, r: [
      'Healing Word for a quick save mid-combat, Cure Wounds when you need more. Or a potion, if the cleric is busy.',
      'Try Healing Word or Cure Wounds, or drink a healing potion from your pack.'] },
    { t: /npc|\bname (for|ideas?)/, r: [
      'Try Eldrin Thorne for a mysterious ranger, or Mara Bell for a witty tavern keeper.',
      'How about Jora Quickfoot for a friendly rogue, or Borin Ashmantle the smith?'] },
    { t: /thank|thanks|cool|nice|love (it|this)|awesome|amazing/, r: [
      'Happy to help. Dionna will be glad you stopped by.',
      'Anytime, adventurer. Ask me anything else.'] },
  ];
  const fallbacks = [
    'I don\'t have a script for that one. Try asking what Dionna does, or about PixelPlay, Ho Ho Ahoy or how I was made.',
    'That\'s beyond my scroll. I can talk about Dionna\'s projects, her skills, or how to reach her.',
    'Hmm, no answer for that yet. Want to hear about the Zine Room, or should I give you an NPC name?'];
  const NOs = ['No rush. What else can I tell you?', 'Of course. Ask me anything else.', 'Fair enough. I\'ll be right here.'];
  const YES = /^(y|ya|yes+|yeah|yep|yup|sure|ok(ay)?|please|absolutely|definitely|of course|go|let'?s (go|do it|see)|do it|why not|yes please)\b/;
  const NO = /^(no|nope|nah|not yet|not now|later|maybe later|i'?m good|stay)\b/;
  const MORE = /^(more|tell me more|go on|and\??$|what else|keep going|continue)/;
  const GOTO = /take me|show me|let me see|go there|try it|play (it|the demo)|open it|see it/;

  // ---- state ----
  let topic = null, asked = new Set(), offering = false, busy = false;
  const lastUsed = new Map();
  const pick = (key, list) => {
    if (!Array.isArray(list)) return list;
    let i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && lastUsed.get(key) === i) i = (i + 1) % list.length;
    lastUsed.set(key, i); return list[i];
  };
  const setMood = (m) => {
    if (face.getAttribute('src') === faces[m]) return;
    face.src = faces[m]; face.alt = alts[m];
    face.classList.remove('is-bounce'); void face.offsetWidth; face.classList.add('is-bounce');
  };
  const add = (text, who) => {
    const p = document.createElement('p');
    p.className = `msg msg--${who} is-new`; p.textContent = text;
    log.appendChild(p); log.scrollTop = log.scrollHeight;
  };
  const chips = (labels) => {
    chipBox.innerHTML = '';
    labels.forEach((l) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = l; if (l === 'Yes please') b.className = 'is-yes'; chipBox.appendChild(b); });
  };
  const left = () => topic ? topic.more.filter((f) => !asked.has(f.q)) : [];
  const spotlight = (sel) => {
    const el = document.querySelector(sel); if (!el) return;
    el.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' });
    const card = el.matches('article, .gifwall') ? el : null;
    if (card) { card.classList.remove('is-spot'); void card.offsetWidth; card.classList.add('is-spot'); setTimeout(() => card.classList.remove('is-spot'), 2600); }
  };

  // Each reply is a list of bubbles; the chips that follow depend on where the conversation is.
  // branch = the hub a project was opened from (only Prototypes for now), seen = projects already visited from it
  let branch = null, seen = new Set();
  const byId = (id) => topics.find((x) => x.id === id);
  const isProject = (id) => PROJECTS.some(([, pid]) => pid === id);
  const hubChips = () => {
    const rest = PROJECTS.filter(([, id]) => !seen.has(id)).map(([l]) => l);
    const extra = seen.size ? ['Show me all three'] : (asked.has('Help me pick') ? [] : ['Help me pick']);
    return [...rest, ...extra, 'Something else'];
  };
  const exitLabel = () => (branch ? 'Other projects' : 'Something else');
  const enter = (nt, fromHub) => {
    if (nt.id === 'proto') { if (branch !== 'proto') seen = new Set(); branch = 'proto'; }
    else if (fromHub || (branch === 'proto' && isProject(nt.id))) { branch = 'proto'; seen.add(nt.id); }
    else { branch = null; seen = new Set(); }
    topic = nt; asked = new Set(); offering = false;
    const say = [pick(nt.id, nt.r)];
    if (nt.ask) say.push(pick(nt.id + 'a', nt.ask));
    if (nt.id === 'proto') return { say, mood: 'eureka', chips: hubChips() };
    if (!nt.more.length) { offering = true; say.push(pick(nt.id + 'o', nt.offer.q)); return { say, mood: 'eureka', chips: ['Yes please', 'Not yet'] }; }
    return { say, mood: 'eureka', chips: [...nt.more.map((f) => f.q), exitLabel()] };
  };
  const backToHub = (line) => {
    const hub = byId('proto'); topic = hub; offering = false; asked = new Set();
    const rest = PROJECTS.filter(([, id]) => !seen.has(id));
    const say = [line || (rest.length ? pick('hub', ['Want to hear about another one?', 'Which one next?']) : 'That\'s all three. Want me to take you to them?')];
    if (!rest.length) offering = true;
    return { say, mood: 'eureka', chips: rest.length ? hubChips() : ['Yes please', 'Not yet'] };
  };

  const respond = (norm) => {
    // 1. answering Elara's own question
    if (offering && topic) {
      if (YES.test(norm) || GOTO.test(norm)) return accept();
      if (NO.test(norm)) {
        offering = false;
        if (branch === 'proto' && topic.id !== 'proto') return backToHub(PROJECTS.some(([, id]) => !seen.has(id)) ? pick('nohub', ['No rush. Want to hear about another one?', 'Sure thing. Which one next?']) : null);
        topic = null; branch = null; return { say: [pick('no', NOs)], mood: 'idle', chips: HOME };
      }
    }
    if (/^other projects$/.test(norm) && branch) return backToHub();
    if (/^something else$/.test(norm)) { topic = null; offering = false; branch = null; return { say: ['Sure. Pick a lane, or ask me anything.'], mood: 'idle', chips: HOME }; }
    // 2. a chip from the current topic, word for word
    const chip = topic && topic.more.find((x) => x.q.toLowerCase().replace(/[?!.]+$/, '') === norm);
    if (chip) return followUp(chip);
    // 3. a different topic, named outright
    const nt = topics.find((x) => x.t.test(norm));
    if (nt && (!topic || nt.id !== topic.id)) return enter(nt, topic && topic.id === 'proto' && isProject(nt.id));
    // 4. a typed follow-up on the current topic
    if (topic) {
      const f = topic.more.find((x) => x.m && x.m.test(norm));
      if (f) return followUp(f);
      if (MORE.test(norm)) { const n = left().find((x) => !x.to); if (n) return followUp(n); return offer(true); }
      if (GOTO.test(norm)) return accept();
      if (nt) return offer(false);
    }
    // 5. a follow-up that belongs to some other topic
    for (const x of topics) {
      const f = x.more.find((m) => m.m && m.m.test(norm) && m.m.source.length > 8);
      if (f && x !== topic) { topic = x; asked = new Set(); offering = false; branch = x.id === 'proto' ? 'proto' : null; return followUp(f); }
    }
    // 6. small talk
    const it = intents.find((x) => x.t.test(norm));
    if (it) return { say: [pick(intents.indexOf(it), it.r)], mood: 'eureka', chips: topic ? chipsFor() : HOME };
    return { say: [pick('fallback', fallbacks)], mood: 'idle', chips: topic ? chipsFor() : HOME };
  };
  const chipsFor = () => {
    if (topic && topic.id === 'proto') return offering ? ['Yes please', 'Not yet'] : hubChips();
    return offering ? ['Yes please', ...left().map((f) => f.q).slice(0, 2), 'Not yet'] : [...left().map((f) => f.q), exitLabel()];
  };
  const followUp = (f) => {
    if (f.to) return enter(byId(f.to), true);
    asked.add(f.q);
    if (f.stay) return { say: [f.a, pick('pickq', ['Which one sounds good?', 'Where should we start?'])], mood: 'eureka', chips: hubChips() };
    // after one follow-up, Elara offers to take you there
    offering = true;
    return { say: [f.a, pick(topic.id + 'o', topic.offer.q)], mood: 'eureka', chips: chipsFor() };
  };
  const offer = (noneLeft) => { offering = true; return { say: [noneLeft ? 'That\'s everything I know about it.' : '', pick(topic.id + 'o', topic.offer.q)].filter(Boolean), mood: 'eureka', chips: chipsFor() }; };
  const accept = () => {
    const o = topic.offer; topic = null; offering = false; branch = null; seen = new Set();
    const say = [o.yes || pick('go', ['Off we go. Scroll back up whenever you want to chat.', 'Right this way. I\'ll be up here if you need me.', 'Here you go. Come back and ask me anything.'])];
    return { say, mood: 'eureka', chips: HOME, after: () => { if (o.href) location.href = o.href; else spotlight(o.go); } };
  };

  const ask = (q) => {
    const text = q.trim(); if (!text || busy) return;
    busy = true; add(text, 'you'); setMood('thinking');
    const norm = text.toLowerCase().replace(/[’']/g, "'").replace(/[?!.]+$/, '').trim();
    const out = respond(norm);
    let delay = 650;
    out.say.forEach((line, i) => { setTimeout(() => { add(line, 'bot'); if (i === 0) setMood(out.mood); }, delay); delay += 900; });
    setTimeout(() => { chips(out.chips); busy = false; if (out.after) setTimeout(out.after, 500); }, delay - 600);
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); input.value = ''; });
  chipBox.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
  chips(HOME);
})();
