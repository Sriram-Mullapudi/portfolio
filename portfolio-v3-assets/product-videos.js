(() => {
  const videos = [...document.querySelectorAll('.product-video')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 700px)');
  const started = new WeakSet();
  const revisions = new WeakMap();
  const recovery = new WeakMap();
  const dialog = document.querySelector('#product-cinema');
  const player = dialog.querySelector('video');
  let opener;
  function hideRecovery(video) { recovery.get(video).hidden = true; }
  function showRecovery(video) {
    if (!video.dataset.film || (video === player && !dialog.open)) return;
    video.pause();
    recovery.get(video).hidden = false;
  }
  function play(video) {
    video.play().catch(error => {
      // Autoplay restrictions leave the native Play button usable.
      if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') showRecovery(video);
    });
  }
  function configure(video, film) {
    const revision = (revisions.get(video) || 0) + 1;
    revisions.set(video, revision);
    const preview = video.classList.contains('product-video');
    const base = 'portfolio-v3-assets/' + film;
    video.pause(); video.removeAttribute('src'); video.replaceChildren();
    hideRecovery(video);
    const primary = preview ? base + (phone.matches ? '-mobile-preview.mp4' : '-preview.mp4')
      : base + (phone.matches ? '-mobile.mp4' : '-recorded.mp4');
    const choices = [[primary, 'video/mp4']];
    if (!preview) choices.push([base + '-recorded.webm', 'video/webm']);
    let failures = 0;
    for (const [src, type] of choices) {
      const source = document.createElement('source');
      source.src = src; source.type = type;
      source.addEventListener('error', () => {
        if (revisions.get(video) === revision && ++failures === choices.length) showRecovery(video);
      });
      video.append(source);
    }
    recovery.get(video).querySelector('a').href = base + '-recorded.webm';
    video.poster = base + (phone.matches ? '-mobile-poster.png' : '-recorded-poster.png');
    video.width = phone.matches ? 720 : 1440;
    video.height = phone.matches ? 960 : 900;
    video.dataset.film = film;
    video.classList.toggle('mobile-film', phone.matches);
    video.load();
  }
  for (const video of [...videos, player]) {
    const box = document.createElement('div');
    box.className = 'video-recovery'; box.hidden = true;
    const message = document.createElement('p');
    message.setAttribute('role', 'status');
    message.textContent = 'The video could not load. Try again or download the full walkthrough.';
    const retry = document.createElement('button');
    retry.type = 'button'; retry.textContent = 'Retry video';
    const download = document.createElement('a');
    download.textContent = 'Download full walkthrough'; download.download = '';
    box.append(message, retry, download); video.after(box); recovery.set(video, box);
    retry.addEventListener('click', () => {
      configure(video, video.dataset.film);
      // Move focus before hiding the retry button; it returns if loading fails again.
      video.focus(); play(video);
    });
    video.addEventListener('error', () => showRecovery(video));
    video.addEventListener('playing', () => hideRecovery(video));
  }
  videos.forEach(video => configure(video, video.dataset.film));
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.intersectionRatio < 0.35) { video.pause(); continue; }
      if (reduce.matches || document.hidden || dialog.open || started.has(video)) continue;
      started.add(video); video.muted = true; play(video);
    }
  }, {threshold: [0, 0.35]});
  videos.forEach(video => {
    video.addEventListener('play', () => started.add(video)); observer.observe(video);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) [...videos, player].forEach(video => video.pause());
  });
  reduce.addEventListener('change', () => {
    if (reduce.matches) videos.forEach(video => video.pause());
  });
  document.querySelectorAll('[data-watch-video]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      const preview = button.closest('figure').querySelector('video');
      videos.forEach(video => video.pause());
      configure(player, preview.dataset.film); player.muted = true;
      document.querySelector('#cinema-title').textContent = button.dataset.watchVideo === 'folio' ? 'Folio / Document to answer' : 'Speedway / A complete checkout';
      document.querySelector('#cinema-description').textContent = button.closest('figcaption').querySelector('span').innerText.replace(/\n/g, ' ');
      dialog.showModal(); dialog.querySelector('.cinema-close').focus(); play(player);
    });
  });
  phone.addEventListener('change', () => {
    for (const video of [...videos, ...(dialog.open ? [player] : [])]) {
      const time = video.currentTime;
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = Math.min(time, Number.isFinite(video.duration) ? video.duration : time);
      }, {once:true});
      configure(video, video.dataset.film); started.add(video);
    }
  });
  dialog.querySelector('.cinema-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    revisions.set(player, (revisions.get(player) || 0) + 1);
    player.pause(); player.removeAttribute('src'); player.replaceChildren(); player.load();
    hideRecovery(player); opener?.focus({preventScroll:true});
  });
})();
