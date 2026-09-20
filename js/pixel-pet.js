import { createPlayground } from './pet-playground.js';
import { watchPetSections } from './pet-sections.js';
import { createCatSounds } from './pet-voice.js';

// Edit the cat's section introductions here. #projects contains credentials;
// #experience contains the portfolio's actual project work.
const SECTION_MESSAGES = {
  '.hero': "Hi, I'm your little tour guide! Meet Neil, an IT graduate who loves building useful things.",
  '#about': "Let's get to know Neil! This section shares his approach to building thoughtful, user-friendly software.",
  '#skills': "Welcome to Neil's Tech Stack Universe! Explore the languages, frameworks, and tools he works with.",
  '#projects': "These are Neil's education and credentials! Take a peek at his IT background, certifications, and continued learning.",
  '#experience': "Here's where ideas become real projects! Explore what Neil built, the tools he used, and the features he worked on.",
  '#contact': "Have a project or opportunity in mind? This is the place to send Neil a message. I'll let you do the talking!"
};

// Self-contained pixel artwork: no downloads, libraries, or image requests.
const CAT = `<svg viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
  <ellipse class="pet-shadow" cx="16" cy="30" rx="10" ry="1"/>
  <g class="pet-body">
    <path class="pet-tail" fill="var(--pet-outline)" d="M23 23h4v-7h2v-3h2v8h-2v4h-6z"/>
    <path fill="var(--pet-outline)" d="M8 17h15v3h2v9h-3v1h-5v-2h-3v2H7v-3H6v-7h2z"/>
    <path fill="var(--pet-fur)" d="M10 18h11v3h2v6h-4v-3h-7v3H8v-6h2z"/>
    <path class="pet-foot pet-foot-left" fill="var(--pet-fur)" d="M8 26h5v3H8z"/>
    <path class="pet-foot pet-foot-right" fill="var(--pet-fur)" d="M18 26h5v3h-5z"/>
    <g class="pet-head">
      <path fill="var(--pet-outline)" d="M5 3h3v2h3v2h9V5h3V3h3v16h-2v3H7v-3H5z"/>
      <path fill="var(--pet-fur)" d="M7 6h2v3h13V7h2v11h-2v2H9v-2H7z"/>
      <path fill="var(--accent)" d="M7 6h2v3H7zm15 1h2v3h-2z"/>
      <path class="pet-eyes" fill="var(--pet-outline)" d="M10 12h2v3h-2zm10 0h2v3h-2z"/>
      <path class="pet-closed-eyes" fill="var(--pet-outline)" d="M9 14h4v1H9zm10 0h4v1h-4z"/>
      <path fill="var(--accent)" d="M8 16h3v1H8zm13 0h3v1h-3z" opacity=".6"/>
      <path fill="var(--pet-outline)" d="M15 15h2v1h-2zm-1 2h1v1h-1zm3 0h1v1h-1zm-2 1h2v1h-2z"/>
      <path fill="var(--accent)" d="M9 20h13v2H9z"/>
      <path fill="var(--pet-outline)" d="M15 21h3v3h-3z"/>
      <path fill="var(--accent)" d="M16 22h1v1h-1z"/>
    </g>
  </g>
  <path class="pet-heart" fill="var(--accent)" d="M25 4h2v1h1V4h2v3h-1v1h-1v1h-1V8h-1V7h-1z"/>
  <text class="pet-zzz" x="24" y="9" fill="var(--accent)" font-size="7" font-family="monospace">z</text>
</svg>`;

