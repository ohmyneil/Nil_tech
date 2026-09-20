import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/pet-playground.js', import.meta.url), 'utf8')
  .replaceAll('export ', '') + '\nglobalThis.api = { createPlayground, jumpVelocity, GRAVITY };';

function fixture() {
  let clock = 0, id = 0, blocked = false, messageVisible = false;
  const frames = new Map(), timers = new Map(), states = [];
  const eventTarget = () => ({ handlers: {}, addEventListener(name, fn) { (this.handlers[name] ||= []).push(fn); },
    emit(name, e = {}) { this.handlers[name]?.forEach(fn => fn(e)); } });
  const classes = new Set();
  const root = { ...eventTarget(), offsetWidth: 104, offsetHeight: 100, dataset: {},
    classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)),
      contains: name => classes.has(name),
      toggle: (name, value) => value ? classes.add(name) : classes.delete(name) }, append() {} };
  let cardTop = 500;
  const card = { matches: () => false, getBoundingClientRect: () => ({ left: 80, right: 850, top: cardTop, bottom: cardTop + 180 }) };
  const doc = { ...eventTarget(), body: {}, hidden: false, querySelectorAll: () => [card],
    createElement: () => ({ style: {}, setAttribute() {}, remove() {} }) };
  const win = { ...eventTarget(), scrollY: 0 };
  const context = { document: doc, window: win, AbortController,
    Math: Object.assign(Object.create(Math), { random: () => .5 }),
    performance: { now: () => clock }, ResizeObserver: class { observe() {} disconnect() {} },
    setTimeout(fn, delay) { const key = ++id; timers.set(key, { fn, delay }); return key; },
    clearTimeout: key => timers.delete(key),
    requestAnimationFrame(fn) { const key = ++id; frames.set(key, fn); return key; },
    cancelAnimationFrame: key => frames.delete(key) };
  vm.createContext(context); vm.runInContext(source, context);
  let pos = { x: 400, y: 690 };
  const engine = context.api.createPlayground({ root, cat: { offsetWidth: 96 },
    position: () => ({ ...pos }), bounds: () => ({ left: 0, top: 0, width: 1000, height: 800 }),
    place: (x, y) => { assert.ok(Number.isFinite(x) && Number.isFinite(y)); pos = { x, y }; },
    state: name => states.push(name), busy: () => blocked || doc.hidden || messageVisible,
    scrollBusy: () => blocked || doc.hidden });
  const frame = () => { clock += 16; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(clock)); };
  const finish = () => { let count = 0; while (frames.size && count++ < 1000) frame(); assert.ok(count < 1000, 'motion terminates'); };
  const next = () => { const [key, timer] = [...timers][0]; timers.delete(key); clock += timer.delay; timer.fn(); };
  return { engine, root, states, frames, timers, doc, win, api: context.api, frame, finish, next,
    message: value => { messageVisible = value; },
    position: () => pos, block: value => { blocked = value; }, advance: value => { clock += value; },
    scrollCard: value => { cardTop = value; win.emit('scroll'); },
    scrollBy: delta => { cardTop -= delta; win.scrollY += delta; win.emit('scroll'); } };
}

test('ballistic jumps reach higher, lower, and equal platforms on descent', () => {
  const f = fixture();
  for (const end of [{ x: 300, y: 200 }, { x: 600, y: 600 }, { x: 10, y: 400 }]) {
    const start = { x: 100, y: 400 };
    const { vx, vy, duration: t } = f.api.jumpVelocity(start, end, 12);
    assert.ok(t > 0 && Number.isFinite(t));
    assert.ok(Math.abs(start.x + vx * t - end.x) < .001);
    assert.ok(Math.abs(start.y + vy * t + .5 * f.api.GRAVITY * t * t - end.y) < .001);
    assert.ok(vy + f.api.GRAVITY * t > 0, 'lands while falling');
  }
  f.engine.destroy();
});

test('discovers a real card, lands on its edge, and follows its scroll position', () => {
  const f = fixture();
  f.engine.schedule(0); f.next(); f.finish(); // establish floor support
  f.next(); f.finish(); // jump to the card
  assert.ok(f.states.includes('jumping'));
  assert.equal(f.position().y + 94, 500);
  assert.ok(!f.engine.active);
  f.scrollCard(380); f.finish();
  assert.equal(f.position().y + 94, 380, 'perched cat follows the card');
  f.engine.destroy();
});

