/* UI enhancements. All written content remains owned by index.html. */
(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
const easing='cubic-bezier(.22,1,.36,1)',running=new Map();
function animate(el,frames,options={},owner=el){
 if(!el||reduced.matches||document.hidden||owner.classList?.contains('craft-offscreen'))return;
 const a=el.animate(frames,{duration:560,easing,...options});running.set(a,owner);
 a.finished.catch(()=>{}).finally(()=>running.delete(a));return a;
}
function stop(owner){for(const [a,root] of running)if(!owner||root===owner||owner.contains(root))a.cancel()}
const offscreen=new IntersectionObserver(entries=>entries.forEach(e=>{e.target.classList.toggle('craft-offscreen',!e.isIntersecting);if(!e.isIntersecting)stop(e.target)}));
qa('.selected-card,.architecture,.event-scene,.toolkit-layout').forEach(el=>offscreen.observe(el));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});reduced.addEventListener('change',()=>{if(reduced.matches)stop()});
// A single event-driven progress/section calculation; no perpetual animation loop.
const progress=document.createElement('div');progress.className='page-progress';progress.setAttribute('aria-hidden','true');document.body.prepend(progress);
const nav=q('.nav'),sections=['work','projects','stack','life','contact'].map(id=>document.getElementById(id));let scrollFrame=0;
function updateScroll(){scrollFrame=0;const range=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${range>0?Math.min(1,Math.max(0,scrollY/range)):0})`;nav.classList.toggle('is-scrolled',scrollY>16);let current='';for(const section of sections)if(section.getBoundingClientRect().top<=innerHeight*.38)current=section.id;qa('.nav-links a,.menu-items a').forEach(a=>{if(a.hash==='#'+current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}
function scheduleScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll)}
addEventListener('scroll',scheduleScroll,{passive:true});addEventListener('resize',scheduleScroll);new ResizeObserver(scheduleScroll).observe(document.body);updateScroll();
// Finite emphasis only; the text is never counted up or replaced.
const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;reveal.unobserve(e.target);animate(e.target,[{opacity:.35,translate:'0 10px'},{opacity:1,translate:'0 0'}],{duration:580,delay:Number(e.target.dataset.craftDelay||0)})}),{threshold:.35});
qa('.metrics').forEach(group=>qa('.metric strong',group).forEach((el,i)=>{el.dataset.craftDelay=i*65;reveal.observe(el)}));
// Dialogs keep native modality, focus trapping and Escape. Animate their presentation.
qa('dialog').forEach(dialog=>{
 new MutationObserver(()=>{if(!dialog.open)return;animate(dialog,[{opacity:0,translate:'0 10px',scale:'.985'},{opacity:1,translate:'0 0',scale:'1'}],{duration:280},dialog);if(dialog.id==='menu-dialog')qa('.menu-items a',dialog).forEach((a,i)=>animate(a,[{opacity:.1,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:300,delay:35*i},dialog))}).observe(dialog,{attributes:true,attributeFilter:['open']});
 dialog.addEventListener('close',()=>stop(dialog));
});
// A routed signal enters each preview once per mouse entry or keyboard focus.
qa('.selected-card').forEach((card,index)=>{
 function play(){stop(card);if(card.classList.contains('craft-offscreen'))return;const nodes=qa('.plate-nodes>*',card);const groups=index===0?[[nodes[0]],[nodes[1],nodes[2]],[nodes[3]],[nodes[4]]]:nodes.map(n=>[n]);groups.forEach((group,i)=>group.forEach(n=>animate(n,[{fill:'#111a24',stroke:'#738797'},{fill:'#39232e',stroke:'#e98b93',offset:.4},{fill:'#111a24',stroke:'#738797'}],{duration:480,delay:i*150},card)));qa('.plate-flow path',card).forEach(path=>animate(path,[{strokeDashoffset:100,opacity:0},{opacity:1,offset:.15},{strokeDashoffset:0,opacity:0}],{duration:1000,easing:'linear'},card));animate(q('.selected-proof',card),[{color:'#bdc5cd'},{color:'#eeece7',offset:.4},{color:'#bdc5cd'}],{duration:1050},card)}
 card.addEventListener('pointerenter',()=>{if(fine.matches)play()});card.addEventListener('focus',play);card.addEventListener('pointerleave',()=>stop(card));card.addEventListener('blur',()=>stop(card));
});
const ns='http://www.w3.org/2000/svg';function svgEl(name,attributes){const e=document.createElementNS(ns,name);Object.entries(attributes).forEach(([k,v])=>e.setAttribute(k,String(v)));return e}
// Connectors follow the actual DOM node positions, including two parallel retrieval branches.
qa('.architecture').forEach((arch,index)=>{
 const flow=q('.arch-flow',arch),nodes=qa('.arch-node',arch),svg=svgEl('svg',{'class':'arch-connections','aria-hidden':'true'});flow.prepend(svg);
 const pairs=index===0?[[0,1],[0,2],[1,3],[2,3],[3,4]]:[[0,1],[1,2]];
 const edges=pairs.map(([from,to])=>{const base=svgEl('path',{'class':'arch-connector'}),signal=svgEl('path',{'class':'arch-signal',pathLength:100});svg.append(base,signal);return{from,to,base,signal}});
 function layout(){const r=flow.getBoundingClientRect();if(!r.width||!r.height)return;svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);for(const e of edges){const a=nodes[e.from].getBoundingClientRect(),b=nodes[e.to].getBoundingClientRect(),x=a.left+a.width/2-r.left,y=a.bottom-r.top,xx=b.left+b.width/2-r.left,yy=b.top-r.top,m=(y+yy)/2,d=`M${x} ${y} C${x} ${m} ${xx} ${m} ${xx} ${yy}`;e.base.setAttribute('d',d);e.signal.setAttribute('d',d)}}
 new ResizeObserver(layout).observe(flow);arch.closest('details').addEventListener('toggle',layout);let state='';
 function signal(edge,reverse=false,delay=0){animate(edge.signal,[{strokeDashoffset:reverse?-100:100,opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.85},{strokeDashoffset:reverse?100:-100,opacity:0}],{duration:780,delay,easing:'linear'},arch)}
 function reflect(){const selected=nodes.map((n,i)=>n.classList.contains('diagram-active')?i:-1).filter(i=>i>=0),key=selected.join(',');if(key===state)return;state=key;stop(arch);edges.forEach(e=>{const active=selected.includes(e.to);e.base.style.stroke=active?'#c7848c':'#4a5665';if(active)signal(e)});if(index===1&&selected.includes(2)){edges.slice().reverse().forEach((e,i)=>signal(e,true,820+i*240))}}
 new MutationObserver(reflect).observe(flow,{subtree:true,attributes:true,attributeFilter:['class']});layout();
});
// Payment trace stays driven by its existing state and existing retry text.
const event=q('.event-scene'),eventSvg=q('svg',event),packet=svgEl('circle',{'class':'trace-packet',r:3.5,cx:60,cy:53,opacity:0});eventSvg.append(packet);let paymentStep=-1;
const paymentNodes=qa('.event-node',event),traceItems=qa('#trace-flow li');
function paymentState(){const count=traceItems.filter(n=>n.classList.contains('active')).length;if(count===paymentStep)return;paymentStep=count;traceItems.forEach((n,i)=>{n.classList.toggle('trace-current',i===count-1);n.classList.toggle('trace-retrying',i===3&&count===4&&q('#trace-log').textContent.includes('times out'))});paymentNodes.forEach((n,i)=>n.classList.toggle('trace-current',i===Math.min(count-1,3)));stop(event);const xs=[60,249,446,640,640];if(count>1&&count<5){packet.setAttribute('cx',xs[count-2]);animate(packet,[{translate:'0 0',opacity:0},{opacity:1,offset:.1},{translate:`${xs[count-1]-xs[count-2]}px 0`,opacity:0}],{duration:580,easing:'linear'},event)}if(count===4&&q('#trace-log').textContent.includes('times out'))animate(paymentNodes[3],[{opacity:1},{opacity:.4},{opacity:1}],{duration:600},event)}
new MutationObserver(paymentState).observe(q('#trace-flow'),{subtree:true,attributes:true,attributeFilter:['class']});
// Five decorative connected layers map to the five existing toolkit categories.
const toolkit=q('.toolkit-layout'),rows=qa('.skill-row',toolkit),layerSvg=svgEl('svg',{'class':'connected-layers','viewBox':'0 0 300 170','aria-hidden':'true'});
const wire=svgEl('path',{'class':'stack-wire',d:'M24 20 V150'}),pulse=svgEl('path',{'class':'stack-pulse',d:'M24 20 V150',pathLength:100});layerSvg.append(wire,pulse);
const layers=rows.map((row,i)=>{const y=10+i*31;const line=svgEl('path',{'class':'stack-wire',d:`M24 ${y+10} H56`});const dot=svgEl('circle',{'class':'stack-dot',cx:24,cy:y+10,r:3});const bar=svgEl('path',{'class':'stack-layer',d:`M56 ${y} H${270-i*14} L${284-i*14} ${y+10} L${270-i*14} ${y+20} H56 Z`});layerSvg.append(line,dot,bar);return{dot,bar}});
q('.toolkit-intro').insertBefore(layerSvg,q('#skill-detail'));
qa('.skill').forEach(button=>button.addEventListener('click',()=>{const pressed=button.getAttribute('aria-pressed')==='true',selected=pressed?rows.indexOf(button.closest('.skill-row')):-1;toolkit.classList.toggle('skills-has-selection',pressed);rows.forEach((row,i)=>{row.classList.toggle('layer-selected',i===selected);layers[i].bar.classList.toggle('layer-selected',i===selected);layers[i].dot.classList.toggle('layer-selected',i===selected)});stop(toolkit);if(pressed){animate(pulse,[{strokeDashoffset:100,opacity:0},{opacity:1,offset:.1},{strokeDashoffset:-100,opacity:0}],{duration:700,easing:'linear'},toolkit);animate(layers[selected].bar,[{translate:'0 0'},{translate:'4px 0',offset:.45},{translate:'0 0'}],{duration:500},toolkit)}}));
// Mouse drag is optional. Touch keeps native scrolling; vertical wheel is never intercepted.
const strip=q('#filmstrip');let drag=null,ignoreClickUntil=0;
qa('.frame img').forEach(img=>img.draggable=false);
strip.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:strip.scrollLeft,moved:false}});
strip.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy)){drag.moved=true;strip.setPointerCapture(e.pointerId);strip.classList.add('is-dragging')}if(drag.moved){e.preventDefault();strip.scrollLeft=drag.left-dx}});
function endDrag(e){if(!drag||e.pointerId!==drag.id)return;if(drag.moved){ignoreClickUntil=performance.now()+350;if(strip.hasPointerCapture(e.pointerId))strip.releasePointerCapture(e.pointerId)}drag=null;strip.classList.remove('is-dragging')}
strip.addEventListener('pointerup',endDrag);strip.addEventListener('pointercancel',endDrag);strip.addEventListener('lostpointercapture',()=>{drag=null;strip.classList.remove('is-dragging')});
strip.addEventListener('click',e=>{if(performance.now()<ignoreClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
strip.addEventListener('wheel',e=>{if(e.shiftKey&&Math.abs(e.deltaX)<1&&strip.scrollWidth>strip.clientWidth){const before=strip.scrollLeft;strip.scrollLeft+=e.deltaY;if(strip.scrollLeft!==before)e.preventDefault()}},{passive:false});
function filmState(){q('#film-prev').disabled=strip.scrollLeft<2;q('#film-next').disabled=strip.scrollLeft>=strip.scrollWidth-strip.clientWidth-2}
strip.addEventListener('scroll',filmState,{passive:true});new ResizeObserver(filmState).observe(strip);filmState();
const photo=q('#lightbox-img'),stage=q('#lightbox-stage');function photoReady(){stage.classList.remove('is-loading');stage.setAttribute('aria-busy','false');if(q('#lightbox').open)animate(photo,[{opacity:.25,scale:'.985'},{opacity:1,scale:'1'}],{duration:300},q('#lightbox'))}photo.addEventListener('load',photoReady);photo.addEventListener('error',()=>{stage.classList.remove('is-loading');stage.setAttribute('aria-busy','false')});new MutationObserver(()=>{stage.classList.add('is-loading');stage.setAttribute('aria-busy','true');if(photo.complete&&photo.naturalWidth)photoReady()}).observe(photo,{attributes:true,attributeFilter:['src']});
// Preserve the existing copy feedback verbatim; highlight the control on success.
new MutationObserver(()=>{if(q('#toast').hidden)return;if(q('#toast').textContent==='Email copied.'){const button=q('#copy-email');button.classList.add('copy-success');setTimeout(()=>button.classList.remove('copy-success'),1800)}animate(q('#toast'),[{opacity:0,translate:'0 6px'},{opacity:1,translate:'0 0'}],{duration:220})}).observe(q('#toast'),{attributes:true,attributeFilter:['hidden'],childList:true});
})();

// Cancel the pending conceptual trace when it is no longer being viewed.
(()=>{function cancelTrace(){traceGeneration++;document.querySelectorAll('#trace-run,#trace-retry').forEach(b=>b.disabled=false)}new IntersectionObserver(e=>{if(!e[0].isIntersecting)cancelTrace()},{threshold:0}).observe(document.querySelector('.trace'));document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelTrace()})})();

// Wrap keyboard focus inside each native dialog without interfering with terminal completion.
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('keydown',e=>{if(e.key!=='Tab'||e.defaultPrevented)return;const items=[...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.closest('[hidden]'));if(!items.length){e.preventDefault();return}const first=items[0],last=items[items.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog)){e.preventDefault();first.focus()}}));

// Shared project URLs open their case study, including browser back/forward navigation.
(()=>{
 function openLinkedProject(){
  const id=location.hash.slice(1);
  const project=document.getElementById(id);
  if(!project?.matches('details.project'))return;
  project.open=true;
  requestAnimationFrame(()=>project.scrollIntoView({block:'start',behavior:'instant'}));
 }
 addEventListener('hashchange',openLinkedProject);
 openLinkedProject();
})();
