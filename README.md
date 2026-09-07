# Orbit Zero RPG — Render deployment

Orbit Zero is a Node 18+ web app. It serves the pixel-art game and the protected `POST /api/pathway` endpoint from the same origin. The app uses Node's built-in `fetch`, so no browser code or package file contains an OpenAI API key.

## Deploy on Render

1. Extract the project ZIP, then push the **contents** of this folder to the repository that Render deploys. `package.json`, `server.js`, and `index.html` must sit in the selected Render root directory. If they are in a `hackathon` subfolder, set Render's **Root Directory** to `hackathon`.
2. In Render, create or open the Web Service. Set the **Build Command** to `yarn install` and the **Start Command** to `yarn start`.
3. In that service, open **Environment** in the left sidebar, choose **Add Environment Variable**, enter `OPENAI_API_KEY` as the key, add the secret value only in Render's protected value field, and click **Save Changes**. Render will redeploy the service.
4. Do not put that value in JavaScript, HTML, CSS, `localStorage`, a `.env` file committed to Git, or chat. The included `.gitignore` blocks common local environment files.
5. Optionally set `OPENAI_MODEL` in Render if you need to select a permitted Responses API model. When omitted, the server uses `gpt-5.5`.

If `OPENAI_API_KEY` is absent or live research fails, a valid request still receives HTTP 200 with the same structured pathway shape from Orbit Zero's curated server-side school database. The `source` is `curated_database`, `fallback` is `true`, and `researchNotes` begins: `AI pathway guidance is temporarily unavailable.` The browser can therefore continue to show three school cards for every top career without ever exposing an API key.

## Endpoint contract

The browser sends a same-origin JSON request to `POST /api/pathway` after the game completes. The request is capped at 48 KB and validates the country, country-specific education stage, academic band, constraints, and exactly three known career results. The server sends only an anonymous, validated profile and numeric game signals to the OpenAI Responses API. It uses web search plus a strict JSON schema, then validates the returned three pathways and their exact Reach / Match / More Accessible school tiers before the browser receives them. When live research cannot run, the same validation is applied to the curated database response.

All career and school material is educational guidance, not professional admissions advice or a promise of admission. Reach, Match, and More Accessible are planning labels only; they are not acceptance-rate claims, rankings, or admission estimates. Source links should be checked before an application because university requirements can change.

## Results guidance

Every game-selected career card includes an **Experience-Building Timeline**: Current Stage, Early Experience, Stronger Evidence, Industry Experience, Job-Ready Evidence, and First Entry Role. The activities are category-specific and are shown as guidance only; they do not change the game score and do not guarantee a placement, job, admission decision, or professional qualification.

## Local checks

Run the production command locally with Node 18 or newer:

```powershell
yarn start
```

Then open `http://127.0.0.1:4173/`. Without a server environment key, a valid `/api/pathway` request should return HTTP 200 with `source: "curated_database"`, exactly three pathways, and exactly three school cards per pathway. Malformed or oversized requests should return a validation error without contacting OpenAI.
