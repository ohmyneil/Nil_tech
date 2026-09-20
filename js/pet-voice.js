// Short synthesized kitten meows. No narration, recordings, or network requests.
export function createCatSounds(host = window) {
  const AudioContext = host.AudioContext || host.webkitAudioContext;
  let context, nodes = [], sources = [], generation = 0, destroyed = false;
  function stop() {
    generation++;
    for (const source of sources) {
      source.onended = null;
      try { source.stop(); } catch { /* Already finished. */ }
    }
    for (const node of nodes) node.disconnect();
    nodes = [];
    sources = [];
  }
  function render() {
    const start = context.currentTime;
    const length = .68;
    const tone = context.createOscillator();
    const vibrato = context.createOscillator();
    const wobble = context.createGain();
    const vowel = context.createBiquadFilter();
    const softness = context.createBiquadFilter();
    const volume = context.createGain();
    nodes = [tone, vibrato, wobble, vowel, softness, volume];
    sources = [tone, vibrato];
    // A rising "mee" and falling "ow" with a gentle vowel filter.
    tone.type = 'sawtooth';
    const pitch = 1 + (Math.random() - .5) * .12;
    tone.frequency.setValueAtTime(620 * pitch, start);
    tone.frequency.exponentialRampToValueAtTime(880 * pitch, start + .12);
    tone.frequency.exponentialRampToValueAtTime(730 * pitch, start + .3);
    tone.frequency.exponentialRampToValueAtTime(360 * pitch, start + length);
    vibrato.frequency.value = 24;
    wobble.gain.value = 9;
    vibrato.connect(wobble);
    wobble.connect(tone.frequency);
    vowel.type = 'bandpass';
    vowel.Q.value = 1.6;
    vowel.frequency.setValueAtTime(1700, start);
    vowel.frequency.exponentialRampToValueAtTime(2100, start + .14);
    vowel.frequency.exponentialRampToValueAtTime(650, start + length);
    softness.type = 'lowpass';
    softness.frequency.value = 2700;
    volume.gain.setValueAtTime(0, start);
    volume.gain.linearRampToValueAtTime(.13, start + .055);
    volume.gain.linearRampToValueAtTime(.1, start + .3);
    volume.gain.exponentialRampToValueAtTime(.001, start + length);
    tone.connect(vowel);
    vowel.connect(softness);
    softness.connect(volume);
    volume.connect(context.destination);
    tone.onended = () => stop();
    tone.start(start);
    vibrato.start(start);
    tone.stop(start + length);
    vibrato.stop(start + length);
  }
  return {
    supported: Boolean(AudioContext),
    get ready() { return Boolean(context) && !destroyed; },
    unlock() {
      if (!AudioContext || destroyed || context) return;
      try { context = new AudioContext(); } catch { /* Text bubbles still work. */ }
    },
    stop,
    meow() {
      if (!context || destroyed || context.state === 'closed') return false;
      stop();
      const token = generation;
      const play = () => {
        if (destroyed || token !== generation) return;
        try { render(); } catch { stop(); }
      };
      if (context.state === 'running') play();
      else {
        try { context.resume().then(play).catch(() => {}); } catch { return false; }
      }
      return true;
    },
    destroy() {
      destroyed = true;
      stop();
      if (context && context.state !== 'closed') context.close().catch(() => {});
    }
  };
}
