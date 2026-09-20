import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function setup() {
  const timers = new Map(), messages = [];
  let id = 0, allowed = true;
  const target = () => ({ addEventListener() {} });
  const window = { ...target(), innerHeight: 800, scrollY: 0 };
  const document = { ...target(), hidden: false, documentElement: { scrollHeight: 2400 } };
  const entries = ['About', 'Credentials', 'Contact'].map((message, i) => ({ message,
    element: { getBoundingClientRect: () => ({ top: i * 800 - window.scrollY, bottom: (i + 1) * 800 - window.scrollY }) } }));
  const context = { window, document, AbortController,
    setTimeout: fn => { timers.set(++id, fn); return id; }, clearTimeout: key => timers.delete(key) };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL('../js/pet-sections.js', import.meta.url), 'utf8').replace('export ', '') +
    '\nglobalThis.watch = watchPetSections;', context);
  const guide = context.watch(entries, message => { if (!allowed) return false; messages.push(message); return true; });
  const flush = () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); };
  return { messages, timers, guide, flush, document, allow: value => { allowed = value; },
    visit: y => { window.scrollY = y; guide.refresh(); flush(); } };
}

test('introduces each new section, avoids duplicates, and repeats on return visits', () => {
  const f = setup(); f.flush(); f.visit(60); f.visit(800); f.visit(900); f.visit(0);
  assert.deepEqual(f.messages, ['About', 'Credentials', 'About']);
  f.guide.destroy();
});

test('suppressed messages retry when preferences or interaction allow them', () => {
  const f = setup(); f.allow(false); f.flush(); f.visit(800);
  assert.deepEqual(f.messages, []);
  f.allow(true); f.guide.refresh(); f.flush();
  assert.deepEqual(f.messages, ['Credentials']);
  f.document.hidden = true; f.visit(0);
  assert.deepEqual(f.messages, ['Credentials']);
  f.document.hidden = false; f.guide.refresh(); f.flush();
  assert.deepEqual(f.messages, ['Credentials', 'About']);
  f.guide.destroy();
});

test('rapid scrolling announces only the settled section and cleanup clears pending messages', () => {
  const f = setup();
  f.guide.refresh(); f.guide.refresh();
  assert.equal(f.timers.size, 1);
  f.visit(1600);
  assert.deepEqual(f.messages, ['Contact']);
  f.guide.refresh(); f.guide.destroy();
  assert.equal(f.timers.size, 0);
});
