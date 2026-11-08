# CDL Prep

Read-aloud flashcards for the South Dakota Class A CDL permit tests: General Knowledge, Air Brakes and Combination Vehicles. Built for a learner with dyslexia: every card reads itself out loud, wording is short and plain, and missed cards come back until they stick.

**Live:** https://danielburkhalter.dev/CDL-Prep/

- `src/decks/*.json`: the cards. Each one is `{id, section, page, front, back, why?}`, written in our own words from the 2025 SD CDL Manual and citing its page.
- `src/srs.ts`: spaced repetition (Leitner boxes).
- `src/speech.ts`: read-aloud through the browser's built-in voices. Free, no API keys.
- `CDL-PLAN.md`: the plan and to-do list.
- `sources/`: local copies of the manual and transcripts. Not committed, because they're copyrighted.

## Development

```sh
npm install
npm run dev     # http://localhost:3000
npm run build   # type check + production build
```

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`.

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