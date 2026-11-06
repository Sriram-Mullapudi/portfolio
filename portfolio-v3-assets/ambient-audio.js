/* An original slow, felt-key melody with warm, breathing chords. No audio runs before consent. */
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
    // Render a seamless original 57.6-second phrase once, after the first click.
    // Wrapped release tails keep the loop boundary free of hard cuts.
    const rate = 22050, duration = 57.6;
    const buffer = context.createBuffer(2, Math.round(rate * duration), rate);
    const left = buffer.getChannelData(0), right = buffer.getChannelData(1);
    const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);
    function note(midi, at, length, level, pan, pad = false) {
      const start = Math.round(at * rate), count = Math.round(length * rate);
      const frequency = hz(midi);
      const l = Math.sqrt((1 - pan) / 2), r = Math.sqrt((1 + pan) / 2);
      for (let i = 0; i < count; i++) {
        const t = i / rate;
        const envelope = pad
          ? Math.pow(Math.sin(Math.PI * t / length), 2)
          : (1 - Math.exp(-t / .035)) * Math.exp(-t / 1.8) * Math.pow(1 - t / length, 2);
        const phase = 2 * Math.PI * frequency * t;
        const wave = Math.sin(phase) + (pad ? .06 : .18 * Math.exp(-t * 2)) * Math.sin(phase * 2);
        const value = wave * envelope * level;
        const index = (start + i) % left.length;
        left[index] += value * l; right[index] += value * r;
      }
    }
    // Spacious Cmaj7–Am7–Fmaj7–Gsus harmony, beneath a restrained pentatonic melody.
    [[48,55,59,64],[45,52,55,60],[41,48,52,57],[43,50,55,60]].forEach((chord, i) => {
      chord.forEach((pitch, j) => note(pitch, i * 14.4, 19, .018, (j - 1.5) * .22, true));
    });
    const melody = [72,null,76,79,null,76,74,null,72,null,69,72,null,76,null,null,
      69,null,72,76,null,74,72,null,67,null,69,74,null,72,null,null];
    melody.forEach((pitch, i) => {
      if (pitch === null) return;
      const pan = Math.sin(i * .7) * .25;
      note(pitch, i * 1.8, 6, .11, pan);
      note(pitch, i * 1.8 + .6, 5, .018, -pan); // Quiet, soft echo.
    });
    const source = context.createBufferSource();
    source.buffer = buffer; source.loop = true; source.connect(filter); source.start();
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