export function mountPixelPet({ projects = '#experience', contact = '#contact', storageKey = 'portfolio-pixel-pet' } = {}) {
  if (document.querySelector('.pixel-pet')) return;
  const controller = new AbortController();
  const on = (target, event, handler) => target.addEventListener(event, handler, { signal: controller.signal });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const voice = createCatSounds();
  let preferences = { hidden: false, muted: false, voiceMuted: true };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    preferences = { hidden: saved?.hidden === true, muted: saved?.muted === true, voiceMuted: saved?.voiceMuted !== false };
  } catch { /* Storage may be disabled; the companion still works. */ }
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(preferences)); } catch {} };
  const root = document.createElement('aside');
  root.className = 'pixel-pet';
  root.setAttribute('aria-label', 'Pixel cat companion');
  root.innerHTML = `<div class="pet-companion">
    <div class="pet-bubble" role="status" aria-live="polite" hidden></div>
    <div class="pet-panel" id="pixel-pet-panel" aria-label="Cat actions" hidden>
      <span class="pet-panel-title">YOUR LITTLE COMPANION</span>
      <a data-action="projects">View Projects <span aria-hidden="true">↗</span></a>
      <a data-action="contact">Contact Me <span aria-hidden="true">↗</span></a>
      <button type="button" data-action="mute" aria-pressed="false">Mute Messages</button>
      <button type="button" data-action="voice">Unmute Sounds</button>
      <button type="button" data-action="hide">Hide Pet</button>
      <p>Drag me, or focus me and use the arrow keys.</p>
    </div>
    <button type="button" class="pet-cat" aria-label="Say hello to the cat. Drag or use arrow keys to move." title="Say hello · drag to move">${CAT}</button>
    <button type="button" class="pet-menu-toggle" aria-label="Cat options" aria-expanded="false" aria-controls="pixel-pet-panel">···</button>
  </div>
  <button type="button" class="pet-restore" aria-label="Show pixel cat" title="Bring back your companion" hidden>${CAT}<span>show cat</span></button>`;
  document.body.append(root);
  const companion = root.querySelector('.pet-companion');
  const cat = root.querySelector('.pet-cat');
  const toggle = root.querySelector('.pet-menu-toggle');
  const panel = root.querySelector('.pet-panel');
  const bubble = root.querySelector('.pet-bubble');
  const restore = root.querySelector('.pet-restore');
  const mute = root.querySelector('[data-action="mute"]');
  const voiceToggle = root.querySelector('[data-action="voice"]');
  function updateVoiceToggle() {
    voiceToggle.disabled = !voice.supported;
    voiceToggle.textContent = !voice.supported ? 'Sounds unavailable' : preferences.voiceMuted ? 'Unmute Sounds' : 'Mute Sounds';
    voiceToggle.title = !voice.supported ? 'This browser does not support cat sounds.' :
      preferences.voiceMuted ? 'Hear little meows from the cat' : 'Turn off meows and keep text messages';
  }
  updateVoiceToggle();
  root.querySelector('[data-action="projects"]').setAttribute('href', projects);
  root.querySelector('[data-action="contact"]').setAttribute('href', contact);
  let bubbleTimer, stateTimer, drag, suppressClick = false;
  let x = 0, y = 0, tick = 0;
  let playground, sectionGuide, hovering = false;
  const isBusy = () => document.hidden || preferences.hidden || motion.matches || drag || hovering ||
    !panel.hidden || !bubble.hidden || root.contains(document.activeElement) ||
    document.activeElement?.matches('input, textarea, select, [contenteditable="true"]');
  function stopRoaming() { playground?.stop(); }
  function scheduleRoaming(delay = 6500) { playground?.schedule(delay); }
  function bounds() {
    const viewport = window.visualViewport;
    return { left: viewport?.offsetLeft || 0, top: viewport?.offsetTop || 0,
      width: viewport?.width || innerWidth, height: viewport?.height || innerHeight };
  }
  function place(nextX, nextY) {
    const v = bounds();
    const width = root.offsetWidth, height = root.offsetHeight;
    x = Math.max(v.left + 12, Math.min(nextX, v.left + v.width - width - 12));
    y = Math.max(v.top + 12, Math.min(nextY, v.top + v.height - height - 12));
    root.style.left = `${Math.round(x)}px`;
    root.style.top = `${Math.round(y)}px`;
    // Independently clamp floating UI, even when the cat sits against an edge.
    const panelWidth = Math.min(224, v.width - 24);
    root.style.setProperty('--pet-panel-width', `${panelWidth}px`);
    root.style.setProperty('--pet-panel-left', `${Math.max(v.left + 12, Math.min(x + width - panelWidth, v.left + v.width - panelWidth - 12)) - x}px`);
    const above = y - v.top;
    const below = v.top + v.height - y - height;
    const showBelow = above < 280 && below > above;
    root.classList.toggle('pet-panel-below', showBelow);
    root.style.setProperty('--pet-panel-max-height', `${Math.max(40, (showBelow ? below : above) - 20)}px`);
  }
  function dock() {
    const v = bounds();
    place(v.left + v.width - root.offsetWidth - 20, v.top + v.height - root.offsetHeight - 20);
  }
  function state(name = 'idle', duration = 0) {
    clearTimeout(stateTimer);
    root.dataset.state = name;
    if (duration) stateTimer = setTimeout(() => state(), duration);
  }
  function silence() { clearTimeout(bubbleTimer); voice.stop(); bubble.hidden = true; bubble.textContent = ''; }
  function say(message, duration = 5500) {
    if (preferences.muted || preferences.hidden || !panel.hidden) return;
    silence();
    bubble.setAttribute('aria-live', 'polite');
    bubble.textContent = message;
    bubble.hidden = false;
    if (!preferences.voiceMuted && voice.ready) voice.meow();
    bubbleTimer = setTimeout(silence, duration);
  }
  function menu(open, focus = false) {
    stopRoaming();
    scheduleRoaming();
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    silence();
    state();
    place(x, y);
    if (focus) (open ? panel.querySelector('a') : toggle).focus({ preventScroll: true });
    if (!open) sectionGuide?.refresh();
  }
  function visibility(hidden, focus = false) {
    preferences.hidden = hidden;
    companion.hidden = hidden;
    restore.hidden = !hidden;
    menu(false);
    state();
    playground?.release();
    dock();
    save();
    if (focus) (hidden ? restore : cat).focus({ preventScroll: true });
  }
  playground = createPlayground({ root, cat, position: () => ({ x, y }), bounds, place, state, busy: isBusy });
  mute.setAttribute('aria-pressed', String(preferences.muted));
  visibility(preferences.hidden);
  sectionGuide = watchPetSections(Object.entries(SECTION_MESSAGES).flatMap(([selector, message]) => {
    const element = document.querySelector(selector);
    return element ? [{ element, message }] : [];
  }), message => {
    if (preferences.hidden || preferences.muted || motion.matches || drag || !panel.hidden ||
      document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')) return false;
    stopRoaming();
    state();
    say(message, 8500);
    scheduleRoaming(8800);
    return true;
  });
  on(cat, 'click', () => {
    if (suppressClick) { suppressClick = false; return; }
    voice.unlock();
    menu(false);
    state('happy', 950);
    say('Hi! Welcome to my portfolio!');
  });
  on(toggle, 'click', () => menu(panel.hidden, true));
  on(mute, 'click', () => {
    preferences.muted = !preferences.muted;
    mute.setAttribute('aria-pressed', String(preferences.muted));
    silence();
    save();
    sectionGuide.refresh();
  });
  on(voiceToggle, 'click', () => {
    voice.unlock();
    preferences.voiceMuted = !preferences.voiceMuted;
    voice.stop();
    updateVoiceToggle();
    save();
    if (!preferences.voiceMuted) {
      menu(false);
      say('Meow! Cat sounds are on. You can mute them in Cat options.');
    }
  });
  on(root.querySelector('[data-action="hide"]'), 'click', () => visibility(true, true));
  on(restore, 'click', () => visibility(false, true));
  for (const link of panel.querySelectorAll('a')) on(link, 'click', () => {
    menu(false);
    const id = link.getAttribute('href');
    const target = id.startsWith('#') ? document.getElementById(id.slice(1)) : null;
    if (target) {
      const heading = target.querySelector('h2') || target;
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      on(heading, 'blur', () => heading.removeAttribute('tabindex'));
    }
  });
  on(document, 'pointerdown', event => { if (!root.contains(event.target) && !panel.hidden) menu(false); });
  on(root, 'focusout', event => { if (!root.contains(event.relatedTarget)) menu(false); });
  on(root, 'keydown', event => {
    if (event.key === 'Escape') { menu(false, !panel.hidden); silence(); }
  });
  on(cat, 'keydown', event => {
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!directions[event.key]) return;
    event.preventDefault();
    menu(false);
    playground.release();
    const [dx, dy] = directions[event.key];
    place(x + dx * (event.shiftKey ? 32 : 12), y + dy * (event.shiftKey ? 32 : 12));
    state('walking', 400);
  });
  on(cat, 'pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    stopRoaming();
    suppressClick = false;
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x, y, moved: false };
    cat.setPointerCapture(event.pointerId);
  });
  on(cat, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;
    playground.release();
    menu(false);
    root.classList.add('pet-dragging');
    state('walking');
    place(drag.x + dx, drag.y + dy);
  });
  function endDrag() {
    if (!drag) return;
    suppressClick = drag.moved;
    drag = null;
    root.classList.remove('pet-dragging');
    state();
    sectionGuide.refresh();
  }
  on(cat, 'pointerup', endDrag);
  on(cat, 'pointercancel', endDrag);
  on(cat, 'lostpointercapture', endDrag);
  on(root, 'pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    stopRoaming();
  });
  on(root, 'pointerleave', () => { hovering = false; scheduleRoaming(); });
  on(root, 'focusin', () => stopRoaming());
  on(motion, 'change', () => { stopRoaming(); silence(); state(); scheduleRoaming(); sectionGuide.refresh(); });
  on(document, 'focusout', () => sectionGuide.refresh());
  on(document, 'visibilitychange', () => {
    stopRoaming();
    root.classList.toggle('pet-paused', document.hidden);
    if (document.hidden) { silence(); state(); }
    else scheduleRoaming(2500);
  });
  // Brief activity every 12 seconds; messages at most once every 96 seconds.
  const interval = setInterval(() => {
    if (isBusy() || playground.active || root.dataset.state === 'sleeping' || root.dataset.state === 'sitting') return;
    tick++;
    if (!motion.matches) {
      const activity = ['blinking', 'idle', 'blinking', 'sleeping'][tick % 4];
      state(activity, activity === 'sleeping' ? 8500 : activity === 'walking' ? 1500 : 500);
    }
    if (tick % 8 === 0 && !motion.matches) say('Want to explore my projects?');
  }, 12000);
  scheduleRoaming(2500);
  return {
    destroy() {
      controller.abort();
      playground.destroy();
      sectionGuide.destroy();
      clearInterval(interval);
      clearTimeout(stateTimer);
      clearTimeout(bubbleTimer);
      voice.destroy();
      root.remove();
    }
  };
}
