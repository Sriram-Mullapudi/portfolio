(() => {
  const endpoint = window.portfolioAI?.endpoint?.trim();
  const preview = new URLSearchParams(location.search).has('assistant-preview');
  if (!endpoint && !preview) return;
  const panel = document.createElement('dialog');
  panel.id = 'portfolio-assistant';
  panel.setAttribute('aria-labelledby','assistant-title');
  panel.innerHTML = `
    <header class="assistant-head"><div><p class="assistant-eyebrow">Portfolio assistant</p><h2 id="assistant-title">Ask about Sriram.</h2></div><button type="button" class="assistant-close" aria-label="Close assistant">×</button></header>
    <div class="assistant-scroll">
      <p class="assistant-intro">Explore the experience, decisions and work behind this portfolio.</p>
      <div class="assistant-starters" aria-label="Suggested questions">
        <button type="button">What is his backend experience?</button>
        <button type="button">How does Folio work?</button>
        <button type="button">What makes Speedway work offline?</button>
      </div>
      <div class="assistant-conversation" role="log" aria-label="Questions and answers" aria-live="polite" aria-relevant="additions"></div>
    </div>
    <div class="assistant-compose"><p class="assistant-status" role="status"></p>
      <form><label for="assistant-question">Your question</label><div class="assistant-input-row"><textarea id="assistant-question" rows="2" maxlength="800" placeholder="Ask about a project or skill…" required></textarea><button class="assistant-send" type="submit" aria-label="Send question">↑</button></div></form>
      <p class="assistant-disclosure">Answers use published portfolio information and may contain mistakes. Questions are sent to OpenAI. Avoid sharing private information.</p>
      <button type="button" class="assistant-clear">Clear conversation</button>
    </div>`;
  document.body.append(panel);
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'assistant-launch';
  launch.textContent = 'Ask AI';
  launch.setAttribute('aria-haspopup','dialog');
  launch.setAttribute('aria-controls',panel.id);
  document.querySelector('.nav-inner').append(launch);
  const form = panel.querySelector('form');
  const input = panel.querySelector('textarea');
  const log = panel.querySelector('[role="log"]');
  const status = panel.querySelector('.assistant-status');
  const send = panel.querySelector('.assistant-send');
  const starters = [...panel.querySelectorAll('.assistant-starters button')];
  let active = null;
  let returnTarget = launch;
  function setBusy(busy) {
    send.disabled = busy || !endpoint;
    starters.forEach(button=>button.disabled = busy || !endpoint);
    input.readOnly = busy || !endpoint;
    form.setAttribute('aria-busy',String(busy));
  }
  function restoreStatus() {
    status.textContent = endpoint ? '' : 'Preview · AI connection pending';
    setBusy(false);
  }
  function cancel() {
    active?.abort();
    active = null;
    restoreStatus();
  }
  launch.addEventListener('click',()=>{
    returnTarget = launch;
    panel.showModal();
    document.documentElement.classList.add('assistant-open');
    restoreStatus();
    (endpoint ? input : panel.querySelector('.assistant-close')).focus();
  });
  panel.querySelector('.assistant-close').addEventListener('click',()=>panel.close());
  panel.addEventListener('close',()=>{
    cancel();
    document.documentElement.classList.remove('assistant-open');
    returnTarget.focus({preventScroll:true});
  });
  panel.querySelector('.assistant-clear').addEventListener('click',()=>{
    cancel(); log.replaceChildren(); input.value=''; input.focus();
  });
  function addMessage(label, text) {
    const article = document.createElement('article');
    article.className = 'assistant-message';
    const name = document.createElement('p');
    name.className = 'assistant-speaker'; name.textContent = label;
    const content = document.createElement('p');
    content.textContent = text;
    article.append(name, content); log.append(article);
    // Bound DOM growth without persisting the visitor's conversation.
    while (log.children.length > 20) log.firstElementChild.remove();
    return article;
  }
  const sourceTargets = new Set(['#work','#knowledge-search','#speedway-pos','#stack','#contact','#life']);
  async function ask(question) {
    if (active || !endpoint || !question.trim()) return;
    const controller = new AbortController();
    active = controller; setBusy(true);
    addMessage('You',question.trim());
    status.textContent = 'Reading portfolio sources…';
    const timer = setTimeout(()=>controller.abort(),30000);
    try {
      const response = await fetch(endpoint,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({question:question.trim()}),signal:controller.signal,
        credentials:'omit'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(response.status===429 ? 'Please wait a minute before asking again.' : 'The assistant is unavailable. Try again shortly.');
      if (typeof result.answer !== 'string' || !Array.isArray(result.sources)) throw new Error('The answer could not be displayed. Please try again.');
      if (active !== controller) return;
      const article = addMessage('Portfolio assistant',result.answer);
      const links = document.createElement('div');
      links.className = 'assistant-sources';
      result.sources.forEach(source=>{
        if (!sourceTargets.has(source.href) || typeof source.title !== 'string') return;
        const link = document.createElement('a');
        link.href = source.href; link.textContent = source.title + ' ↗';
        link.addEventListener('click',()=>{
          const section = document.querySelector(source.href);
          returnTarget = section;
          panel.close();
          section.setAttribute('tabindex','-1');
          section.focus({preventScroll:true});
        });
        links.append(link);
      });
      article.append(links);
      input.value = '';
      status.textContent = '';
      article.scrollIntoView({block:'nearest'});
    } catch (error) {
      if (active !== controller) return;
      status.textContent = error.name === 'AbortError' ? 'That took too long. Your question is ready to retry.' : error.message;
    } finally {
      clearTimeout(timer);
      if (active === controller) {active=null;setBusy(false);}
    }
  }
  form.addEventListener('submit',event=>{event.preventDefault();ask(input.value);});
  input.addEventListener('keydown',event=>{
    if (event.key==='Enter' && !event.shiftKey && !event.isComposing) {event.preventDefault();form.requestSubmit();}
  });
  starters.forEach(button=>button.addEventListener('click',()=>{input.value=button.textContent;ask(input.value);}));
  restoreStatus();
})();
