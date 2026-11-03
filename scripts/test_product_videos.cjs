// Optional real-media browser regression checks. Requires Playwright + Edge.
const assert=require('node:assert/strict');
const path=require('node:path');const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 for(const film of ['folio','speedway']){
  const button=p.locator(`[data-watch-video="${film}"]`);await button.scrollIntoViewIfNeeded();assert(await p.locator(`video[data-film="${film}"]`).first().evaluate(v=>v.paused));
  await button.click();await p.waitForFunction(()=>document.querySelector('#product-cinema video').currentTime>1);
  const info=await p.locator('#product-cinema video').evaluate(v=>({src:v.currentSrc,w:v.videoWidth,h:v.videoHeight,duration:v.duration}));assert(info.src.endsWith(film+'-mobile.mp4'));assert.equal(info.w,720);assert.equal(info.h,960);assert(info.duration>18);
  await p.keyboard.press('Escape');assert(await button.evaluate(e=>e===document.activeElement));assert(await p.locator('#product-cinema video').evaluate(v=>v.paused));
 }
 await p.locator('[data-watch-video="folio"]').click();await p.waitForFunction(()=>document.querySelector('#product-cinema video').currentTime>2);
 await p.setViewportSize({width:844,height:390});assert(await p.locator('#product-cinema video').evaluate(v=>v.paused));
 await p.locator('#product-cinema video').evaluate(v=>v.play());await p.waitForFunction(()=>document.querySelector('#product-cinema video').videoWidth===1440);
 assert((await p.locator('#product-cinema video').evaluate(v=>v.currentSrc)).endsWith('folio-recorded.mp4'));
 assert((await p.locator('#product-cinema video').evaluate(v=>v.currentTime))>=1.5);
 await p.keyboard.press('Escape');
 for(const width of [360,390,700,844,1440]){await p.setViewportSize({width,height:900});assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'Overflow at '+width);}
 assert.deepEqual(errors,[]);console.log('PASS: mobile MP4 playback, dimensions, reduced motion, close/focus, rotation position, desktop MP4, five viewport widths.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