test('busy interactions and inactive tabs stop physics and cleanup clears scheduled work', () => {
  const f = fixture();
  f.engine.schedule(0); f.next(); f.finish();
  f.next(); assert.ok(f.engine.active);
  f.block(true); f.frame();
  assert.equal(f.frames.size, 0);
  assert.equal(f.engine.active, false);
  f.block(false); f.doc.hidden = true;
  f.engine.stop(); f.engine.schedule();
  assert.equal(f.timers.size, 0, 'no background exploration timer');
  f.doc.hidden = false; f.engine.schedule();
  f.engine.destroy();
  assert.equal(f.frames.size, 0);
  assert.equal(f.timers.size, 0);
});

test('resizing during a jump cancels the stale path and schedules fresh geometry', () => {
  const f = fixture();
  f.engine.schedule(0); f.next(); f.finish(); f.next();
  assert.ok(f.engine.active);
  f.win.emit('resize'); f.frame();
  assert.equal(f.engine.active, false);
  assert.ok(f.timers.size > 0);
  f.engine.destroy();
});

test('a recent mouse position starts a bounded running chase, then returns to rest', () => {
  const f = fixture();
  f.engine.schedule(0); f.next(); f.finish();
  f.advance(20000);
  f.doc.emit('pointermove', { pointerType: 'mouse', clientX: 650, clientY: 760 });
  f.engine.schedule(0); f.next();
  assert.equal(f.states.at(-1), 'running');
  f.finish();
  assert.equal(f.position().x, 585);
  assert.equal(f.position().y + 94, 784);
  assert.equal(f.states.at(-1), 'idle');
  assert.ok(f.timers.size > 0, 'exploration resumes after a quiet pause');
  f.engine.destroy();
});

test('periodic yarn play includes a running state and a playful pause', () => {
  const f = fixture();
  f.engine.schedule(0); f.next(); f.finish();
  for (let n = 0; n < 4; n++) { f.next(); f.finish(); }
  assert.ok(f.states.includes('running'));
  assert.ok(f.states.includes('playing'));
  f.engine.destroy();
});

test('scrolling down and up causes immediate opposite trots and schedules exploration', () => {
  const f = fixture();
  f.engine.schedule(0); f.next(); f.finish();
  const before = f.position().x;
  f.scrollBy(40); f.frame();
  assert.ok(f.position().x > before, 'scroll down moves the cat right');
  assert.equal(f.states.at(-1), 'walking');
  const afterDown = f.position().x;
  f.scrollBy(-40); f.frame();
  assert.ok(f.position().x < afterDown, 'scroll up moves the cat left');
  assert.ok([...f.timers.values()].some(t => t.delay === 180));
  f.next();
  assert.equal(f.states.at(-1), 'idle', 'paws rest after scrolling stops');
  f.next(); f.finish();
  assert.ok(f.states.includes('jumping'), 'exploration resumes after scrolling');
  f.engine.destroy();
});

test('scroll reactions respect interaction and reduced-motion blocking', () => {
  const f = fixture();
  f.engine.schedule(0); f.next(); f.finish();
  f.block(true);
  const before = f.position().x, stateCount = f.states.length;
  f.scrollBy(120); f.frame();
  assert.equal(f.position().x, before);
  assert.equal(f.states.length, stateCount);
  f.engine.destroy();
});

test('a visible message allows scroll movement and returns to idle afterward', () => {
  const f = fixture();
  f.engine.schedule(0); f.next(); f.finish();
  f.message(true);
  const before = f.position().x;
  f.scrollBy(40); f.frame();
  assert.ok(f.position().x > before);
  assert.equal(f.states.at(-1), 'walking');
  f.next();
  assert.equal(f.states.at(-1), 'idle');
  assert.equal(f.root.classList.contains('pet-roaming'), false);
  f.engine.destroy();
  assert.equal(f.timers.size, 0);
});

test('a caged cat stays in place when scrolling or resizing', () => {
  const f = fixture();
  f.root.classList.add('pet-caged');
  const before = { ...f.position() };
  f.scrollBy(300); f.frame();
  f.win.emit('resize'); f.frame();
  assert.deepEqual(f.position(), before);
  assert.equal(f.states.length, 0);
  assert.equal(f.timers.size, 0);
  f.engine.destroy();
});
