# Portfolio AI backend

The public Ask AI control stays hidden until portfolio-v3-assets/assistant-config.js
has a backend URL. Append ?assistant-preview to the portfolio URL to inspect
the panel without a key. That preview cannot generate answers.

## Activate

1. Import this repository into Vercel, set the project's root directory to
   ai-service, use the Other framework preset, and leave build/output overrides
   unset. The Node function lives at /api/ask.
2. Set OPENAI_API_KEY in Vercel's server environment. Never put a key in
   assistant-config.js, Git, the browser, or chat.
3. Optional server settings:
   - OPENAI_MODEL defaults to gpt-4.1-mini.
   - ALLOWED_ORIGINS defaults to https://sriram-mullapudi.github.io.
     Add comma-separated localhost origins only for development.
4. Deploy. In assistant-config.js, set endpoint to
   https://YOUR-DEPLOYMENT.vercel.app/api/ask.
5. Verify real answers, unknown-information handling, source links, error
   recovery and mobile layout before publishing the configured frontend.
6. Configure a hosting-level distributed rate limit and provider spending
   controls appropriate to expected traffic. The code's six requests/minute
   per-IP limiter is best-effort and per process. It resets on cold starts
   and does not enforce a global budget or protect against distributed abuse.

The static portfolio can remain on GitHub Pages.

## Data and grounding

knowledge.json contains the approved facts copied from the portfolio on
2026-11-14. Update it whenever the resume or portfolio facts change.
The assistant sends only the current question and this approved context.
It does not receive prior conversation turns, files, or browser history.
Each question should be self-contained. Answers are displayed as text, and
source links are limited to known sections. The prompt limits answers to
portfolio topics; factual accuracy still needs human review.

Conversations exist only in page memory. The backend does not explicitly log
question text and requests store: false from OpenAI. Hosting/provider logs
and retention policies still apply. This is not a zero-retention guarantee.

## Verification

Run node --test ai-service/ask.test.mjs. Tests stub the provider to validate
request validation, server-key handling, citations and error paths without
making paid calls. A real provider test remains required during activation.

Implementation follows the OpenAI Responses API and Vercel Node function docs:
https://developers.openai.com/api/docs/quickstart
https://developers.openai.com/api/docs/guides/structured-outputs
https://vercel.com/docs/functions/runtimes/node-js
