import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './api/ask.mjs';
let address = 0;
async function request(body, options={}) {
  const req = {method:'POST',headers:{origin:'https://sriram-mullapudi.github.io','x-real-ip':String(++address)},body,...options};
  const res = {code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(data){this.data=data;return this;},end(){return this;}};
  await handler(req,res);
  return res;
}
test('validates requests and never exposes provider errors or unknown links', async()=>{
  const savedFetch=globalThis.fetch;
  const savedKey=process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    assert.equal((await request({question:'Experience?'})).code,503);
    process.env.OPENAI_API_KEY='test-secret';
    assert.equal((await request({question:'Experience?'},{headers:{origin:'https://wrong.example'}})).code,403);
    assert.equal((await request({question:'x'.repeat(801)})).code,400);
    assert.equal((await request(null)).code,400);
    assert.equal((await request('{bad')).code,400);
    assert.equal((await request({}, {method:'OPTIONS'})).code,204);
    globalThis.fetch=async(url,options)=>{
      assert.equal(url,'https://api.openai.com/v1/responses');
      assert.equal(options.headers.Authorization,'Bearer test-secret');
      const payload=JSON.parse(options.body);
      assert.equal(payload.store,false);
      assert.equal(payload.input,'Backend experience?');
      return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({answer:'Sriram builds Java services.',sourceIds:['experience','experience']})}]}]})};
    };
    const good=await request({question:'Backend experience?'});
    assert.equal(good.code,200);
    assert.deepEqual(good.data.sources,[{title:'Engineering experience',href:'#work'}]);
    globalThis.fetch=async()=>({ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({answer:'Bad link',sourceIds:['evil']})}]}]})});
    assert.equal((await request({question:'Hi'})).code,502);
    globalThis.fetch=async()=>{throw new Error('secret provider information');};
    const bad=await request({question:'Hi'});
    assert.equal(bad.code,502);
    assert.ok(!JSON.stringify(bad.data).includes('secret'));
    for(let i=0;i<6;i++) await request({question:'Hi'},{headers:{origin:'https://sriram-mullapudi.github.io','x-real-ip':'repeat'}});
    assert.equal((await request({question:'Hi'},{headers:{origin:'https://sriram-mullapudi.github.io','x-real-ip':'repeat'}})).code,429);
  } finally {
    globalThis.fetch=savedFetch;
    if(savedKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=savedKey;
  }
});
