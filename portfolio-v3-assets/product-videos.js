(() => {
  const videos = [...document.querySelectorAll('.product-video')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 700px)');
  const started = new WeakSet();
  const revisions = new WeakMap();
  const recovery = new WeakMap();
  const dialog = document.querySelector('#product-cinema');
  const player = dialog.querySelector('video');
  const chapters = {
    folio: [[0, 'Upload a document'], [7.64, 'Ask a question'], [18.6, 'Inspect the source']],
    speedway: [[0, 'Build the cart'], [8.36, 'Take payment'], [15.94, 'Review the receipt']]
  };
  const navigation = document.createElement('nav');
  navigation.className = 'cinema-chapters';
  navigation.setAttribute('aria-label', 'Walkthrough chapters');
  const replay = document.createElement('button');
  replay.type = 'button'; replay.className = 'cinema-replay';
  replay.textContent = 'Replay walkthrough ↻'; replay.hidden = true;
  document.querySelector('#cinema-description').before(navigation, replay);
  let pendingSeek = null;
  function seek(time) {
    if (player.readyState < 1) pendingSeek = time;
    else { pendingSeek = null; player.currentTime = time; }
    play(player);
  }
  function updateChapters() {
    const items = chapters[player.dataset.film] || [];
    let current = 0;
    items.forEach(([time], i) => { if (player.currentTime >= time) current = i; });
    [...navigation.children].forEach((button, i) => {
      if (i === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    replay.hidden = !player.ended;
  }
  function buildChapters(film) {
    pendingSeek = null; navigation.replaceChildren(); replay.hidden = true;
    chapters[film].forEach(([time, title], i) => {
      const button = document.createElement('button');
      button.type = 'button';
      const number = document.createElement('span');
      number.textContent = '0' + (i + 1); number.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.textContent = title;
      button.append(number, label);
      button.addEventListener('click', () => seek(time));
      navigation.append(button);
    });
    updateChapters();
  }
  player.addEventListener('loadedmetadata', () => {
    if (pendingSeek !== null) { player.currentTime = pendingSeek; pendingSeek = null; }
  });
  ['timeupdate', 'seeked', 'ended', 'play'].forEach(event => player.addEventListener(event, updateChapters));
  replay.addEventListener('click', () => { seek(0); navigation.querySelector('button')?.focus(); });
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
      if (reduce.matches || navigator.connection?.saveData || document.hidden || dialog.open || started.has(video)) continue;
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
      buildChapters(preview.dataset.film);
      document.querySelector('#cinema-title').textContent = button.dataset.watchVideo === 'folio' ? 'Folio / Document to answer' : 'Speedway / A complete checkout';
      document.querySelector('#cinema-description').textContent = preview.dataset.film === 'folio'
        ? 'Real Folio app · Fictional handbook · AI generation wait shortened. Follow the document, question and cited passage.'
        : 'Real Speedway app · Development profile · Sample cash sale. Follow the cart, payment and saved receipt.';
      dialog.showModal(); document.documentElement.classList.add('cinema-open');
      dialog.querySelector('.cinema-close').focus(); play(player);
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
    document.documentElement.classList.remove('cinema-open');
    pendingSeek = null; navigation.replaceChildren(); replay.hidden = true;
    revisions.set(player, (revisions.get(player) || 0) + 1);
    player.pause(); player.removeAttribute('src'); player.replaceChildren(); player.load();
    hideRecovery(player); opener?.focus({preventScroll:true});
  });
})();
