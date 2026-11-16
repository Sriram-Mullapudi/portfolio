(() => {
  const panel = document.createElement("dialog");
  panel.id = "portfolio-assistant";
  panel.setAttribute("aria-labelledby", "assistant-title");
  panel.innerHTML = `
    <header class="assistant-head"><div><p class="assistant-eyebrow">On-device AI</p><h2 id="assistant-title">Ask about Sriram.</h2></div><button type="button" class="assistant-close" aria-label="Close assistant">×</button></header>
    <div class="assistant-scroll">
      <p class="assistant-intro">Explore the experience, decisions and work behind this portfolio.</p>
      <div class="assistant-load"><p>Runs on your device. First use downloads the AI model and runtime, then caches them in this browser. No account needed.</p><button type="button" class="assistant-load-button">Load free AI</button></div>
      <div class="assistant-starters" aria-label="Suggested questions"><button type="button">What is his backend experience?</button><button type="button">How does Folio work?</button><button type="button">What makes Speedway work offline?</button></div>
      <div class="assistant-conversation" role="log" aria-label="Questions and answers" aria-live="polite" aria-relevant="additions"></div>
      <nav class="assistant-reference" aria-label="Portfolio sources"><p>Portfolio sources</p><a href="#work">Experience ↗</a><a href="#knowledge-search">Folio ↗</a><a href="#speedway-pos">Speedway POS ↗</a><a href="#stack">Toolkit ↗</a><a href="#contact">Contact ↗</a></nav>
    </div>
    <div class="assistant-compose"><p class="assistant-status" role="status"></p>
      <form><label for="assistant-question">Your question</label><div class="assistant-input-row"><textarea id="assistant-question" rows="2" maxlength="800" placeholder="Ask about a project or skill…" required></textarea><button class="assistant-send" type="submit" aria-label="Send question">↑</button></div></form>
      <p class="assistant-disclosure">AI selects approved portfolio excerpts. Check the linked source for context. Questions stay on this device.</p>
      <button type="button" class="assistant-clear">Clear conversation</button>
    </div>`;
  document.body.append(panel);
  const launch = document.createElement("button");
  launch.type = "button";
  launch.className = "assistant-launch";
  launch.textContent = "Ask AI";
  launch.setAttribute("aria-haspopup", "dialog");
  launch.setAttribute("aria-controls", panel.id);
  document.querySelector(".nav-inner").append(launch);
  const form = panel.querySelector("form"),
    input = panel.querySelector("textarea");
  const log = panel.querySelector('[role="log"]'),
    status = panel.querySelector(".assistant-status");
  const send = panel.querySelector(".assistant-send");
  const loadButton = panel.querySelector(".assistant-load-button"),
    loadBox = panel.querySelector(".assistant-load");
  const starters = [...panel.querySelectorAll(".assistant-starters button")];
  let worker = null,
    ready = false,
    busy = false,
    timer,
    returnTarget = launch;
  let loadGeneration = 0;
  const progressBar = document.createElement("progress");
  progressBar.max = 100;
  progressBar.hidden = true;
  progressBar.setAttribute("aria-label", "AI model download");
  const cancelLoad = document.createElement("button");
  cancelLoad.type = "button";
  cancelLoad.className = "assistant-cancel-load";
  cancelLoad.textContent = "Cancel download";
  cancelLoad.hidden = true;
  loadBox.append(progressBar, cancelLoad);
  cancelLoad.addEventListener("click", () => {
    stop();
    status.textContent = "Loading stopped. You can load the AI whenever you’re ready.";
    loadButton.focus();
  });
  function controls() {
    send.disabled = !ready || busy;
    starters.forEach((button) => (button.disabled = !ready || busy));
    input.readOnly = !ready || busy;
    form.setAttribute("aria-busy", String(busy));
  }
  function stop() {
    loadGeneration++;
    clearTimeout(timer);
    worker?.terminate();
    worker = null;
    ready = false;
    busy = false;
    loadBox.hidden = false;
    loadButton.disabled = false;
    progressBar.hidden = true;
    cancelLoad.hidden = true;
    controls();
  }
  launch.addEventListener("click", () => {
    returnTarget = launch;
    panel.showModal();
    document.documentElement.classList.add("assistant-open");
    status.textContent = "";
    if (!window.Worker || !window.WebAssembly) {
      status.textContent =
        "This browser cannot run the local model. Explore the portfolio sources, or try an updated browser.";
      loadButton.disabled = true;
    }
    panel.querySelector(".assistant-close").focus();
  });
  panel
    .querySelector(".assistant-close")
    .addEventListener("click", () => panel.close());
  panel.addEventListener("close", () => {
    stop();
    document.documentElement.classList.remove("assistant-open");
    returnTarget.focus({ preventScroll: true });
  });
  panel.querySelector(".assistant-clear").addEventListener("click", () => {
    if (busy) stop();
    log.replaceChildren();
    input.value = "";
    status.textContent = "";
    input.focus();
  });
  function navigate(link) {
    returnTarget = document.querySelector(link.hash);
    returnTarget.setAttribute("tabindex", "-1");
    panel.close();
  }
  panel
    .querySelectorAll(".assistant-reference a")
    .forEach((link) => link.addEventListener("click", () => navigate(link)));
  function addMessage(label, text) {
    const article = document.createElement("article");
    article.className = "assistant-message";
    const name = document.createElement("p");
    name.className = "assistant-speaker";
    name.textContent = label;
    const content = document.createElement("p");
    content.textContent = text;
    article.append(name, content);
    log.append(article);
    while (log.children.length > 20) log.firstElementChild.remove();
    return article;
  }
  function failure(text) {
    stop();
    status.textContent = text;
  }
  loadButton.addEventListener("click", async () => {
    const generation = ++loadGeneration;
    loadButton.disabled = true;
    progressBar.removeAttribute("value");
    progressBar.hidden = false;
    cancelLoad.hidden = false;
    busy = true;
    controls();
    status.textContent = "Loading AI runtime…";
    try {
      if (!panel.open || generation !== loadGeneration) return;
      worker = new Worker(
        new URL("portfolio-v3-assets/assistant-worker.js?v=20261115", document.baseURI),
        { type: "module" },
      );
      busy = true;
      controls();
      timer = setTimeout(
        () =>
          failure(
            "The download took too long. Check your connection and try loading again.",
          ),
        300000,
      );
      worker.onerror = () =>
        failure(
          "AI could not load on this device. Try again or explore the portfolio sources.",
        );
      worker.onmessage = ({ data }) => {
        if (generation !== loadGeneration) return;
        if (data.type === "progress") {
          if (Number.isFinite(data.percent)) {
            progressBar.value = data.percent;
            // Announce milestones while the visual meter updates every percent.
            if (data.percent % 10 === 0) status.textContent = data.text;
          } else {
            progressBar.removeAttribute("value");
            status.textContent = data.text;
          }
        }
        if (data.type === "ready") {
          clearTimeout(timer);
          ready = true;
          busy = false;
          loadBox.hidden = true;
          status.textContent = "Ready · Running on your device";
          controls();
          input.focus();
        }
        if (data.type === "answer") {
          clearTimeout(timer);
          busy = false;
          controls();
          status.textContent = "";
          input.value = "";
          const article = addMessage("From the portfolio", data.answer);
          if (
            data.source &&
            [
              "#work",
              "#knowledge-search",
              "#speedway-pos",
              "#stack",
              "#contact",
              "#life",
            ].includes(data.source.href)
          ) {
            const link = document.createElement("a");
            link.className = "assistant-answer-source";
            link.href = data.source.href;
            link.textContent = data.source.title + " ↗";
            link.addEventListener("click", () => navigate(link));
            article.append(link);
          }
          article.scrollIntoView({ block: "nearest" });
        }
        if (data.type === "error") failure(data.text);
      };
      worker.postMessage({ type: "load" });
    } catch {
      failure("AI could not load. Check your connection and try again.");
    }
  });
  function ask(question) {
    if (!ready || busy || !question.trim()) return;
    busy = true;
    controls();
    addMessage("You", question.trim());
    status.textContent = "Finding portfolio information on your device…";
    timer = setTimeout(
      () =>
        failure(
          "This device is taking too long. Reload the model to retry, or use the portfolio sources.",
        ),
      90000,
    );
    worker.postMessage({ type: "ask", question: question.trim() });
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  starters.forEach((button) =>
    button.addEventListener("click", () => {
      input.value = button.textContent;
      ask(input.value);
    }),
  );
  controls();
})();
