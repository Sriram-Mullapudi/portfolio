(() => {
  const videos = [...document.querySelectorAll('.product-video')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const started = new WeakSet();
  // Re-entry never overrides a visitor's pause choice.
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.intersectionRatio < 0.35) { video.pause(); continue; }
      if (reduce.matches || document.hidden || started.has(video)) continue;
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
})();
