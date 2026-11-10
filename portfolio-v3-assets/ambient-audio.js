/* User-supplied soundtrack. Default-on playback with an explicit play fallback when autoplay is blocked. */
(() => {
  const button = document.querySelector('#ambient-toggle');
  const volume = document.querySelector('#ambient-volume');
  const settings = document.querySelector('#ambient-settings');
  const notice = document.querySelector('#music-notice');
  let blocked = false, dismissed = false;
  let context, master, track, enabled = true, waiting = true, revision = 0;
  // Storage is optional: restrictive/private browser settings must not break audio.
  try {
    const saved = localStorage.getItem('portfolio-music-volume');
    const value = Number(saved);
    if (saved !== null && saved.trim() !== '' && Number.isFinite(value) && value >= 0 && value <= 1) volume.value = String(value);
  } catch {}
  try {
    if (sessionStorage.getItem('portfolio-music-enabled') === 'false') {
      enabled = false; waiting = false; dismissed = true;
    }
  } catch {}
  function displayVolume() {
    const percent = `${Math.round(Number(volume.value) * 100)}%`;
    document.querySelector('#ambient-volume-percent').textContent = percent;
    volume.setAttribute('aria-valuetext', percent);
  }
  displayVolume();
  function rememberChoice() {
    try { sessionStorage.setItem('portfolio-music-enabled', String(enabled)); } catch {}
  }
  function render() {
    button.setAttribute('aria-pressed', String(enabled && !waiting));
    button.textContent = enabled ? (waiting ? '♫ Play music' : '♫ Sound on') : '♫ Sound off';
    settings.hidden = !enabled;
    const showNotice = enabled && waiting && blocked && !dismissed;
    if (!showNotice && notice.contains(document.activeElement)) button.focus({preventScroll:true});
    notice.hidden = !showNotice;
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
      if (current === revision && enabled && !document.hidden) { waiting = false; blocked = false; render(); fade(Number(volume.value), 1.5); }
    } catch (error) {
      if (current === revision) { waiting = true; blocked = error.name === 'NotAllowedError'; track.pause(); render(); if (error.name !== 'NotAllowedError') { enabled = false; render(); button.textContent = '♫ Retry sound'; } }
    }
  }
  button.addEventListener('click', () => {
    try { if (!context) create(); }
    catch { button.textContent = 'Sound unavailable'; button.disabled = true; return; }
    if (track.error) track.load();
    enabled = waiting || !enabled; waiting = enabled; rememberChoice(); render(); void sync();
  });
  document.querySelector('#music-notice-play').addEventListener('click', () => { button.click(); });
  document.querySelector('#music-notice-dismiss').addEventListener('click', () => {
    dismissed = true; enabled = false; waiting = false; rememberChoice(); render(); void sync();
  });
  volume.addEventListener('input', () => {
    displayVolume();
    try { localStorage.setItem('portfolio-music-volume', volume.value); } catch {}
    if (context && enabled) fade(Number(volume.value), .15);
  });
  // Retry blocked autoplay inside an actual user gesture, without requiring
  // a dedicated music-button click. Never undo an explicit mute choice.
  function startOnInteraction(event) {
    if (!event.isTrusted || !context || !enabled || !waiting || document.hidden) return;
    if (event.target instanceof Element && event.target.closest('.ambient-control, .music-notice')) return;
    if (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ['Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(event.key))) return;
    void sync();
  }
  document.addEventListener('pointerup', startOnInteraction);
  document.addEventListener('keydown', startOnInteraction);
  document.addEventListener('visibilitychange', () => { void sync(); });
  window.addEventListener('pagehide', () => { if (context) { track.pause(); context.suspend().catch(() => {}); } });
  window.addEventListener('pageshow', event => { if (context && event.persisted) void sync(); });
  render();
  try { if (enabled) { create(); void sync(); } }
  catch { enabled = false; render(); button.textContent = 'Sound unavailable'; button.disabled = true; }
})();
