# Back-to-home button mockup: CDL Prep

A "← Home" button that takes people from CDL Prep back to the portfolio at danielburkhalter.dev.

**Live mockup (private Claude artifact):** https://claude.ai/artifact/XgLkTHeCuffRUmP34P6JDp

## Status

Mocked up on November 11, 2026. **Not implemented.** We decided not to ship it for now; this folder keeps the mockup so it can be picked up later.

## What we decided

- **Label:** "← Home" (arrow icon plus the word Home).
- **Goes to:** https://danielburkhalter.dev/ in the **same tab**. The portfolio already opens every app in a new tab, so the portfolio stays open in the earlier tab; ending up with two portfolio tabs is fine.
- **Desktop:** pinned **32px from the left edge of the window**, level with the app's top row, so it sits clearly apart from the content.
- **Phone:** no margin to use, so it changes shape (see below).
- **Look:** 32px tall, using the app's own font and button colors so it reads as part of the app.
- **Scope:** Bank Check, CDL Prep, US Coin Value, Stocks vs. Metals (investing), Math Scribe and SD XC. Not Agent Sessions (claude-gui demo) and not Dairy Translate.

## Files

- `index.html`: the mockup. Open it in a browser. It's self-contained: real screenshots of the live app (taken November 11, 2026) with a working button placed on top, shown at desktop size, at actual size, and on a 390px phone.

## Placement in CDL Prep

- **Desktop:** inside the top bar, 32px from the left edge of the window, level with the truck logo.
- **Phone:** shrinks to just the arrow (32×32) and sits in front of the logo. "Log in" / Settings stay on the right.
- **In between:** the bar's content is `max-w-2xl` (672px) centered, so the margin is wide enough from Tailwind's `lg` (1024px) up.

## How to build it

In `src/components/TopBar.tsx`. Uses the app's Tailwind tokens (`border`, `surface`, `surface-2`, `muted`, `text`). The `<header>` is `sticky`, so it already anchors an absolutely placed child.

```tsx
const HOME = 'https://danielburkhalter.dev/'
const Arrow = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
  </svg>
)

// 1) Desktop: first child of <header>, out in the margin
<a href={HOME} aria-label="Back to danielburkhalter.dev"
   className="absolute left-8 top-1/2 hidden h-8 -translate-y-1/2 items-center gap-1.5 rounded border border-border bg-surface pl-2 pr-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text lg:inline-flex">
  <Arrow /> Home
</a>

// 2) Phone/tablet: first child of the inner flex row, before the logo
<a href={HOME} aria-label="Back to danielburkhalter.dev"
   className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-surface text-muted hover:bg-surface-2 hover:text-text lg:hidden">
  <Arrow />
</a>
```
