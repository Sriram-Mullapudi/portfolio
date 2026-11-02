(() => {
  const videos = [...document.querySelectorAll('.product-video')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const started = new WeakSet();
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
      player.src = preview.querySelector('source').src;
      player.poster = preview.poster;
      player.muted = true;
      document.querySelector('#cinema-title').textContent = button.dataset.watchVideo === 'folio' ? 'Folio / Document to answer' : 'Speedway / A complete checkout';
      document.querySelector('#cinema-description').textContent = button.closest('figcaption').querySelector('span').innerText.replace(/\n/g, ' ');
      dialog.showModal();
      dialog.querySelector('.cinema-close').focus();
      player.play().catch(() => {});
    });
  });
  dialog.querySelector('.cinema-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    player.pause();
    player.removeAttribute('src');
    player.load();
    opener?.focus({preventScroll:true});
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) player.pause(); });
})();
