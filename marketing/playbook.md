# SNS Playbook — K-Listen Master (Threads + Instagram)

Target: English-speaking Korean learners (global). Visuals: real app screenshots + text overlay.
Cadence: 1 slot per day, recommended post time 22:00 KST (Threads daily, Instagram every other day).
Drafts every 2 days → owner review/approval → daily package sent by Telegram at 10:00 → **owner uploads manually** (no API posting: API posts get an AI label).
Research date: 2026-10-06 (refresh monthly; update with our own insights data).

## Content principles (owner, 2026-10-26) — apply 1–2 per post, don't force all
Content is UX: the reader should think "this is me."

**Plan every post with 3 questions**
1. **Who reads it?** Pick ONE persona first:
   K-drama/K-pop fan (wants no subtitles) · textbook/TOPIK learner (reads fine, can't hear) ·
   going to Korea (travel/study/working holiday) · has a Korean partner/in-laws ·
   busy worker/student (consistency) · Korean teacher/tutor.
2. **When do they need it?** One concrete scene for that persona
   (subtitles on but audio lost · bias's live with no subs · listening script "I knew all these words?" ·
   café cashier → you just say "네" · family dinner smile-and-nod · 10-min subway commute).
3. **What changes after?** The felt result, not the feature ("you laugh before the subtitles", "you answer instead of '네'").

**Hooks**
- **Open with a question, not a statement.** Prefer the reader's situation or a belief-breaking twist:
  "좋아요 has an ㅎ. So why does no Korean pronounce it?" (not "Korean has sound-change rules.")
- **Cognitive dissonance:** shake an assumption the reader holds; make them say it out loud to check.
- **Show the gap, not the whole:** point at ONE spot (one letter, one sound) first; don't explain everything up front.
  One memorable point per post, dug deep. Carousels reveal step by step (question → listen again → answer → one more example).
- **Context swap:** use the reader's world and plain words. English connected speech is the go-to analogy
  ("wanna", "gotcha" → "Korean has its own 'wanna': 같이 → [가치]") — say "similar feel", never "the same rule".

**Avoid:** statement openers · lists of features/info · things the reader can't relate to · jargon.
Feature/app mention comes last and lightly (main topic ≤ 1 in 3 posts).

**Draft self-check (put in post.json `angle` per item):** `{ "who", "when", "after", "hook" }` — if "who"/"when" are vague, rewrite.

## Threads
- Ranking = early engagement velocity + **reply depth** (many distinct repliers > many likes).
- Short, punchy posts beat long ones. **End with a direct question** (reports 3–5x more replies).
- Image posts outperform text-only (~60%) even on Threads → attach 1 app screenshot when it helps.
- Replying to comments matters as much as posting; reply to every comment within the first hours.
- Peak: weekday mornings (US/EU time zones), Wednesday strongest.

### Threads formats to rotate
1. **"Can you hear it?" quiz** — Korean phrase as written vs. as actually heard (connected speech). Ask: "How would you write what you hear?"
2. **One-liner insight** — "Koreans don't say X, they say Y" + question.
3. **Learner pain hook** — "You know the words but can't catch them in K-dramas? Here's why: ..." + app mention softly.
4. **Mini-thread (3–5 posts)** — one listening rule explained step by step, last post = app link.

## Instagram
- **Carousels**: highest engagement for education (median ~6.9% vs Reels ~3.3%); saves 3–4x Reels.
- **Reels**: ~2x more non-follower reach → the viral/discovery format. Mix in ~1 Reel per week.
  - 9:16 (1080×1920), 7–20s, hook in the first 1–2s on screen as text, loopable ending.
  - Audio: use the app's own Korean audio (listening clips/TTS) — the sound IS the content for a listening app.
    API publishing cannot attach Instagram's trending music library, so no trending-audio dependence.
  - Reel formats: "Listen — what did they say?" (play clip → pause → reveal spelling vs. sound),
    "Native speed vs. slow" side-by-side, app screen recording of a daily-plan session.
- Slide 1 = hook (big text over screenshot), slides 2–8 = one idea per slide, last = CTA (link in bio / Google Play).
- Max 10 slides; all cropped to the first slide's ratio → use 4:5 (1080×1350) consistently.
- Caption: hook line, 2–4 lines of value, question, 3–5 niche hashtags (#learnkorean #koreanlistening #studykorean #koreanlanguage #kdrama).

### Instagram formats to rotate
1. **Listening decoding rule** (from src/data/listening rules) — "Why 같이 sounds like 가치".
2. **Grammar in 5 slides** (from /grammar content) with app screenshot of the lesson.
3. **Feature-in-a-scene** — daily plan, SRS review, K-Stars clips (screenshot-led), always framed as "when you…" not a feature list.
   AI pronunciation scoring is paused — do not promote it as a benefit.
4. **Save-worthy list** — "10 phrases you'll hear in every K-drama".

## Rules
- Value first; app promotion ≤ 1 of every 3 posts as the main topic, otherwise soft CTA only.
- Every claim about Korean must be correct (double-check against app data).
- Nothing is handed off without explicit owner approval per post; the owner uploads manually.
