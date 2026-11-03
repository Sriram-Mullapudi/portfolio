const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../portfolio-v3-assets');
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});
for(const kind of (process.argv[3] ? [process.argv[3]] : ['folio','speedway'])){
 const data=JSON.parse(fs.readFileSync(path.join(process.argv[2],kind+'-real-capture.json'),'utf8'));
 const p=await b.newPage({viewport:{width:720,height:960}});await p.setContent('<body style="margin:0"><canvas width="720" height="960"></canvas></body>');
 await p.evaluate(async({data,kind})=>{
 const ims=await Promise.all(data.frames.map(f=>new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.src='data:image/jpeg;base64,'+f.data;})));
 const c=document.querySelector('canvas').getContext('2d');const folio=kind==='folio';
 function txt(s,x,y,size=25,color='#e9edf1'){c.fillStyle=color;c.font=`${size}px Arial`;c.fillText(s,x,y);}
 function panel(im,sx,sy,sw,sh,x,y,w,h){c.save();c.beginPath();c.roundRect(x,y,w,h,14);c.clip();c.fillStyle=folio?'#faf9f6':'#14212b';c.fillRect(x,y,w,h);const scale=Math.min(w/sw,h/sh);c.drawImage(im,sx,sy,sw,sh,x+(w-sw*scale)/2,y+(h-sh*scale)/2,sw*scale,sh*scale);c.restore();}
 window.draw=t=>{let f=0;data.frames.forEach((v,i)=>{if(v.t<=t)f=i});const im=ims[f];c.fillStyle='#090e14';c.fillRect(0,0,720,960);txt(folio?'folio / In motion':'Speedway / In motion',28,48,30);txt('REAL APP · MOBILE DETAIL EDIT',28,83,16,'#9baab7');let title;
 if(folio){
 if(t<7.6){title='01 / Add your document';panel(im,270,225,1130,340,24,160,672,260);panel(im,280,570,600,160,24,448,672,260);txt('Upload → prepare → explore',28,780,26);}
 else if(t<13.3){title='02 / Ask a question';panel(im,420,670,830,200,24,170,672,260);panel(im,270,280,820,300,24,458,672,290);txt('The answer comes from your document.',28,810,22);}
 else if(t<18.6){title='03 / Read the answer';panel(im,285,310,710,240,24,180,672,320);panel(im,1115,275,285,300,155,530,410,310);}
 else{title='04 / Inspect the citation';panel(im,1136,425,243,245,24,180,672,650);txt('Original passage, in view.',28,865,24);}
 }else{
 if(t<8.36){title='01 / Build the basket';panel(im,175,225,670,310,24,170,672,310);panel(im,875,135,390,180,24,510,672,300);}
 else if(t<10){title='02 / Review the total';panel(im,875,140,390,180,24,170,672,300);panel(im,875,505,390,295,24,495,672,340);}
 else if(t<15){title='03 / Take payment';panel(im,440,180,390,460,74,170,572,675);}
 else{title='04 / Receipt, ready';panel(im,463,202,344,348,36,180,648,655);}
 }
 txt(title,28,132,30);txt(folio?'Fictional handbook · AI wait shortened':'Development profile · Sample cash sale',28,898,18,'#9baab7');
 c.fillStyle='#294339';c.fillRect(28,925,664,4);c.fillStyle='#84cfaa';c.fillRect(28,925,664*Math.min(1,t/data.duration),4);
 // A short fade creates a quiet loop seam without changing the recording.
 const fade=Math.max(0,1-t/.35,(t-(data.duration-.45))/.45);if(fade>0){c.fillStyle=`rgba(9,14,20,${Math.min(1,fade)})`;c.fillRect(0,0,720,960);}
 };
 },{data,kind});await p.evaluate(()=>draw(5));await p.screenshot({path:path.join(root,kind+'-mobile-poster.png')});
 const bytes=await p.evaluate(async duration=>{const stream=document.querySelector('canvas').captureStream(24);const rec=new MediaRecorder(stream,{mimeType:'video/mp4;codecs=avc1.42001f',videoBitsPerSecond:2100000});const chunks=[];rec.ondataavailable=e=>chunks.push(e.data);const end=new Promise(r=>rec.onstop=r);rec.start();const start=performance.now();await new Promise(r=>{function step(n){draw(Math.min(duration,(n-start)/1000));if(n-start<duration*1000)requestAnimationFrame(step);else r();}requestAnimationFrame(step)});rec.stop();await end;stream.getTracks().forEach(t=>t.stop());return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));},data.duration);
 fs.writeFileSync(path.join(root,kind+'-mobile.mp4'),Buffer.from(bytes));console.log(kind+' mobile: '+bytes.length);await p.close();
}await b.close()})().catch(e=>{console.error(e);process.exit(1)});
