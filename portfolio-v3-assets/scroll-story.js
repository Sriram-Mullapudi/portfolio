/* Scroll position is the timeline: stop scrolling and the scene stops exactly there. */
(()=>{
'use strict';
const scene=document.querySelector('.selected-strip'),hero=document.querySelector('#hero');
if(!scene||!hero)return;
const grid=scene.querySelector('.selected-grid'),cards=[...grid.children],controls=scene.querySelector('.showcase-controls'),buttons=[...controls.querySelectorAll('button')];
const media=matchMedia('(min-width:821px) and (min-height:620px) and (prefers-reduced-motion:no-preference)');
const clamp=n=>Math.max(0,Math.min(1,n));let frame=0;
function progress(){const top=scene.getBoundingClientRect().top;const distance=scene.offsetHeight-scene.querySelector('.showcase-sticky').offsetHeight;return clamp((82-top)/Math.max(1,distance))}
function render(){frame=0;if(!media.matches)return;
 const p=progress(),slide=clamp((p-.16)/.68),eased=slide*slide*(3-2*slide);
 scene.style.setProperty('--story-x',`${-100*eased}%`);scene.style.setProperty('--story-progress',p);
 cards.forEach((card,i)=>{card.style.setProperty('--preview-scale',1-.035*Math.abs(i-eased));buttons[i].setAttribute('aria-pressed',String(i===(slide<.5?0:1)))});
 const h=clamp(-hero.getBoundingClientRect().top/hero.offsetHeight);hero.style.setProperty('--hero-scroll-scale',1+h*.055);hero.style.setProperty('--hero-scroll-y',`${h*48}px`);
}
function schedule(){if(media.matches&&!frame)frame=requestAnimationFrame(render)}
function select(i){if(!media.matches)return;const top=scene.getBoundingClientRect().top+scrollY;const distance=scene.offsetHeight-scene.querySelector('.showcase-sticky').offsetHeight;scrollTo({top:top-82+distance*(i===0?.08:.92),behavior:'instant'});render()}
buttons.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
cards.forEach((card,i)=>card.addEventListener('focus',()=>{if(media.matches)select(i)}));
function sync(){scene.classList.toggle('story-enabled',media.matches);hero.classList.toggle('story-hero',media.matches);controls.hidden=!media.matches;if(!media.matches){scene.style.removeProperty('--story-x');cards.forEach(card=>card.style.removeProperty('--preview-scale'))}schedule()}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);media.addEventListener('change',sync);new ResizeObserver(schedule).observe(scene);sync();
})();
