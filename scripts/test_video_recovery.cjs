const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 const target=file===root?path.join(root,'index.html'):file;
 if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404).end();return;}
 const data=fs.readFileSync(target),type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.mp4':'video/mp4','.webm':'video/webm','.png':'image/png'}[path.extname(target)]||'application/octet-stream';
 const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
 if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),data.length-1):data.length-1;if(start>=data.length){res.writeHead(416,{'Content-Range':'bytes */'+data.length}).end();return;}res.writeHead(206,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1));}
 else{res.writeHead(200,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Length':data.length});res.end(data);} 
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({headless:true,channel:'msedge'});try{
 const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*preview.mp4',r=>r.abort('failed'));await p.goto(`http://127.0.0.1:${server.address().port}`);
 const preview=p.locator('.product-video').first(),recovery=p.locator('.product-film').first().locator('.video-recovery');
 await preview.evaluate(v=>v.play().catch(()=>{}));await recovery.waitFor({state:'visible'});
 assert((await recovery.locator('a').getAttribute('href')).endsWith('folio-recorded.webm'));
 await p.unroute('**/*preview.mp4');await recovery.getByRole('button',{name:'Retry video'}).click();await p.waitForFunction(()=>document.querySelector('.product-video').currentTime>1);
 assert(await recovery.isHidden());let media=await preview.evaluate(v=>({src:v.currentSrc,d:v.duration}));assert(media.src.endsWith('folio-mobile-preview.mp4'));assert(media.d>8&&media.d<10);
 await p.route('**/*recorded.*',r=>r.abort('failed'));await p.route('**/*-mobile.mp4',r=>r.abort('failed'));
 await p.locator('[data-watch-video="folio"]').click();await p.locator('#product-cinema .video-recovery').waitFor({state:'visible'});await p.keyboard.press('Escape');assert(await p.locator('#product-cinema .video-recovery').isHidden());
 await p.unroute('**/*recorded.*');await p.unroute('**/*-mobile.mp4');await p.locator('[data-watch-video="folio"]').click();await p.waitForFunction(()=>document.querySelector('#product-cinema video').currentTime>1);assert(await p.locator('#product-cinema .video-recovery').isHidden());assert(await p.locator('#product-cinema video').evaluate(v=>v.duration>18));await p.keyboard.press('Escape');
 await p.setViewportSize({width:1440,height:900});await preview.scrollIntoViewIfNeeded();await preview.evaluate(v=>v.play());await p.waitForFunction(()=>document.querySelector('.product-video').currentTime>1);media=await preview.evaluate(v=>({src:v.currentSrc,d:v.duration}));assert(media.src.endsWith('folio-preview.mp4'));assert(media.d<10);assert.deepEqual(errors,[]);
 console.log('PASS: actual failed requests, visible recovery/download, successful retry, modal recovery reset, short mobile/desktop previews and full walkthrough.');
}finally{await b.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
