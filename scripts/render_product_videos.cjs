const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = path.resolve(__dirname, '../portfolio-v3-assets');

// These are illustrative product animations using fictional sample data.
// Rendered with Canvas; no live payment, upload, or model request is performed.
function scene(kind) {
  const canvas = document.querySelector('canvas');
  const c = canvas.getContext('2d');
  const pos = kind === 'speedway';
  const accent = pos ? '#38d58a' : '#81639b';
  const ink = pos ? '#edf4f8' : '#292534';
  const muted = pos ? '#9badbb' : '#82798a';
  const ease = x => { x = Math.max(0, Math.min(1, x)); return x*x*(3-2*x); };
  function box(x,y,w,h,color,r=12) {c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  function text(s,x,y,size=20,color=ink,weight=400) {c.fillStyle=color;c.font=`${weight} ${size}px Arial`;c.fillText(s,x,y);}
  function line(x,y,w,color) {box(x,y,w,1,color,0);}
  function cursor(x,y,click) {c.save();c.translate(x,y);if(click>0){c.strokeStyle=accent;c.lineWidth=3;c.globalAlpha=1-click;c.beginPath();c.arc(0,0,12+click*30,0,7);c.stroke();c.globalAlpha=1;}c.fillStyle=pos?'#fff':'#342641';c.strokeStyle=pos?'#16212b':'#fff';c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(3,24);c.lineTo(10,17);c.lineTo(20,16);c.closePath();c.fill();c.stroke();c.restore();}
  function tick(x,y) {c.strokeStyle=accent;c.lineWidth=4;c.beginPath();c.moveTo(x-10,y);c.lineTo(x-2,y+8);c.lineTo(x+13,y-10);c.stroke();}
  function wrap(s,x,y,width,size=22,color=ink) {let row='';for(const w of s.split(' ')){c.font=`${size}px Arial`;if(c.measureText(row+w).width>width){text(row,x,y,size,color);y+=size*1.5;row='';}row+=w+' ';}text(row,x,y,size,color);}
  window.draw = t => {
    c.clearRect(0,0,1280,720);
    box(0,0,1280,720,pos?'#0e161e':'#faf8f5',0);
    box(0,0,1280,66,pos?'#15212d':'#efebe6',0);
    text(pos?'Speedway':'folio',30,43,28,ink,700);
    text(pos?'REGISTER / 01':'YOUR PRIVATE WORKSPACE',220,40,13,muted,600);
    box(1020,20,230,28,pos?'#183c31':'#e6dfed',14);
    text(pos?'LOCAL CHECKOUT':'LOCAL AI · SAMPLE DOCUMENT',1034,39,12,pos?'#77e4b1':accent,600);
    const stage = t<5?0:t<11?1:2;
    const labels=pos?['01  Build the cart','02  Review & pay','03  Sale complete']:['01  Add a document','02  Ask a question','03  Inspect the source'];
    labels.forEach((s,i)=>text(s,32+i*416,106,17,i===stage?accent:muted,i===stage?700:400));
    line(32,126,1216,pos?'#2a3642':'#dfd8e2');
    box(32,126,1216*Math.min(t/18,1),3,accent,0);
    if(pos) {
      box(30,154,790,505,'#111d27');
      box(50,176,750,48,'#1b2a37',8);text('Search products or scan a barcode',70,207,19,muted);
      ['All products','Beverages','Food','Grocery'].forEach((s,i)=>{box(50+i*183,240,170,36,i===0?'#285640':'#1b2a37',6);text(s,63+i*183,264,16,i===0?'#9ae8bd':muted);});
      const products=[['Coffee small',1.29],['Breakfast sandwich',3.99],['Bottled water',1.59],['Donut',1.29],['Cola 20 oz',2.19],['Chips',2.49]];
      const count=t<2?0:t<3.6?1:t<5?2:3;
      products.forEach(([name,price],i)=>{const x=50+(i%3)*250,y=294+Math.floor(i/3)*155;box(x,y,234,138,'#1c2a37');box(x+16,y+16,34,34,i<count&&i<3?'#265c43':'#304251',9);text(i<count&&i<3?'✓':'+',x+26,y+40,23,i<count&&i<3?accent:muted);text(name,x+16,y+83,19,ink,600);text('$'+price.toFixed(2),x+16,y+115,20,accent,600);});
      box(842,154,408,505,'#182530');text('CURRENT SALE',864,188,14,muted,600);text(count+' items',1143,188,15,muted);
      let subtotal=0;
      for(let i=0;i<count;i++){subtotal+=products[i][1];text(products[i][0],864,238+i*56,19);text('$'+products[i][1].toFixed(2),1160,238+i*56,19);line(864,253+i*56,362,'#2b3a46');}
      if(!count)text('Your next sale starts here.',864,249,19,muted);
      const tax=Math.round(subtotal*.07*100)/100,total=subtotal+tax;
      text('Subtotal',864,458,17,muted);text('$'+subtotal.toFixed(2),1160,458,18);
      text('Tax (sample 7%)',864,493,17,muted);text('$'+tax.toFixed(2),1160,493,18);
      line(864,512,362,'#344451');text('Total',864,549,26,ink,700);text('$'+total.toFixed(2),1145,549,26,ink,700);
      box(864,575,364,60,accent,8);text('Charge $'+total.toFixed(2),964,613,22,'#0b3020',700);
      if(t>=7.2) {
        box(0,142,1280,525,'#080f18bb',0);const fade=ease((t-7.2)/.6);c.save();c.globalAlpha=fade;
        box(400,190,480,438,'#1b2b38',18);
        if(t<11){text('Complete checkout',444,243,30,ink,700);text('3 items · Total $7.35',444,283,21,muted);text('PAYMENT METHOD',444,332,13,muted,600);box(442,351,396,62,'#294637',8);text('Cash',466,390,23);tick(803,380);text('Cash received: $10.00',444,453,21);text('Change due: $2.65',444,489,21,accent);box(442,525,396,63,accent,8);text('Confirm payment',540,565,22,'#0b3020',700);}
        else {box(596,224,88,88,'#294637',44);tick(640,268);text('Sale complete',480,369,36,ink,700);text('Payment recorded locally',480,413,21,muted);line(444,446,392,'#344451');text('Paid',444,485,21);text('$10.00',740,485,21);text('Change',444,526,21);text('$2.65',752,526,21,accent);text('Ready for the next customer.',476,584,20,muted);}
        c.restore();
      }
      const points=[[0,720,630],[1.5,153,345],[3.1,403,345],[4.5,653,345],[6.5,1020,601],[9.5,640,554],[11.5,920,600]];
      if(t<12){let a=points[0],b=points.at(-1);for(let i=1;i<points.length;i++){if(t<points[i][0]){a=points[i-1];b=points[i];break;}}const k=ease((t-a[0])/(b[0]-a[0]));cursor(a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k,(t%1.6)/1.6<.25?(t%1.6)/.4:0);}
    } else {
      box(30,154,220,505,'#f0ece7');text('+  New question',49,205,21,accent,600);text('Ask & explore',52,265,18,muted);box(44,289,192,44,'#e5dced',7);text('My documents',57,317,18,accent,600);text('Saved conversations',52,373,17,muted);text('A LITTLE CLARITY',52,506,11,muted,600);text('Your knowledge.',52,546,23,accent);text('A little closer.',52,578,23,accent);
      if(t<5.5){text('Good things to know.',286,213,36,ink,600);text('A home for your reports, notes, and ideas.',286,249,19,muted);box(284,282,932,145,'#eee8f3');text('↑',322,344,42,accent);text('Drop your documents here',389,331,24,ink,600);text('PDF, text, or Markdown',389,367,18,muted);box(1020,322,168,48,'#fff',7);text('Browse files',1045,353,18,accent);
        if(t>1.6){const k=ease((t-1.6)/.5);c.save();c.globalAlpha=k;box(284,456+(1-k)*15,932,105,'#fff');box(305,479,52,52,'#eee8f3',8);text('TXT',315,511,17,accent,600);text('Sample team handbook.txt',380,496,22,ink,600);text(t<3.6?'Indexing document…':'Ready to explore',380,532,18,t<3.6?muted:accent);box(1020,492,160,8,'#e9e2ef',4);box(1020,492,160*ease((t-1.8)/1.6),8,accent,4);c.restore();}
        cursor(1100,345,t>1&&t<1.6?(t-1)/.6:0);
      } else {
        text('Ask your documents.',286,211,35,ink,600);text('Collection: Sample team handbook',286,247,18,muted);
        box(284,277,932,65,'#eee8f3');const question='How do I request time off?';text(question.slice(0,Math.floor((t-5.5)*19)),308,317,23,ink,600);
        if(t>7.6){box(284,363,932,233,'#fff');text(t<9?'Finding relevant passages…':'ANSWER FROM YOUR DOCUMENT',310,400,t<9?21:13,t<9?muted:accent,600);
          if(t>=9){const answer='Submit your request through the team portal at least two weeks in advance. Your manager reviews and approves the dates.';wrap(answer.slice(0,Math.floor((t-9)*105)),310,441,t>12.3?350:850,t>12.3?19:23);if(t>10.8){box(310,538,316,36,'#eee8f3',6);text('[1] Team handbook · Time off',324,562,17,accent,600);}}
        }
        if(t>12.3){const k=ease((t-12.3)/.6);c.save();c.globalAlpha=k;box(705+(1-k)*70,354,511,263,'#eae2f0',12);text('SOURCE 01 / TIME OFF',733,392,14,accent,700);wrap('“Requests should be submitted in the team portal at least two weeks before the planned leave.”',733,436,450,22);text('Sample team handbook.txt',733,574,16,muted);c.restore();}
        if(t<13)cursor(t<11?1136:550,t<11?310:558,t>11.7?(t-11.7)/1.3:0);
      }
    }
    text('ILLUSTRATIVE WORKFLOW · FICTIONAL SAMPLE DATA',32,696,12,muted,600);
    text(pos?'Add → Review → Checkout':'Upload → Ask → Verify',965,696,14,accent,600);
  };
}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 for(const kind of ['folio','speedway']) {
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  await page.setContent('<html><body style="margin:0"><canvas width="1280" height="720"></canvas></body></html>');
  await page.evaluate(scene,kind);
  await page.evaluate(()=>window.draw(0));
  await page.screenshot({path:path.join(output,kind+'-demo-poster.png')});
  const data=await page.evaluate(async()=>{
    const canvas=document.querySelector('canvas');const stream=canvas.captureStream(30);
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:2200000});
    const chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);
    const done=new Promise(resolve=>recorder.onstop=resolve);recorder.start();const start=performance.now();
    await new Promise(resolve=>{function frame(now){window.draw(Math.min(18,(now-start)/1000));if(now-start<18000)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
    recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());
    return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
  });
  fs.writeFileSync(path.join(output,kind+'-demo.webm'),Buffer.from(data));
  console.log(kind+': '+data.length+' bytes');await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
