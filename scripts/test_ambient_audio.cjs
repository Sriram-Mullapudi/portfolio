// Optional Playwright + Edge check of autoplay fallback and audio lifecycle.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.mp3')?'audio/mpeg':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(data)})});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {
  for(const policy of ['no-user-gesture-required','document-user-activation-required']){
   const browser=await chromium.launch({headless:true,channel:'msedge',args:['--autoplay-policy='+policy]});
   try {
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    const button=page.locator('#ambient-toggle');
    if(policy==='document-user-activation-required'){
     await page.waitForTimeout(600);assert.equal(await button.textContent(),'♫ Play music');
     assert(await page.locator('audio').evaluate(a=>a.paused));assert(await page.locator('#music-notice').isVisible());await page.locator('#music-notice-play').click();
    }
    await page.waitForFunction(()=>document.querySelector('audio').currentTime>.2);
    await page.waitForFunction(()=>document.querySelector('#ambient-toggle').getAttribute('aria-pressed')==='true');
    assert(!(await page.locator('#music-notice').isVisible()));
    await page.locator('#ambient-volume').fill('0.2');
    assert.equal(await page.locator('#ambient-volume-percent').textContent(), '20%');
    await button.click();await page.waitForTimeout(650);assert(await page.locator('audio').evaluate(a=>a.paused));
    assert.equal(await button.textContent(),'♫ Sound off');
    await page.locator('h1').click();await page.keyboard.press('Tab');await page.waitForTimeout(200);
    assert(await page.locator('audio').evaluate(a=>a.paused),'Ordinary interactions must not undo mute');
    await page.reload();assert.equal(await page.locator('audio').count(),0);
    assert.equal(await page.locator('#ambient-volume').getAttribute('aria-valuetext'), '20%');
    assert.equal(await page.locator('#ambient-volume').inputValue(),'0.2');assert.equal(await button.textContent(),'♫ Sound off');
    await page.locator('h1').click();assert.equal(await page.locator('audio').count(),0);
    await button.click();await page.waitForFunction(()=>!document.querySelector('audio').paused);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
    await page.waitForTimeout(200);assert(await page.locator('audio').evaluate(a=>a.paused));
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
    await page.waitForFunction(()=>!document.querySelector('audio').paused);
    if(policy==='document-user-activation-required'){
     const keyboardPage=await browser.newPage();await keyboardPage.goto('http://127.0.0.1:'+server.address().port+'/index.html');
     await keyboardPage.waitForTimeout(500);await keyboardPage.keyboard.press('Tab');
     await keyboardPage.waitForFunction(()=>document.querySelector('audio').currentTime>.1);await keyboardPage.close();
     const quietPage=await browser.newPage({viewport:{width:390,height:844}});await quietPage.goto('http://127.0.0.1:'+server.address().port+'/index.html');
     await quietPage.locator('#music-notice').waitFor({state:'visible'});
     const rect=await quietPage.locator('#music-notice').boundingBox();assert(rect.x>=0&&rect.x+rect.width<=390);
     await quietPage.locator('#music-notice-dismiss').click();await quietPage.locator('h1').click();await quietPage.keyboard.press('Tab');await quietPage.waitForTimeout(600);
     assert(await quietPage.locator('audio').evaluate(a=>a.paused));assert(!(await quietPage.locator('#music-notice').isVisible()));
     await quietPage.locator('#ambient-toggle').click();await quietPage.waitForFunction(()=>!document.querySelector('audio').paused);await quietPage.close();
    }
    assert.equal(await page.locator('audio').count(),1);assert.deepEqual(errors,[]);
   }finally{await browser.close()}
  }
  console.log('PASS: default playback when allowed, blocked-autoplay prompt, play/dismiss, keyboard fallback, mute and volume persistence across reload, toggle, visibility pause/resume.');
 }finally{server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
