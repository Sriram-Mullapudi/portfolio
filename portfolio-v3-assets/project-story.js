/* Progressive enhancement: the complete story remains readable without scripts. */
(() => {
  const stories = [...document.querySelectorAll('.project-story')];
  const motion = matchMedia('(min-width: 1100px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)');
  let frame = 0;
  function update() {
    frame = 0;
    for (const story of stories) {
      const film = story.querySelector('.product-film');
      // A tall error message or zoomed text must never trap controls offscreen.
      const enabled = motion.matches && film.offsetHeight < innerHeight - 150;
      story.classList.toggle('story-enhanced', enabled);
      const chapters = [...story.querySelectorAll('.story-chapter')];
      let active = 0;
      chapters.forEach((chapter, i) => {
        if (chapter.getBoundingClientRect().top < innerHeight * .55) active = i;
      });
      chapters.forEach((chapter, i) => chapter.classList.toggle('is-current', enabled && i === active));
      story.style.setProperty('--story-progress', String((active + 1) / chapters.length));
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  motion.addEventListener('change', schedule);
  const observer = new ResizeObserver(schedule);
  stories.forEach(story => observer.observe(story.querySelector('.product-film')));
  update();
})();
