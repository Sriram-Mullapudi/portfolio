// Edit CDP screencast frames into a silent product film, without changing app content.
// Input JSON: frames[{t,data(base64 JPEG)}], moves[{t,x,y,click}], chapters[{t,text,detail}], duration.
const fs=require('node:fs');const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const capture=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
 const out=path.resolve(process.argv[3]);
 const preview=process.argv.includes('--preview');
 const b=await chromium.launch({headless:true,channel:'msedge'});
 const p=await b.newPage({viewport:{width:1440,height:900}});
 await p.setContent('<body style="margin:0;background:#090e14"><canvas width="1440" height="900"></canvas></body>');
 await p.evaluate(async data=>{
  const images=await Promise.all(data.frames.map(f=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.src='data:image/jpeg;base64,'+f.data;})));
  const c=document.querySelector('canvas').getContext('2d');
  const ease=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
  window.draw=t=>{
   let frame=0,chapter=0;data.frames.forEach((f,i)=>{if(f.t<=t)frame=i;});data.chapters.forEach((f,i)=>{if(f.t<=t)chapter=i;});
   const ch=data.chapters[chapter];const progress=ease((t-ch.t)/1.1);
   const zoom=data.title?.startsWith('Folio') ? 1.02 + (chapter > 0 ? .06*progress : 0) : chapter===0?1.02:chapter===1?1.02+.27*progress:1.29+.17*progress;
   c.fillStyle='#090e14';c.fillRect(0,0,1440,900);
   c.fillStyle='#eff3f5';c.font='600 24px Arial';c.fillText(data.title || 'Speedway / In motion',44,41);
   c.fillStyle='#6fd6a5';c.font='14px Arial';c.fillText(data.badge || 'REAL APP · SAMPLE SALE',1110,38);
   c.save();c.beginPath();c.roundRect(44,68,1352,762,14);c.clip();c.fillStyle='#14202b';c.fillRect(44,68,1352,762);
   const scale=762/900*zoom;const ox=720-1440*scale/2,oy=449-900*scale/2;
   c.translate(ox,oy);c.scale(scale,scale);c.drawImage(images[frame],0,0,1440,900);
   const m=[...data.moves].reverse().find(m=>m.t<=t);
   if(m&&chapter<2){c.save();c.translate(m.x,m.y);const click=[...data.moves].reverse().find(m=>m.click&&m.t<=t&&t-m.t<.6);if(click){c.strokeStyle='#78e4b1';c.lineWidth=3;c.globalAlpha=1-(t-click.t)/.6;c.beginPath();c.arc(0,0,12+35*(t-click.t)/.6,0,7);c.stroke();c.globalAlpha=1;}c.fillStyle='#fff';c.strokeStyle='#09121a';c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(3,24);c.lineTo(10,17);c.lineTo(20,16);c.closePath();c.fill();c.stroke();c.restore();}
   c.restore();c.fillStyle='#edf3f7';c.font='600 20px Arial';c.fillText(ch.text,44,869);c.fillStyle='#9dabb8';c.font='16px Arial';c.fillText(ch.detail,430,868);c.fillStyle='#284538';c.fillRect(44,891,1352,3);c.fillStyle='#6fd6a5';c.fillRect(44,891,1352*Math.min(t/data.duration,1),3);
  };
 },capture);
 if(preview) await p.evaluate(folio=>{
   const original=window.draw;
   window.draw=t=>{const segments=folio?[4,13.4,19]:[4.5,10,17];original(segments[Math.min(2,Math.floor(t/3))]+t%3);};
 },capture.title?.startsWith('Folio'));
 if(!preview){await p.evaluate(()=>draw(2));await p.screenshot({path:out.replace(/\.(webm|mp4)$/, '-poster.png')});}
 const bytes=await p.evaluate(async ({duration,mimeType})=>{const stream=document.querySelector('canvas').captureStream(30);const rec=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:3000000});const chunks=[];rec.ondataavailable=e=>chunks.push(e.data);const done=new Promise(r=>rec.onstop=r);rec.start();const start=performance.now();await new Promise(resolve=>{function step(now){draw(Math.min(duration,(now-start)/1000));if(now-start<duration*1000)requestAnimationFrame(step);else resolve();}requestAnimationFrame(step);});rec.stop();await done;stream.getTracks().forEach(t=>t.stop());return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));},{duration:preview?9:capture.duration,mimeType:out.endsWith('.mp4')?'video/mp4;codecs=avc1.42001f':'video/webm;codecs=vp9'});
 fs.writeFileSync(out,Buffer.from(bytes));console.log(out+': '+bytes.length+' bytes');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
