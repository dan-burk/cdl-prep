# CDL Deck Coverage Review (Nov 2026)

Scope: General Knowledge (GK, 50 Qs), Air Brakes (AB, 25 Qs), Combination (CV, 20 Qs). 80% needed on each. Source checked: `sources/sd-cdl-manual-2025.txt`. Page refs are manual pages like "2-19".

## Key facts first

- **The manual itself says which questions to expect.** Every "Test Your Knowledge" box ends with "These questions may be on your test" (e.g. p2-8, 2-44, 5-5, 6-10). This is the best evidence we have of what gets asked. About 25 of those ~110 prompts have no card yet (listed below).
- **The AAMVA chapters in the "2025" SD manual are marked "Version: July 2017".** Only section 12 is marked March 2025. Practice sites that use a newer state manual (NJ's is March 2025) may word some things differently.
- **SD test rules (SD manual p.15):** 50/25/20 questions, 80% to pass. One try per test per day, retest the next business day. Passed tests count for 6 months. No interpreters.
- **Quizlet:** I couldn't open any of the three sets (HTTP 403, Wayback blocked, Chrome extension not connected). What search snippets showed:
  - 3384148: 45 terms. A very old set (low ID, before the 2017 manual). Its preview asks the 60-ft following-distance question.
  - 1181596538 ("2026"): 120 terms, user-made, nothing visible beyond the title and term count.
  - 1019917018 ("Cheat Sheet 2025"): 92 terms. Covers brake heat, escape ramps and following distance. The one answer I could see (30-ft truck at 55 mph = 4 s) is correct.
  - Verdict: I can't vouch for them. Treat them as a hint at topics only. Older sets may carry pre-2017 numbers, so trust the manual over any Quizlet card.

## 1. Wrong / risky cards (fix first)

| Card | Problem |
|---|---|
| **gk-013** (first out-of-service violation = "at least 90 days") | The AAMVA text (p1-8 / §1.3.4) says 90 days. **SD's own page (PDF p.21, SDCL 32-12A-52) says 180 days** and gives 2 years (not 1) for a second violation. Federal 49 CFR 383.51 Table 4 also says 180 days. The test bank is AAMVA-based, so 90 is the likely expected answer, but the card should show both so 180 on the test isn't a shock. |
| ab-028 (low-air warning before **55 psi**) | Correct for this manual. Older study sets often say 60, and one prep site lists this as its most-missed AB question. Add a "not 60" note to the `why`. |

I spot-checked about 45 numbers against the manual and found no other errors: 55/100/125/150 psi, 20–45 psi, leak rates 2/3 and 3/4, 45 s and 3 min build-up, 419 ft and 450+ ft stopping, 32 ft brake lag, 14 s and 15+ s rail clearance, 15–50 ft, 4/32 and 2/32 in., 10°, 250 ft and 350–500 ft, 50 mi and 150 mi/3 h, 1 tie-down per 10 ft, half the cargo weight, etc.

## 2. High-value gaps (ranked)

1. **Vehicle inspection, §2.1 (p2-1 to 2-8).** About 10 cards cover 8 pages, and the TYK box has 11 questions. Missing:
   - the inspection types: pre-trip, during the trip, after-trip report
   - the seven-step method and its order
   - key steering parts
   - suspension defects
   - wheel and rim defects (welded rims, rust around lug nuts)
   - exhaust leaks
   - why the key goes in your pocket
   - checking wheel-bearing seals for leaks

   This also prepares him for the skills-test pre-trip.
2. **Seeing hazards, §2.8 (p2-19 to 2-21): zero cards.** What a "hazard" is, plus clues to watch for: drivers whose view is blocked, delivery trucks, people in parked cars, confused or distracted drivers, kids. Also "always have a plan" (TYK p2-21).
3. **Shifting and basic control, §2.2–2.3 (p2-8 to 2-10).** Missing:
   - the 2 ways to know when to shift: engine rpm or road speed
   - the second downshift situation: **before a curve** (the deck has only hills)
   - starting on a hill without rolling back
   - why use a helper when backing
   - when to downshift an automatic
   - true/false: "retarders prevent skids"

   All of these are TYK questions on p2-10.
4. **Hazmat rules every driver must know, §2.23 (p2-42 to 2-44): only 3 cards.** Missing:
   - all 3 places shipping papers can go: door pouch, in reach, or on the seat (the deck has only the seat)
   - the 9 hazard classes with an example each
   - 4-digit UN/NA ID numbers and the ERG
   - what a placard is and why it's used (TYK p2-44)
   - the tank endorsement threshold: more than 119 gal per tank and 1,000 gal total
5. **Following distance variants (p2-16 to 2-17).** The deck has only the 40-ft examples. Add:
   - 60-ft rig: 6 s, or 7 s over 40 mph. The manual gives this, the Quizlet preview asks it, and a Class A rig is close to 60–70 ft.
   - 30-ft truck at 55 mph: 4 s (TYK)
   - how to measure it: count seconds after the vehicle ahead passes a landmark
6. **Mirrors, signaling and space, §2.4.2–2.7 (p2-11 to 2-18).** Missing:
   - "Mirrors are the main way to see the sides and rear"
   - what "communicating" means (signal early, horn)
   - space overhead and space below
   - the true/false trap "use low beams whenever you can" is **False** (p2-27, TYK)
7. **Mountain driving, §2.16 (p2-32 to 2-33).** Missing:
   - what sets a safe speed: weight, length and steepness of the grade, road, weather
   - downshift to a gear lower than you'd use to climb the same hill (p2-9)
   - each brake press lasts about 3 seconds
   - what an escape ramp is (TYK p2-38)
8. **Air brake inspection, §5.3 (p5-5 to 5-6).** Missing:
   - compressor belt check
   - drum cracks longer than ½ the width of the friction area
   - linings soaked with oil or too thin
   - what a slack adjuster *is* (TYK p5-7)
   - make the true/false "front brakes are good in all conditions" (**True**, p5-3, TYK) its own card; ab-032/033 only hint at it
9. **Cargo, §3.1 (p3-1 to 3-3).** Missing:
   - the driver's 4 cargo duties
   - **GCWR vs GCW** (TYK)
   - "a 20-ft load needs 2 tie-downs at minimum" (TYK)
10. **Combination coupling traps (p6-8 to 6-10, TYK).** Missing:
    - what happens if the trailer is too high when coupling (it may not couple right; the kingpin can ride on top of the jaws)
    - "look into the back of the fifth wheel to check the lock" is **True**
11. **Penalties not covered (p1-8, 2-23):** rail-crossing violations (60 days / 120 days / 1 year); texting and hand-held phone (60/120 days, up to $2,750 fine).
12. **Winter vehicle checks, §2.13.1 (p2-28):** chains, coolant/antifreeze, defroster, wipers. Lower priority.

## 3. Low value: deprioritize or cut

- **Bus-only:** ab-030 (bus warning at 80–85 psi) and ab-042 (bus dual parking valves). A Class A permit test won't need them.
- **Trivia:** ab-022 (why it's called an S-cam), gk-069 (texting is 23× riskier), gk-066 (slow-moving vehicle sign).
- **Rare loads:** gk-151 (dry bulk tanks) and gk-152 (livestock).
- **Repeats across decks:** about 12 ABS cards (gk-110–114, ab-043/048/069–071, cv-053/054), 4 controlled/stab braking cards, and 4 "stuck on tracks / low trailers" cards. Keep each deck complete, but let review scheduling treat them as one fact.
- **Pintle hook and drawbar steps (p6-10 to 6-12):** the deck rightly skips them. Low odds of being tested.

## 4. Outside these three tests (just noting)

- **Skills test:** pre-trip inspection, where he must name each part and explain what he checks and why (SD site; manual §11). Then basic control (§12) and the road test (§13). He has to hold the CLP 14 days before the skills test (SD p.16), and Entry-Level Driver Training (ELDT) is required first.
- **Optional endorsements** often taken at the same visit: Doubles/Triples and Tank (20 Qs each). TruckingTruth "highly recommends" them for job prospects.

## 5. Supplemental ideas with evidence

1. **Ask SD DPS for an oral (read-aloud) test.** Federal 49 CFR 383.133(b)(3) lets knowledge tests be given "verbally." SD's manual bans interpreters but says nothing against oral tests. Call Driver Licensing at 605-773-6883. For a dyslexic test-taker this is the single biggest lever. https://www.law.cornell.edu/cfr/text/49/383.133
2. **Cover every TYK question.** The manual says outright that they may be on the test. A "TYK" tag on cards would make sure all ~110 are covered.
3. **Drill numbers he could mix up.** These are where people lose points (prep sites flag the leak-rate and governor numbers):
   - 100 / 125 / 150 psi (governor cut-in, cut-out, safety valve)
   - 55 psi low-air warning vs 20–45 psi (spring brakes and tractor protection valve)
   - leak rates 2/3 (brakes off) vs 3/4 (pedal held)
   - 45 s vs 3 min air build-up
   - triangle spacing: 10/100/200 ft vs 10/100 ft back + 100 ft ahead
   - cargo checks: 50 mi vs 150 mi / 3 h

   A side-by-side "which number?" mode would fit this well. https://cdlpassmaster.com/blog/cdl-air-brake-test-questions-and-answers/
4. **Practice tests in multiple-choice format:**
   - TruckerCountry: 10 versions of each test. A TruckersReport poster says practice is "the same for the most part" as the real thing, and 90% or better means ready. Read the correct answers; don't memorize answer letters. https://www.thetruckersreport.com/truckingindustryforum/posts/13526321/
   - TruckingTruth's free High Road Training, which has one module per test. https://www.truckingtruth.com/guide-pages/chapter4/cdl-permit-preparation
5. **Audio:** driving-tests.org has an SD CDL handbook audio (third-party, about 9 hours). It's useful alongside the app's voice phase. https://driving-tests.org/south-dakota/south-dakota-cdl-audio-handbook/
6. **Train on true/false and "NOT" wording.** Many TYK items are true/false built on a common myth: coffee sobers you up; let air out of hot tires; empty trucks brake best; front brakes skid; raise the landing gear just off the pavement. Showing the myth on the card front and "False" on the back matches how the test words things.
