/* User-supplied soundtrack. Loaded only after an explicit sound-button click. */
(() => {
  const button = document.querySelector('#ambient-toggle');
  const volume = document.querySelector('#ambient-volume');
  const settings = document.querySelector('#ambient-settings');
  let context, master, track, enabled = false, revision = 0;
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
    track = document.createElement('audio');
    track.preload = 'none'; track.loop = true;
    track.src = 'portfolio-v3-assets/jersey-aarambhame-le.mp3';
    track.hidden = true; document.body.append(track);
    const source = context.createMediaElementSource(track);
    source.connect(master); master.connect(context.destination);
    track.addEventListener('error', () => {
      enabled = false; render();
      button.textContent = '♫ Retry sound';
      void sync();
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
      if (document.hidden) { master.gain.cancelScheduledValues(context.currentTime); master.gain.value = 0; track.pause(); await context.suspend(); }
      else {
        fade(0, .45);
        setTimeout(() => { if (current === revision && !enabled) { track.pause(); context.suspend().catch(() => {}); } }, 500);
      }
      return;
    }
    try {
      await Promise.all([context.resume(), track.play()]);
      if (!enabled || document.hidden) track.pause();
      if (current === revision && enabled && !document.hidden) fade(Number(volume.value), 1.5);
    } catch {
      if (current === revision) { enabled = false; track.pause(); render(); button.textContent = '♫ Retry sound'; }
    }
  }
  button.addEventListener('click', () => {
    try { if (!context) create(); }
    catch { button.textContent = 'Sound unavailable'; button.disabled = true; return; }
    if (track.error) track.load();
    enabled = !enabled; render(); void sync();
  });
  volume.addEventListener('input', () => { if (context && enabled) fade(Number(volume.value), .15); });
  document.addEventListener('visibilitychange', () => { void sync(); });
  window.addEventListener('pagehide', () => { if (context) { track.pause(); context.suspend().catch(() => {}); } });
  window.addEventListener('pageshow', () => { if (context) void sync(); });
  render();
})();
