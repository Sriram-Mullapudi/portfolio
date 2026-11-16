import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/dist/transformers.min.js";
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
let embedder, sources, entries, vectors;
const questions = {
  experience: [
    "What is his backend experience?",
    "Tell me about Sriram and his professional experience",
    "What did he do at JPMorgan Chase?",
    "What did he work on at Accenture?",
    "Has he built distributed payment systems?",
    "How many years of software engineering experience does he have?",
  ],
  folio: [
    "How does Folio work?",
    "Tell me about his AI document search project",
    "How does his RAG application find citations?",
    "What testing was done for Folio?",
  ],
  speedway: [
    "What makes Speedway work offline?",
    "Tell me about his point of sale project",
    "How does checkout store sales in SQLite?",
    "How does Speedway handle payments and receipts?",
  ],
  education: [
    "Where did he study?",
    "What is his education and GPA?",
    "Does he have a masters degree?",
  ],
  toolkit: [
    "What programming languages does he use?",
    "What is his technical toolkit?",
    "What cloud platforms and databases does he know?",
    "Does he know Python or Kubernetes?",
  ],
  contact: [
    "How can I contact Sriram?",
    "What is his email?",
    "What roles is he interested in?",
    "Is he open to relocation?",
  ],
  photography: [
    "What does he photograph?",
    "What are his interests outside work?",
    "Tell me about his photography",
  ],
};
const unknown =
  "The portfolio does not provide that information. You can contact Sriram directly for details.";
self.onmessage = async ({ data }) => {
  try {
    if (data.type === "load") {
      let lastPercent = -1;
      const response = await fetch("./assistant-sources.json");
      if (!response.ok) throw new Error();
      sources = await response.json();
      embedder = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        {
          dtype: "q8",
          device: "wasm",
          progress_callback: (progress) => {
            if (!progress.file?.endsWith(".onnx") || !Number.isFinite(progress.progress)) return;
            const percent = Math.min(100, Math.max(0, Math.floor(progress.progress)));
            if (percent === lastPercent) return;
            lastPercent = percent;
            self.postMessage({type: "progress", percent, text: "Downloading AI model · " + percent + "%"});
          },
        },
      );
      entries = sources.flatMap((source) =>
        questions[source.id].map((text) => ({ id: source.id, text })),
      );
      const unknownQuestions = [
        "What is his salary or compensation expectation?",
        "What is his current location or home address?",
        "Does he have a visa or work authorization?",
        "When can he start a new job?",
        "What is the weather today?",
        "Write code for me",
        "Give me a recipe or cooking instructions",
        "Tell me a joke",
        "What is his age or birthday?",
      ];
      entries.push(...unknownQuestions.map((text) => ({ id: null, text })));
      self.postMessage({
        type: "progress",
        text: "Preparing portfolio sources…",
      });
      vectors = (
        await embedder(
          entries.map((e) => e.text),
          { pooling: "mean", normalize: true },
        )
      ).tolist();
      self.postMessage({ type: "ready" });
    }
    if (data.type === "ask") {
      const query = (
        await embedder(data.question, { pooling: "mean", normalize: true })
      ).tolist()[0];
      const ranked = entries
        .map((entry, i) => ({
          id: entry.id,
          score: vectors[i].reduce(
            (sum, value, j) => sum + value * query[j],
            0,
          ),
        }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0];
      const source =
        best.score >= 0.55 ? sources.find((s) => s.id === best.id) : null;
      self.postMessage({
        type: "answer",
        answer: source?.answer || unknown,
        source: source ? { title: source.title, href: source.href } : null,
      });
    }
  } catch {
    self.postMessage({
      type: "error",
      text: "The local model could not finish. Reload it or explore the portfolio sections below.",
    });
  }
};
