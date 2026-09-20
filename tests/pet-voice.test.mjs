import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(readFileSync(new URL('../js/pet-voice.js', import.meta.url), 'utf8').replace('export ', '') + '\nglobalThis.create = createCatSounds;', sandbox);
function fixture(suspended = false) {
  const nodes = [];
  let audio, resume;
  const param = () => ({ setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} });
  const node = () => {
    const value = { frequency: param(), gain: param(), Q: param(), connect() {},
      disconnect() { this.disconnected = true; }, start() { this.started = true; },
      stop(time) { if (time === undefined) this.stopped = true; else this.end = time; } };
    nodes.push(value); return value;
  };
  class AudioContext {
    constructor() { audio = this; this.state = suspended ? 'suspended' : 'running'; this.currentTime = 10; this.destination = {}; }
    createOscillator() { return node(); }
    createGain() { return node(); }
    createBiquadFilter() { return node(); }
    resume() { return new Promise(resolve => { resume = () => { this.state = 'running'; resolve(); }; }); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  const sound = sandbox.create({ AudioContext });
  return { sound, nodes, audio: () => audio, resume: () => resume() };
}
test('meows wait for activation and use short audio tones without speech', () => {
  const f = fixture();
  assert.equal(f.sound.meow(), false);
  f.sound.unlock(); assert.equal(f.sound.meow(), true);
  assert.equal(f.nodes.length, 6);
  assert.equal(f.nodes[0].started, true);
  assert.equal(f.nodes[0].end, 10.68);
  f.sound.destroy();
});
test('muting and replacement stop and disconnect prior sounds', () => {
  const f = fixture(); f.sound.unlock(); f.sound.meow(); f.sound.meow();
  assert.ok(f.nodes.slice(0, 6).every(n => n.disconnected));
  f.sound.stop(); assert.ok(f.nodes.every(n => n.disconnected));
  f.sound.destroy(); assert.equal(f.audio().state, 'closed');
  assert.equal(f.sound.meow(), false);
});
test('mute cancels a meow waiting for browser audio activation', async () => {
  const f = fixture(true); f.sound.unlock(); f.sound.meow(); f.sound.stop();
  f.resume(); await Promise.resolve();
  assert.equal(f.nodes.length, 0);
  f.sound.destroy();
});
test('unsupported browsers retain a safe silent fallback', () => {
  const sound = sandbox.create({});
  assert.equal(sound.supported, false);
  sound.unlock(); assert.equal(sound.meow(), false); sound.destroy();
});
