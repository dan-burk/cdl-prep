# CDL Prep

Read-aloud flashcards for the South Dakota Class A CDL permit tests: General Knowledge, Air Brakes and Combination Vehicles. Built for a learner with dyslexia: every card reads itself out loud, wording is short and plain, and missed cards come back until they stick.

**Live:** https://danielburkhalter.dev/cdl-prep/

- `src/decks/*.json`: the cards. Each one is `{id, section, page, front, back, why?, tyk?}` (`tyk`: from a manual "Test Your Knowledge" box), written in our own words from the 2025 SD CDL Manual and citing its page.
- `src/srs.ts`: spaced repetition (Leitner boxes).
- `src/speech.ts`: read-aloud through the browser's built-in voices. Free, no API keys.
- `src/talk/`, `src/components/Talk.tsx`: Talk mode (Grok voice tutor).
- `functions/`: Firebase functions `session` (caps, xAI pass) and `debrief` (session summary via `grok-4.3`).
- `CDL-PLAN.md`: the plan and to-do list.
- `sources/`: local copies of the manual and transcripts. Not committed, because they're copyrighted.

## Progress terms

| Term | Means |
|---|---|
| Covered | Asked at least once |
| Learned | Right 3 times in a row, spaced out (comes back after 1 day, then 3). A miss resets it. Right answers before a question is due don't count. |

Talk mode mixes questions he's had before with new ones by default. He can ask for one test, only ones he's had (review), or only new ones.

## Talk mode limits

| Rule | Value |
|---|---|
| Session length | 10 min (1-minute warning at 9) |
| Sessions per person per day | 6 (60 min) |
| Sessions per day, everyone | 12 |
| Day resets | Midnight Central |
| xAI pass | Expires 5 min after it's issued; only needed to connect |
| Who can talk | Anyone logged in with Google |
| Callers allowed | `https://danielburkhalter.dev`, `http://localhost:3000` |
| Spending ceiling | Prepaid xAI credit, auto top-up off |

Limits live at the top of `functions/src/index.ts`.

## Run it

Two separate `npm` projects: the website (repo root) and the server functions (`functions/`). Run everything from the repo root.

```sh
# Website
npm install
npm run dev                          # http://localhost:3000 (needs .env.local, see .env.example)
npm run build                        # type check + production build

# Functions (only when functions/ changes)
npm --prefix functions install
npm --prefix functions run build
firebase use                         # must print cdl-prep-9fc49
firebase deploy --only functions
```

- Website: pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`.
- Firestore rules: paste `firestore.rules` into Firebase console → Firestore → Rules → Publish.
- Secret: `XAI_API_KEY` (Google Secret Manager). Never in the repo or `.env`.

## Firebase Commands

```bash
# Authentication
firebase logout
firebase login --reauth

# Project management
firebase projects:list
firebase init

# Secrets management (v2)
firebase functions:secrets:set <YOUR_SECRET>
firebase functions:secrets:access <YOUR_SECRET>
firebase functions:secrets:get <YOUR_SECRET>
firebase functions:secrets:destroy <YOUR_SECRET>

# View function config
firebase functions:config:get

# View function logs
firebase functions:log
```

## GCP Commands

```bash
# Authentication
gcloud auth login
gcloud auth application-default login

# Secrets
gcloud secrets list #Shows secrets for the default project
gcloud secrets list --project cdl-prep-9fc49

# Inspect a deployed function
gcloud functions describe <your-function> --region=us-central1
```