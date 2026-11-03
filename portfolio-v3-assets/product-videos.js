(() => {
  const videos = [...document.querySelectorAll('.product-video')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const started = new WeakSet();
  const phone = matchMedia('(max-width: 700px)');
  function configure(video, film) {
    const base = 'portfolio-v3-assets/' + film;
    video.pause();
    video.removeAttribute('src');
    video.replaceChildren();
    const choices = phone.matches
      ? [[base + '-mobile.mp4', 'video/mp4'], [base + '-recorded.webm', 'video/webm']]
      : [[base + '-recorded.mp4', 'video/mp4'], [base + '-recorded.webm', 'video/webm']];
    for (const [src, type] of choices) {
      const source = document.createElement('source');
      source.src = src; source.type = type; video.append(source);
    }
    video.poster = base + (phone.matches ? '-mobile-poster.png' : '-recorded-poster.png');
    video.width = phone.matches ? 720 : 1440;
    video.height = phone.matches ? 960 : 900;
    video.dataset.film = film;
    video.classList.toggle('mobile-film', phone.matches);
    video.load();
  }
  videos.forEach(video => configure(video, video.dataset.film));
  // Re-entry never overrides a visitor's pause choice.
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.intersectionRatio < 0.35) { video.pause(); continue; }
      if (reduce.matches || document.hidden || document.querySelector('#product-cinema')?.open || started.has(video)) continue;
      started.add(video);
      video.muted = true;
      video.play().catch(() => { /* Native controls remain available. */ });
    }
  }, {threshold: [0, 0.35]});
  videos.forEach(video => {
    video.addEventListener('play', () => started.add(video));
    observer.observe(video);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach(video => video.pause());
  });
  reduce.addEventListener('change', () => {
    if (reduce.matches) videos.forEach(video => video.pause());
  });
  const dialog = document.querySelector('#product-cinema');
  const player = dialog.querySelector('video');
  let opener;
  document.querySelectorAll('[data-watch-video]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      const preview = button.closest('figure').querySelector('video');
      videos.forEach(video => video.pause());
      configure(player, preview.dataset.film);
      player.muted = true;
      document.querySelector('#cinema-title').textContent = button.dataset.watchVideo === 'folio' ? 'Folio / Document to answer' : 'Speedway / A complete checkout';
      document.querySelector('#cinema-description').textContent = button.closest('figcaption').querySelector('span').innerText.replace(/\n/g, ' ');
      dialog.showModal();
      dialog.querySelector('.cinema-close').focus();
      player.play().catch(() => {});
    });
  });
  phone.addEventListener('change', () => {
    // Rotation may change the edit; preserve position, leave playback paused.
    for (const video of [...videos, ...(dialog.open ? [player] : [])]) {
      const time = video.currentTime;
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = Math.min(time, Number.isFinite(video.duration) ? video.duration : time);
      }, {once:true});
      configure(video, video.dataset.film);
      started.add(video);
    }
  });
  dialog.querySelector('.cinema-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    player.pause();
    player.removeAttribute('src');
    player.replaceChildren();
    player.load();
    opener?.focus({preventScroll:true});
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) player.pause(); });
})();
