// Coordinates are CSS pixels in the viewport; gravity is pixels/second².
export const GRAVITY = 1500;
export function jumpVelocity(start, end, ceiling) {
  const apex = Math.max(ceiling, Math.min(start.y, end.y) - 55);
  const vy = -Math.sqrt(2 * GRAVITY * Math.max(0, start.y - apex));
  const duration = (-vy + Math.sqrt(vy * vy + 2 * GRAVITY * (end.y - start.y))) / GRAVITY;
  return { vx: (end.x - start.x) / Math.max(.1, duration), vy, duration };
}

export function createPlayground({ root, cat, position, bounds, place, state, busy, scrollBusy = busy }) {
  let timer, frame, layoutFrame, scrollRestTimer, flight, support, platforms = [], pointer;
  let disposed = false, active = false, turn = 0, lastCursorGame = 0;
  let lastScroll = window.scrollY || 0, scrollDelta = 0, scrollDirection = 0, scrollTime = -Infinity;
  const abort = new AbortController();
  const listen = (target, type, fn) => target.addEventListener(type, fn, { signal: abort.signal, passive: true });
  const ball = document.createElement('span');
  ball.className = 'pet-yarn';
  ball.setAttribute('aria-hidden', 'true');
  ball.hidden = true;
  root.append(ball);
  const feet = () => root.offsetHeight - cat.offsetWidth / 16;
  const clamp = (n, a, b) => Math.max(a, Math.min(n, b));
  function measure() {
    const v = bounds();
    platforms = [...document.querySelectorAll('.project-showcase, .credential-entry, .about-summary, .section-title, .contact-heading, .site-header')]
      .map(element => {
        let r = element.getBoundingClientRect();
        const navbar = element.matches('.site-header');
        if (element.matches('h2')) {
          // Use the visible first line, not the heading's full-width block box.
          const text = document.createRange();
          text.selectNodeContents(element);
          r = [...text.getClientRects()].find(rect => rect.width > 20 && rect.height > 10) || r;
        }
        let left = Math.max(v.left + 12, r.left);
        let right = Math.min(v.left + v.width - (navbar ? 60 : root.offsetWidth) - 12, r.right - (navbar ? 48 : cat.offsetWidth));
        if (navbar) {
          // Nap only in an actual gap between the header's interactive controls.
          let gaps = [[left, right]];
          for (const control of element.querySelectorAll('a, button')) {
            const box = control.getBoundingClientRect();
            gaps = gaps.flatMap(([a, b]) => box.right + 4 < a || box.left - 52 > b ? [[a, b]]
              : [[a, Math.min(b, box.left - 52)], [Math.max(a, box.right + 4), b]].filter(([lo, hi]) => hi >= lo));
          }
          [left, right] = gaps.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0] || [1, 0];
        }
        return { element, navbar, left, right,
          y: navbar ? r.bottom : r.top, kind: navbar ? 'navbar' : element.matches('h2') ? 'heading' : 'card' };
      }).filter(p => p.right >= p.left && p.y >= v.top + (p.navbar ? 55 : feet() + 16) && p.y < v.top + v.height - 12);
    platforms.push({ element: null, left: v.left + 12, right: v.left + v.width - root.offsetWidth - 12,
      y: v.top + v.height - 16, kind: 'floor' });
  }
  function schedule(delay = 5000) {
    clearTimeout(timer);
    if (!disposed && !document.hidden) timer = setTimeout(explore, delay);
  }
  function stop() {
    clearTimeout(timer);
    clearTimeout(scrollRestTimer);
    cancelAnimationFrame(frame);
    flight = null;
    if (active || root.classList.contains('pet-roaming')) state('idle');
    active = false;
    root.dataset.airborne = 'false';
    ball.hidden = true;
    root.classList.remove('pet-roaming', 'pet-peeking');
  }
  function settle(platform, landingX, behavior) {
    active = false;
    flight = null;
    support = { element: platform.element, ratio: (landingX - platform.left) / Math.max(1, platform.right - platform.left) };
    place(landingX, platform.y - feet());
    root.classList.remove('pet-roaming');
    ball.hidden = true;
    if (platform.kind === 'navbar') state('sleeping');
    else if (behavior === 'peek' && platform.kind === 'card') {
      root.classList.add('pet-peeking');
      state('idle');
    } else state(platform.kind === 'heading' ? 'sitting' : behavior === 'yarn' ? 'playing' : 'idle');
    schedule(platform.kind === 'navbar' ? 14000 : 4500 + Math.random() * 6000);
  }
  function travel(platform, targetX, behavior = 'explore') {
    stop();
    // A smaller pose fits the navbar without covering its links.
    root.classList.toggle('pet-navbar', platform.kind === 'navbar');
    measure();
    platform = platforms.find(p => p.element === platform.element) || platforms.at(-1);
    const start = position();
    targetX = clamp(targetX, platform.left, platform.right);
    const end = { x: targetX, y: platform.y - feet() };
    const grounded = support?.element === platform.element && Math.abs(start.y - end.y) < 8;
    const running = behavior === 'cursor' || behavior === 'yarn';
    const jump = behavior === 'fall'
      ? { vx: 0, vy: 0, duration: Math.sqrt(2 * Math.max(0, end.y - start.y) / GRAVITY) }
      : jumpVelocity(start, end, bounds().top + 12);
    const duration = grounded ? Math.max(.4, Math.abs(end.x - start.x) / (running ? 175 : 85)) : jump.duration;
    let elapsed = 0, previous;
    support = null;
    flight = { platform };
    active = true;
    root.classList.add('pet-roaming');
    root.classList.toggle('pet-facing-left', targetX < start.x);
    state(grounded ? running ? 'running' : 'walking' : 'jumping');
    if (behavior === 'yarn') ball.hidden = false;
    function step(timestamp) {
      if (disposed || busy()) { stop(); schedule(); return; }
      if (previous !== undefined) elapsed += Math.min(.04, (timestamp - previous) / 1000);
      previous = timestamp;
      const t = Math.min(elapsed, duration);
      const nextX = grounded ? start.x + (end.x - start.x) * t / duration : start.x + jump.vx * t;
      const nextY = grounded ? end.y : start.y + jump.vy * t + .5 * GRAVITY * t * t;
      place(nextX, nextY);
      root.dataset.airborne = String(!grounded);
      if (!ball.hidden) {
        const ballX = clamp(nextX + Math.sign(end.x - start.x) * 42, platform.left, platform.right + cat.offsetWidth - 16);
        ball.style.left = `${ballX - nextX}px`;
        ball.style.top = `${platform.y - nextY - 16 - Math.abs(Math.sin(t * 7)) * 13}px`;
      }
      // One-way platforms catch descending paws; no landing on an upward pass.
      const descending = !grounded && jump.vy + GRAVITY * t > 0;
      const oldFeet = positionBefore.y + feet();
      const newFeet = nextY + feet();
      const hit = descending && platforms.filter(p => !p.navbar && oldFeet <= p.y + 1 && newFeet >= p.y &&
        nextX >= p.left && nextX <= p.right).sort((a, b) => a.y - b.y)[0];
      if (hit) { root.dataset.airborne = 'false'; settle(hit, nextX, behavior); return; }
      if (elapsed >= duration) { root.dataset.airborne = 'false'; settle(platform, end.x, behavior); return; }
      positionBefore = { x: nextX, y: nextY };
      frame = requestAnimationFrame(step);
    }
    let positionBefore = start;
    frame = requestAnimationFrame(step);
  }
  function explore() {
    if (disposed) return;
    if (busy()) { schedule(); return; }
    root.classList.remove('pet-peeking');
    measure();
    const here = position();
    const footY = here.y + feet();
    const current = support && platforms.find(p => p.element === support.element);
    if (!current) {
      const below = platforms.filter(p => !p.navbar && p.y >= footY - 1 && here.x >= p.left && here.x <= p.right)
        .sort((a, b) => a.y - b.y)[0] || platforms.at(-1);
      travel(below, clamp(here.x, below.left, below.right), 'fall');
      return;
    }
    const cursorGame = current && pointer && performance.now() - pointer.time < 2500 &&
      performance.now() - lastCursorGame > 18000 && Math.abs(pointer.y - footY) < 150;
    if (cursorGame) {
      lastCursorGame = performance.now();
      travel(current, clamp(pointer.x - 65, current.left, current.right), 'cursor');
      return;
    }
    turn++;
    if (current && turn % 4 === 0 && current.right - current.left > 110) {
      travel(current, here.x < (current.left + current.right) / 2 ? current.right : current.left, 'yarn');
      return;
    }
    // Prefer another real element; limit upward jumps and horizontal launch speed.
    const candidates = platforms.filter(p => p.element !== support?.element &&
      footY - p.y < 420 && Math.abs(clamp(here.x, p.left, p.right) - here.x) < 240);
    const elevated = candidates.filter(p => p.kind !== 'floor');
    const directional = candidates.filter(p => performance.now() - scrollTime < 1800 &&
      (p.y - footY) * scrollDirection > 20);
    const pool = directional.length ? directional : elevated.length ? elevated : candidates;
    const target = pool[Math.floor(Math.random() * pool.length)] || current || platforms.at(-1);
    const nearLeft = Math.max(target.left, here.x - 240);
    const nearRight = Math.min(target.right, here.x + 240);
    const targetX = nearLeft + Math.random() * Math.max(0, nearRight - nearLeft);
    travel(target, targetX, turn % 3 === 0 ? 'peek' : 'explore');
  }
  function refresh() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
      if (disposed || root.classList.contains('pet-caged') || document.hidden) {
        scrollDelta = 0;
        return;
      }
      const wasMoving = !!flight;
      if (wasMoving) stop();
      const delta = scrollDelta;
      scrollDelta = 0;
      const react = delta !== 0 && !scrollBusy();
      measure();
      const platform = support && platforms.find(p => p.element === support.element);
      if (platform) {
        const oldX = platform.left + support.ratio * (platform.right - platform.left);
        // Trot along the current edge while the page moves beneath the paws.
        const nextX = clamp(oldX + (react ? clamp(delta * .45, -18, 18) : 0), platform.left, platform.right);
        support.ratio = (nextX - platform.left) / Math.max(1, platform.right - platform.left);
        place(nextX, platform.y - feet());
      }
      else {
        support = null;
        root.classList.remove('pet-peeking', 'pet-navbar');
        const p = position();
        place(p.x + (react ? clamp(delta * .3, -12, 12) : 0), p.y - (react ? clamp(delta * .25, -24, 24) : 0));
      }
      if (react) {
        root.classList.remove('pet-peeking');
        root.classList.add('pet-roaming');
        root.classList.toggle('pet-facing-left', delta < 0);
        state(Math.abs(delta) > 70 ? 'running' : 'walking');
        clearTimeout(scrollRestTimer);
        scrollRestTimer = setTimeout(() => {
          root.classList.remove('pet-roaming');
          state('idle');
          schedule(1200);
        }, 180);
        // Debounce the next jump, but keep the scroll trot responsive every frame.
        clearTimeout(timer);
      } else if (wasMoving || !platform) schedule(500);
    });
  }
  function onScroll() {
    const nextScroll = (window.scrollY || 0) + (window.visualViewport?.offsetTop || 0);
    const delta = nextScroll - lastScroll;
    lastScroll = nextScroll;
    if (delta) {
      scrollDelta += delta;
      scrollDirection = Math.sign(delta);
      scrollTime = performance.now();
    }
    refresh();
  }
  listen(window, 'scroll', onScroll);
  listen(window, 'resize', refresh);
  if (window.visualViewport) {
    listen(window.visualViewport, 'scroll', onScroll);
    listen(window.visualViewport, 'resize', refresh);
  }
  listen(document, 'pointermove', event => {
    if (event.pointerType === 'mouse') pointer = { x: event.clientX, y: event.clientY, time: performance.now() };
  });
  const resize = new ResizeObserver(refresh);
  resize.observe(document.body);
  document.querySelectorAll('.project-showcase, .section-title, .site-header').forEach(el => resize.observe(el));
  measure();
  return { stop, schedule, refresh, get active() { return active; },
    release() { support = null; root.classList.remove('pet-peeking', 'pet-navbar'); },
    destroy() { disposed = true; stop(); cancelAnimationFrame(layoutFrame); resize.disconnect(); abort.abort(); ball.remove(); }
  };
}
