(() => {
  const study = document.querySelector('.register-study');
  const view = study.querySelector('.register-view');
  const controls = study.querySelector('.register-controls');
  const stage = view.querySelector('.register-stage');
  const slider = controls.querySelector('input');
  const toggle = controls.querySelector('button');
  let drag = null;
  const entrance = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      view.classList.add('unfolding');
      entrance.disconnect();
    }
  }, {threshold: .35});
  entrance.observe(stage);
  function finishEntrance() {
    entrance.disconnect();
    view.classList.remove('unfolding');
  }
  study.addEventListener('pointerdown', finishEntrance, {once:true});
  study.addEventListener('keydown', finishEntrance, {once:true});
  view.addEventListener('animationend', finishEntrance, {once:true});
  function rotate(angle) {
    slider.value = String(angle);
    view.style.setProperty('--angle', `${slider.value}deg`);
  }
  function assemble(closed) {
    view.classList.toggle('is-assembled', closed);
    toggle.textContent = closed ? 'Separate layers' : 'Assemble layers';
  }
  slider.addEventListener('input', () => rotate(slider.value));
  toggle.addEventListener('click', () => assemble(!view.classList.contains('is-assembled')));
  study.querySelector('fieldset').addEventListener('change', event => {
    view.dataset.layer = event.target.value;
    assemble(false);
  });
  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = {id:event.pointerId, x:event.clientX, angle:Number(slider.value)};
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', event => {
    if (drag?.id === event.pointerId) rotate(Math.round(drag.angle + (event.clientX - drag.x) * .45));
  });
  stage.addEventListener('lostpointercapture', () => { drag = null; });
  controls.hidden = false;
})();
