/* An original, softly evolving pentatonic pad. No audio runs before consent. */
(() => {
  const button = document.querySelector('#ambient-toggle');
  const volume = document.querySelector('#ambient-volume');
  const settings = document.querySelector('#ambient-settings');
  let context, master, enabled = false, revision = 0;
  function render() {
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = enabled ? '♫ Sound on' : '♫ Sound off';
    settings.hidden = !enabled;
  }
  function create() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('Audio unavailable');
    context = new Audio();
    master = context.createGain(); master.gain.value = 0;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 1100; filter.Q.value = .3;
    filter.connect(master); master.connect(context.destination);
    // C major pentatonic: long overlapping swells, without percussion or vocals.
    [130.81, 196, 261.63, 293.66, 329.63, 440].forEach((frequency, i) => {
      const tone = context.createOscillator(), envelope = context.createGain();
      tone.type = 'sine'; tone.frequency.value = frequency;
      tone.detune.value = i % 2 ? 2 : -2;
      envelope.gain.value = .026;
      const drift = context.createOscillator(), depth = context.createGain();
      drift.frequency.value = 1 / (19 + i * 7); depth.gain.value = .014;
      drift.connect(depth); depth.connect(envelope.gain);
      tone.connect(envelope); envelope.connect(filter);
      tone.start(); drift.start();
    });
  }
  function fade(value, seconds) {
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(value, now + seconds);
  }
  async function sync() {
    const current = ++revision;
    if (!context) return;
    if (document.hidden || !enabled) {
      if (document.hidden) { master.gain.cancelScheduledValues(context.currentTime); master.gain.value = 0; await context.suspend(); }
      else {
        fade(0, .45);
        setTimeout(() => { if (current === revision && !enabled) context.suspend().catch(() => {}); }, 500);
      }
      return;
    }
    try {
      await context.resume();
      if (current === revision && enabled && !document.hidden) fade(Number(volume.value), 1.5);
    } catch {
      enabled = false; render();
    }
  }
  button.addEventListener('click', () => {
    try { if (!context) create(); }
    catch { button.textContent = 'Sound unavailable'; button.disabled = true; return; }
    enabled = !enabled; render(); void sync();
  });
  volume.addEventListener('input', () => { if (context && enabled) fade(Number(volume.value), .15); });
  document.addEventListener('visibilitychange', () => { void sync(); });
  window.addEventListener('pagehide', () => { if (context) context.suspend().catch(() => {}); });
  window.addEventListener('pageshow', () => { if (context) void sync(); });
  render();
})();
