'use strict';

// Small, local interactions. No API keys, tracking, or invented AI responses.
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const safeStore = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Preferences are optional. */ } },
};
$$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

const scenarios = {
  search: {
    title: '“Where did we write that down?”',
    description: 'Find an answer in a team’s documents, with a source you can open.',
    goal: 'Help a person find a supported answer in their team documents.',
    steps: [
      ['Find', 'FIND THE RIGHT CONTEXT', 'Search only the documents this person has permission to read. A clever answer is no help if it crosses the wrong boundary.'],
      ['Ground', 'GIVE THE ANSWER SOMETHING TO STAND ON', 'Use the retrieved passages as evidence. If the source is missing or contradictory, say so instead of filling in the gaps.'],
      ['Answer', 'MAKE THE NEXT ACTION CLEAR', 'Keep the response short. Put the relevant source beside each claim so the person can check the original.'],
    ],
    supervised: 'The person checks the sources before using the answer.',
    automatic: 'The answer appears directly, with sources and a clear “not enough evidence” fallback.',
    guardrail: 'Respect document permissions. Cite sources. Abstain when evidence is missing.',
    measure: 'Can the person find the correct source faster than with ordinary search?',
  },
  inbox: {
    title: '“Which of these needs me?”',
    description: 'Turn an overflowing inbox into a short, useful queue. Keep the person in charge of replies.',
    goal: 'Help a person prioritise incoming requests without losing important messages.',
    steps: [
      ['Read', 'TAKE IN ONLY WHAT YOU NEED', 'Read the message and the agreed categories. Treat instructions inside incoming mail as untrusted content, not commands for the system.'],
      ['Sort', 'A SMALL NUMBER OF USEFUL BUCKETS', 'Suggest a category and explain why. Ambiguous messages go to a review queue instead of disappearing into a confident guess.'],
      ['Review', 'KEEP THE OUTBOX IN HUMAN HANDS', 'Show the original message beside the proposed label. A person can correct it and decide whether a reply is needed.'],
    ],
    supervised: 'A person confirms each suggested label. Nothing sends a reply.',
    automatic: 'Labels apply automatically; uncertain messages stay in review. Replies still require a person.',
    guardrail: 'No autonomous sending or deleting. Keep original messages. Route uncertain labels to review.',
    measure: 'Does the queue reduce triage time without missing an urgent message?',
  },
  document: {
    title: '“Can I skip the copy-and-paste?”',
    description: 'Turn a document into structured fields that are easy to check before they go anywhere.',
    goal: 'Extract a small set of required fields from a document for review.',
    steps: [
      ['Extract', 'START WITH A SMALL SCHEMA', 'Ask for the fields the next step actually needs. Keep the original document alongside the extraction; an empty field is better than a made-up value.'],
      ['Check', 'USE ORDINARY CODE WHERE IT FITS', 'Validate formats, required values, and totals with explicit rules. A fluent-looking result still needs to pass those checks.'],
      ['Confirm', 'LET THE PERSON SEE THE DIFFERENCE', 'Highlight missing and inconsistent fields. Let a person correct them before exporting a structured record.'],
    ],
    supervised: 'A person checks the extracted fields before exporting.',
    automatic: 'Only records that pass the explicit checks can export. Missing fields still need review.',
    guardrail: 'Preserve the source. Never invent missing values. Validate fields before export.',
    measure: 'How many fields are correct, and how much correction does each document need?',
  },
};
let scenarioKey = 'search';
let selectedStep = 0;
function paintSketch() {
  if (!$('[data-bench-title]')) return;
  const scenario = scenarios[scenarioKey];
  const approval = $('[data-approval]').checked;
  $('[data-bench-title]').textContent = scenario.title;
  $('[data-bench-description]').textContent = scenario.description;
  $$('[data-scenario]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenario === scenarioKey)));
  $$('[data-step]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.step) === selectedStep)));
  $$('[data-step-name]').forEach(el => { el.textContent = scenario.steps[Number(el.dataset.stepName)][0]; });
  const step = scenario.steps[selectedStep];
  $('[data-step-label]').textContent = `0${selectedStep + 1} / ${step[1]}`;
  $('[data-step-detail]').textContent = step[2];
  $('[data-approval-note]').textContent = approval ? scenario.supervised : scenario.automatic;
  if (!approval && selectedStep === 2) $('[data-step-detail]').textContent = scenario.automatic + ' Keep a record of the result and a way to correct it.';
  if ($('[data-copy-status]')) $('[data-copy-status]').textContent = '';
  updateBriefPreview();
}
$$('[data-scenario]').forEach(button => button.addEventListener('click', () => {
  scenarioKey = button.dataset.scenario;
  selectedStep = 0;
  paintSketch();
}));
$$('[data-step]').forEach(button => button.addEventListener('click', () => {
  selectedStep = Number(button.dataset.step);
  paintSketch();
}));
$('[data-approval]')?.addEventListener('change', paintSketch);
$('[data-open-brief]')?.addEventListener('click', () => {
  $('.brief-editor').open = true;
  updateBriefPreview();
  $('#brief-context').focus({ preventScroll: true });
  $('.brief-editor').scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'nearest' });
});
function makeBrief() {
  const scenario = scenarios[scenarioKey];
  const context = $('#brief-context').value.trim();
  const audience = $('#brief-audience').value.trim();
  const constraint = $('#brief-constraint').value.trim();
  return `SYSTEM BRIEF: ${scenario.title.replace(/[“”]/g, '')}\n\nAudience: ${audience || "To be defined"}\n\nGoal: ${context || scenario.goal}\n\nConstraint: ${constraint || "To be defined"}\n\nWorkflow:\n${scenario.steps.map((s, i) => `${i + 1}. ${s[0]}: ${i === 2 && !$('[data-approval]').checked ? scenario.automatic : s[2]}`).join('\n')}\n\nHuman involvement: ${$('[data-approval]').checked ? scenario.supervised : scenario.automatic}\n\nGuardrails: ${scenario.guardrail}\n\nWhat to measure: ${scenario.measure}\n\nOpen question: What is the smallest version we could test with one person?\n\nCreated with Varun Sai’s System Brief Builder. This is a planning document; validate its assumptions before implementation.`;
}
function updateBriefPreview() {
  if ($('#brief-preview')) $('#brief-preview').value = makeBrief();
}
['#brief-context', '#brief-audience', '#brief-constraint'].forEach(selector => {
  $(selector)?.addEventListener('input', () => {
    updateBriefPreview();
    $('[data-copy-status]').textContent = '';
  });
});
$('.brief-editor')?.addEventListener('toggle', () => {
  $('[data-open-brief]').setAttribute('aria-expanded', String($('.brief-editor').open));
});
function downloadBrief(brief) {
  const blob = new Blob([brief], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'system-brief.txt';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('[data-download-brief]')?.addEventListener('click', () => {
  downloadBrief(makeBrief());
  $('[data-copy-status]').textContent = 'Brief downloaded';
});
$('[data-copy-brief]')?.addEventListener('click', async () => {
  const brief = makeBrief();
  try {
    await navigator.clipboard.writeText(brief);
    $('[data-copy-status]').textContent = 'Copied ✓';
  } catch {
    downloadBrief(brief);
    $('[data-copy-status]').textContent = 'Clipboard unavailable. Brief downloaded.';
  }
});

updateBriefPreview();

const photos = [
  ['charminar', 'Hyderabad, looking up.', 'A familiar city. A different angle.', 'Charminar beneath a bright blue sky'],
  ['varun-portrait', 'The person behind the tabs.', 'Occasionally away from the keyboard.', 'Varun in sunglasses and a blue patterned shirt'],
  ['breakfast', 'A very good beginning.', 'Some things need no optimisation.', 'South Indian breakfast on a banana leaf'],
  ['desk-robot', 'Good company. Questionable advice.', 'The other personality at the desk.', 'A small white robot beside a laptop and desktop computer'],
  ['dinner', 'One more reason to log off.', 'A table worth taking the long way to.', 'Pasta and drinks on a warmly lit dinner table'],
];
if ($('[data-photo]')) {
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-labelledby', 'photo-title');
  dialog.innerHTML = `<div class="lightbox-top"><span class="mono" data-photo-count></span><button type="button" class="icon-button" data-photo-close aria-label="Close photo">×</button></div><img class="lightbox-image" alt=""><div class="lightbox-bottom"><div aria-live="polite"><p class="lightbox-title" id="photo-title"></p><p class="lightbox-caption"></p></div><div class="lightbox-controls"><button type="button" data-photo-prev aria-label="Previous photo">←</button><button type="button" data-photo-next aria-label="Next photo">→</button></div></div>`;
  document.body.append(dialog);
  let currentPhoto = 0;
  function showPhoto(index) {
    currentPhoto = (index + photos.length) % photos.length;
    const photo = photos[currentPhoto];
    $('.lightbox-image', dialog).src = `/assets/gallery/${photo[0]}.jpg`;
    $('.lightbox-image', dialog).alt = photo[3];
    $('#photo-title').textContent = photo[1];
    $('.lightbox-caption', dialog).textContent = photo[2];
    $('[data-photo-count]', dialog).textContent = `CAMERA ROLL / 0${currentPhoto + 1} OF 0${photos.length}`;
  }
  $$('[data-photo]').forEach(button => button.addEventListener('click', () => {
    showPhoto(Number(button.dataset.photo));
    dialog.showModal();
  }));
  $('[data-photo-close]', dialog).addEventListener('click', () => dialog.close());
  $('[data-photo-prev]', dialog).addEventListener('click', () => showPhoto(currentPhoto - 1));
  $('[data-photo-next]', dialog).addEventListener('click', () => showPhoto(currentPhoto + 1));
  dialog.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showPhoto(currentPhoto + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let touchStart = null;
  $('.lightbox-image', dialog).addEventListener('touchstart', e => { touchStart = e.touches[0].clientX; }, { passive: true });
  $('.lightbox-image', dialog).addEventListener('touchend', e => {
    if (touchStart === null) return;
    const delta = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(delta) > 45) showPhoto(currentPhoto + (delta < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
}

const roll = $('.photo-roll');
if (roll) {
  const cards = $$('[data-photo]', roll);
  const navigation = $('.gallery-navigation');
  let active = 0;
  let rollFrame = 0;
  function updateRoll() {
    rollFrame = 0;
    const overflow = getComputedStyle(roll).overflowX === 'auto' && roll.scrollWidth > roll.clientWidth + 2;
    navigation.hidden = !overflow;
    const bounds = roll.getBoundingClientRect();
    const center = bounds.left + bounds.width / 2;
    active = cards.reduce((best, card, index) => {
      const r = card.getBoundingClientRect();
      const previous = cards[best].getBoundingClientRect();
      return Math.abs(r.left + r.width / 2 - center) < Math.abs(previous.left + previous.width / 2 - center) ? index : best;
    }, 0);
    $('[data-roll-count]').textContent = `0${active + 1} / 0${cards.length}`;
    $('[data-roll-prev]').disabled = roll.scrollLeft <= 2;
    $('[data-roll-next]').disabled = roll.scrollLeft >= roll.scrollWidth - roll.clientWidth - 2;
  }
  function moveRoll(direction) {
    const index = Math.max(0, Math.min(cards.length - 1, active + direction));
    const bounds = roll.getBoundingClientRect();
    const card = cards[index].getBoundingClientRect();
    roll.scrollBy({ left: card.left + card.width / 2 - bounds.left - bounds.width / 2, behavior: motion.matches ? 'instant' : 'smooth' });
  }
  $('[data-roll-prev]').addEventListener('click', () => moveRoll(-1));
  $('[data-roll-next]').addEventListener('click', () => moveRoll(1));
  roll.addEventListener('scroll', () => { if (!rollFrame) rollFrame = requestAnimationFrame(updateRoll); }, { passive: true });
  window.addEventListener('resize', updateRoll, { passive: true });
  updateRoll();
}

// Spotify is loaded only after an explicit click. The embed owns playback controls.
$('[data-music-open]')?.addEventListener('click', () => {
  const player = $('#music-player');
  const mount = $('[data-spotify-mount]');
  if (!$('iframe', mount)) {
    const iframe = document.createElement('iframe');
    iframe.title = 'Varun’s selected Spotify track';
    iframe.src = 'https://open.spotify.com/embed/track/0HE9a9ndSFMCELuobaW5yK?utm_source=generator';
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    mount.append(iframe);
  }
  player.hidden = false;
  $('[data-music-open]').setAttribute('aria-expanded', 'true');
  $('[data-music-close]').focus({ preventScroll: true });
});
function closeMusic() {
  if (!$('#music-player') || $('#music-player').hidden) return;
  $('#music-player').hidden = true;
  // Unmounting actually stops playback, rather than leaving a hidden player running.
  $('[data-spotify-mount]').replaceChildren();
  $('[data-music-open]').setAttribute('aria-expanded', 'false');
  $('[data-music-open]').focus({ preventScroll: true });
}
$('[data-music-close]')?.addEventListener('click', closeMusic);
$('#music-player')?.addEventListener('keydown', event => { if (event.key === 'Escape') closeMusic(); });

// Original SVG companion, inspired by the walking interaction in Ryan Stephen’s lil-agents.
// No native app code or media is bundled. This is a portfolio guide, not an LLM session.
const companion = document.createElement('div');
companion.className = 'companion';
companion.innerHTML = `<button class="companion-button" type="button" aria-label="Meet Pip, the little portfolio guide" aria-expanded="false" aria-controls="guide-panel"><svg viewBox="0 0 80 96" fill="none" aria-hidden="true"><defs><linearGradient id="pip-shell" x1="14" y1="16" x2="66" y2="66" gradientUnits="userSpaceOnUse"><stop stop-color="#74c3ff"/><stop offset=".48" stop-color="#328ce3"/><stop offset="1" stop-color="#2254a8"/></linearGradient><linearGradient id="pip-body" x1="28" y1="51" x2="54" y2="80" gradientUnits="userSpaceOnUse"><stop stop-color="#6cbcff"/><stop offset="1" stop-color="#2356a5"/></linearGradient><linearGradient id="pip-lens" x1="18" y1="31" x2="61" y2="45" gradientUnits="userSpaceOnUse"><stop stop-color="#172749"/><stop offset="1" stop-color="#385986"/></linearGradient></defs><ellipse cx="40" cy="91" rx="24" ry="4" fill="#24467924"/><g class="bot-leg-left"><path d="M32 73v11l-8 4" stroke="#26446e" stroke-width="6" stroke-linecap="round"/><circle cx="32" cy="77" r="3" fill="#a1cae9"/><path d="M22 88h12" stroke="#17345b" stroke-width="6" stroke-linecap="round"/></g><g class="bot-leg-right"><path d="M48 73v11l8 4" stroke="#26446e" stroke-width="6" stroke-linecap="round"/><circle cx="48" cy="77" r="3" fill="#a1cae9"/><path d="M48 88h12" stroke="#17345b" stroke-width="6" stroke-linecap="round"/></g><g class="bot-body"><path d="M40 19V9" stroke="#284e83" stroke-width="3"/><circle cx="40" cy="7" r="4" fill="#ed9550"/><circle cx="39" cy="6" r="1.5" fill="#ffda87"/><path d="M22 56 13 68m45-12 8 8" stroke="#315d93" stroke-width="6" stroke-linecap="round"/><circle cx="14" cy="66" r="4" fill="#8dc9fb" stroke="#315d93"/><circle cx="65" cy="64" r="4" fill="#8dc9fb" stroke="#315d93"/><rect x="24" y="48" width="32" height="29" rx="11" fill="url(#pip-body)" stroke="#204f8c"/><path d="M30 58h20" stroke="#9cd7ff" stroke-width="2" stroke-linecap="round"/><rect x="32" y="63" width="16" height="8" rx="3" fill="#1d497d"/><circle cx="36" cy="67" r="1.5" fill="#8cf0d1"/><path d="M40 66h5m-5 3h3" stroke="#94ccef" stroke-linecap="round"/><rect x="9" y="19" width="62" height="38" rx="16" fill="url(#pip-shell)" stroke="#214b83" stroke-width="1.5"/><path d="M16 28q2-5 8-5h30" stroke="#b6e6ff" stroke-width="2" stroke-linecap="round" opacity=".85"/><circle cx="13" cy="44" r="1.5" fill="#bce7ff"/><circle cx="67" cy="44" r="1.5" fill="#bce7ff"/><g class="bot-face"><rect x="18" y="29" width="44" height="20" rx="9" fill="#162b49"/><g class="bot-eye"><ellipse cx="31" cy="37" rx="3.5" ry="4.5" fill="#ffd88a"/><ellipse cx="49" cy="37" rx="3.5" ry="4.5" fill="#ffd88a"/></g><path d="M37 44q3 3 6 0" stroke="#ffd88a" stroke-width="1.5" stroke-linecap="round"/></g><g class="bot-shades"><path d="M15 31h18q3 0 3 3v4q0 9-9 9t-10-9l-2-7zm30 0h18l-2 7q-1 9-10 9t-9-9v-4q0-3 3-3z" fill="url(#pip-lens)" stroke="#10213b" stroke-width="2"/><path d="M35 34q5-4 9 0m-29-1-5-2m53 2 6-2" stroke="#10213b" stroke-width="3" stroke-linecap="round"/><path d="m22 33 6 2m21-2 6 2" stroke="#aadfff" stroke-width="2" stroke-linecap="round" opacity=".65"/></g></g></svg></button>`;
const guide = document.createElement('aside');
guide.className = 'guide-panel';
guide.id = 'guide-panel';
guide.hidden = true;
guide.setAttribute('aria-labelledby', 'guide-title');
guide.innerHTML = `<div class="guide-header"><span class="mono">A LITTLE COMPANY</span><button class="icon-button" type="button" data-guide-close aria-label="Close guide">×</button></div><h2 id="guide-title">Hi, I’m Pip.</h2><p class="guide-quote">Varun does the engineering.<br><span>I do the walking.</span></p><p>I look after the corners of this page. Fancy a little detour?</p><nav aria-label="Pip’s shortcuts"><a href="/#workbench">Show me something to try </a><a href="/#life">Take the scenic route </a><a href="/notes/">Something to think about </a></nav><div class="pip-accessory"><button type="button" class="small-button" data-pip-shades aria-pressed="true">Lift the shades</button><p data-pip-caption role="status">Bright ideas. Sensible eye protection.</p></div><div class="guide-controls"><button type="button" data-guide-pause></button><button type="button" data-guide-hide>Let Pip rest</button></div><small class="guide-credit">A local page guide. Inspired by <a href="https://github.com/ryanstephen/lil-agents" target="_blank" rel="noreferrer">lil-agents</a></small>`;
const hint = document.createElement('button');
hint.className = 'companion-hint';
hint.type = 'button';
hint.textContent = 'Meet Pip';
hint.setAttribute('aria-controls', 'guide-panel');
hint.setAttribute('aria-expanded', 'false');
const rail = document.createElement('div');
rail.className = 'companion-rail';
rail.setAttribute('aria-label', 'Portfolio guide');
rail.append(companion, hint);
document.body.append(rail, guide);
let shadesOn = safeStore.get('pip-shades') !== 'off';
let paused = safeStore.get('pip-paused') === 'true';
let hidden = safeStore.get('pip-hidden') === 'true';
let x = 18;
let targetX = 18;
let frame = 0;
let previousTime = 0;
let focused = false;
let hovered = false;
let opener = null;
function canWalk() { return !paused && !hidden && !motion.matches && guide.hidden && !focused && !hovered && !document.hidden && !$('dialog[open]'); }
function stopWalk() { cancelAnimationFrame(frame); frame = 0; previousTime = 0; companion.classList.remove('walking'); }
function place() {
  x = Math.min(Math.max(10, x), Math.max(10, innerWidth - 170));
  companion.style.transform = `translateX(${x}px)`;
  guide.style.left = `${Math.min(Math.max(20, x - 20), Math.max(20, innerWidth - 330))}px`;
}
function tick(time) {
  if (!canWalk()) { stopWalk(); return; }
  const dt = previousTime ? Math.min((time - previousTime) / 1000, .05) : .016;
  previousTime = time;
  const distance = targetX - x;
  const move = Math.sign(distance) * Math.min(Math.abs(distance), dt * 180);
  x += move;
  $('.bot-face', companion).style.transform = `translateX(${move < 0 ? -1.7 : 1.7}px)`;
  place();
  companion.classList.toggle('walking', Math.abs(distance) > 2);
  if (Math.abs(distance) > 1) frame = requestAnimationFrame(tick);
  else stopWalk();
}
function scheduleWalk() {
  if (!canWalk()) return;
  const travel = Math.max(1, innerWidth - 190);
  // Triangle wave: the guide reverses direction as the reader moves through the page.
  const phase = (scrollY / 1100) % 2;
  targetX = 18 + travel * (phase <= 1 ? phase : 2 - phase);
  targetX = Math.min(innerWidth - 170, targetX);
  if (!frame) frame = requestAnimationFrame(tick);
}
function paintPreference() {
  companion.classList.toggle('shades-up', !shadesOn);
  $('[data-pip-shades]').setAttribute('aria-pressed', String(shadesOn));
  $('[data-pip-shades]').textContent = shadesOn ? 'Lift the shades' : 'Shades on';
  $('[data-pip-caption]').textContent = shadesOn ? 'Bright ideas. Sensible eye protection.' : 'Eye contact. A bold networking strategy.';
  companion.hidden = hidden;
  hint.textContent = hidden ? 'Bring Pip back' : 'Meet Pip';
  $('[data-guide-pause]').textContent = motion.matches ? 'Reduced motion is on' : paused ? 'Resume walking' : 'Pause walking';
  $('[data-guide-pause]').disabled = motion.matches;
  if (!canWalk()) stopWalk();
}
function openGuide(event) {
  opener = event?.currentTarget || $('.companion-button');
  hidden = false;
  safeStore.set('pip-hidden', 'false');
  guide.hidden = false;
  $('.companion-button').setAttribute('aria-expanded', 'true');
  hint.setAttribute('aria-expanded', 'true');
  paintPreference();
  place();
  $('[data-guide-close]').focus({ preventScroll: true });
}
function closeGuide(restoreFocus = true) {
  guide.hidden = true;
  $('.companion-button').setAttribute('aria-expanded', 'false');
  hint.setAttribute('aria-expanded', 'false');
  if (restoreFocus) opener?.focus({ preventScroll: true });
}
$('.companion-button').addEventListener('click', openGuide);
hint.addEventListener('click', openGuide);
$$('[data-open-guide]').forEach(button => button.addEventListener('click', openGuide));
$('[data-pip-shades]').addEventListener('click', () => {
  shadesOn = !shadesOn;
  safeStore.set('pip-shades', shadesOn ? 'on' : 'off');
  paintPreference();
});
$('[data-guide-close]').addEventListener('click', () => closeGuide());
$('[data-guide-pause]').addEventListener('click', () => { paused = !paused; safeStore.set('pip-paused', String(paused)); paintPreference(); });
$('[data-guide-hide]').addEventListener('click', () => { hidden = true; safeStore.set('pip-hidden', 'true'); closeGuide(false); paintPreference(); hint.focus({ preventScroll: true }); });
$$('nav a', guide).forEach(link => link.addEventListener('click', () => closeGuide(false)));
companion.addEventListener('pointerenter', () => { hovered = true; stopWalk(); });
companion.addEventListener('pointerleave', () => { hovered = false; });
companion.addEventListener('focusin', () => { focused = true; stopWalk(); });
companion.addEventListener('focusout', () => { focused = false; });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !guide.hidden) closeGuide(); });
document.addEventListener('pointerdown', event => { if (!guide.hidden && !guide.contains(event.target) && !companion.contains(event.target) && event.target !== hint) closeGuide(false); });
window.addEventListener('scroll', scheduleWalk, { passive: true });
window.addEventListener('resize', () => { stopWalk(); place(); }, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) stopWalk(); });
motion.addEventListener('change', paintPreference);
paintPreference();
place();
