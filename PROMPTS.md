# Project Prompts History

This document collates all prompts used to design and build the **CABERNET SAUVIGNON WINE MAKING PROCESS CHALLENGE** application, in chronological order.

---

## Prompt 1 — Initial Application & Quiz Specification

Build a live, multiplayer interactive quiz web application using React (Vite + Tailwind CSS) and Supabase titled "CABERNET SAUVIGNON WINE MAKING PROCESS CHALLENGE".

### 1. SUPABASE REAL-TIME LEADERBOARD INTEGRATION
- Connect directly to Supabase using `@supabase/supabase-js`.
- Read credentials from environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, with fallback placeholder variables at the top of a `supabaseClient.js` file so it works cleanly on Vercel.
- Use the existing `leaderboard` table with columns: `id`, `nickname`, `score`, `current_question`, `is_finished`, `got_speed_bonus`, `finished_at`, `created_at`.
- Subscribe to Supabase Realtime (`postgres_changes`) on the `leaderboard` table so every connected student sees the leaderboard update immediately without refreshing the page.
- Include a "Reset Leaderboard" button tucked in the corner protected by PIN `1234` so the instructor can clear scores between classes.

### 2. LOGIN & USER FLOW
- **Login Screen:** Students only enter a **Nickname** and click "Start Challenge" to join. Upon joining, insert a new row into the Supabase `leaderboard` table with `score: 0` and `current_question: 1`.
- **Quiz Layout:** Split-screen layout on desktop (stacked on mobile):
  - **Left Side (70% width):** The Quiz Interface.
  - **Right Side (30% width):** The Live Leaderboard.

### 3. GAMEPLAY, SCORING & ANSWER FEEDBACK
- Display one question at a time with radio-style selectable option cards.
- **Submission Flow:** Students select an option, then click **"Submit Answer"** to lock in and confirm their choice.
- **Visual Feedback upon Submission:**
  - Highlight the **correct answer in green** (green border and light green fill).
  - Highlight **all wrong options in red** (red border and light red fill).
  - Display a "Next Question" button to advance.
- **Scoring & Database Updates:**
  - **+1 point** for each correct answer; **0 points** for wrong answers. Update the student's `score` and `current_question` in Supabase immediately after every question.
  - **Speed Bonus (+3 Marks):** When a student submits Question 15, check Supabase to see if any row already has `got_speed_bonus = true`. If nobody has claimed it yet, award **+3 bonus points** to this student's final score, set `got_speed_bonus = true`, `is_finished = true`, and record `finished_at`.

### 4. LIVE LEADERBOARD REQUIREMENTS
- Sort players by **Total Score (highest first)**, then by **earliest `finished_at` / `created_at`**.
- Clearly badge **1st Place** (e.g., Gold/Crown icon) and clearly indicate **Last Place** at the bottom of the list.
- Display a `+3 First Finisher` badge next to the student who won the speed bonus.
- Show each player's Rank, Nickname, Progress (e.g., `Q4/15` or `Completed`), and Score.

### 5. STRICT COLOR PALETTE & TYPOGRAPHY
- **All Main Headings (H1):** `#8c1f3d`
- **All Sub-headings (H2, H3, Scenario description):** `#0b4f36`
- **All Quiz Questions & Option Text:** `#1a1a1a`
- **Leaderboard Background Color:** `#f7f1e6`
- **Leaderboard Font Color:** `#1a1a1a`
- Keep the main quiz background clean white (`#ffffff`) for maximum readability.

### 6. QUIZ CONTENT & SCENARIO
- **Main Title:** CABERNET SAUVIGNON WINE MAKING PROCESS CHALLENGE
- **Scenario Sub-heading:** Make an AOC label Premium Cabernet Sauvignon majority blended red wine in France. It should have complex flavors of Primary and Secondary (oak).

**Questions & Answers:**
- **Question 1:** Select the most suitable region to plant this grape:
  A) Burgundy | B) Hermitage | C) Bordeaux [CORRECT] | D) Alsace
- **Question 2:** Select the most suitable village for premium wine for this grape:
  A) Pomerol | B) Pauillac [CORRECT] | C) Saint-Emilion | D) Sauternes
- **Question 3:** Which other red wine grape would you plant to blend in with this grape?
  A) Grenache | B) Syrah | C) Merlot [CORRECT] | D) Pinot Noir
- **Question 4:** Which yield would you choose?
  A) Low Yield [CORRECT] | B) High Yield
- **Question 5:** After harvesting what would you do at the winery?
  A) Crush Cabernet Sauvignon and Merlot mixed together | B) Crush Cabernet Sauvignon and Merlot separately [CORRECT]
- **Question 6:** After crushing what would you do next?
  A) Ferment Cabernet Sauvignon separately and Merlot Separately [CORRECT] | B) Mix the Cabernet Sauvignon and Merlot juice to co-ferment together.
- **Question 7:** When would the fermentation complete?
  A) Within 24 hours | B) Between 1 to 4 days | C) Between 7 to 21 Days [CORRECT] | D) Between 30 to 60 days
- **Question 8:** After fermentation what would you do with the wine?
  A) Drain the wine that is purely liquid away [CORRECT] | B) Bottle the wine | C) Transfer the wine into oak barrel | D) Keep the wine in stainless steel tank
- **Question 9:** What would you do next with the balance skins?
  A) Throw the skins into the vineyard. | B) Press the skins to extract the rest of the wine from the skin. [CORRECT]
- **Question 10:** What would you do with the wine from the pressed skin?
  A) Mix everything with the drained wine into the oak barrel. | B) Mix half with the drained wine into the oak barrel. | C) Keep separately in oak barrel from the drained wine. [CORRECT]
- **Question 11:** Would you blend together the Cabernet Sauvignon and Merlot together before putting them into the oak barrel for maturation?
  A) Yes – blend together and mature in same oak barrels. | B) No – Keep them in separate oak barrels. [CORRECT]
- **Question 12:** How long would you mature the wine in the oak barrels?
  A) 3-6 months | B) 12 – 24 months [CORRECT] | C) 24-48 months | D) 48-60 months
- **Question 13:** After Maturation has completed, what would you do next?
  A) Bottle each barrel separately | B) Bottle only the barrels that taste good. | C) Taste and Blend More Cabernet Sauvignon with some Merlot [CORRECT]
- **Question 14:** What would you do with the pressed wine from the skin?
  A) Taste to decide if any portion needs to be added to the final blend [CORRECT] | B) Bottle separately to sell as a thick, tannic red wine
- **Question 15:** After deciding on the blend portions (recipe), what would you likely do next?
  A) Leave all the wines to continue maturing in the barrel | B) Bottle the wines according to the portion (recipe) confirmed [CORRECT]

---

## Prompt 2 — Live "Joined Participants" Display

Add a live "Joined Participants" display in the top right area of the screen (both on the Login Screen and during the Quiz).

Requirements:
- Sync in real time with the Supabase `leaderboard` table so that as soon as any student enters their nickname and joins, their name immediately appears as a clean pill/badge in the top right corner for everyone to see.
- Show a live count badge (e.g., "Joined Players (4)") followed by the list of nicknames.
- Style the badges cleanly to match our color palette: soft cream `#f7f1e6` background, `#0b4f36` or `#8c1f3d` border, and `#1a1a1a` text so they are easy to read while students are waiting in the lobby or playing.

---

## Prompt 3 — Admin / Projector View & QR Code

Update the app to add a password-protected "Admin / Projector View" with a scannable QR code for this quiz, and restrict the "Reset Leaderboard" button strictly to logged-in Admins.

Requirements:
1. **Remove Reset Button from Student / Participant Screens:**
   - Completely remove the "Reset Leaderboard" button from the student login screen and the student quiz screen so participants never see it or have access to it.
   - Only display the "Reset Leaderboard" button inside the authenticated Admin Projector View.

2. **Admin Login Button & Modal:**
   - Add a small, subtle "Admin Login" link/button in the bottom corner of the Login Screen.
   - When clicked, open a clean modal asking for **Admin Username** and **Admin Password**.
   - Set the initial credentials to Username: `admin` and Password: `wine2026` as constants at the top of the file.
   - Show a red error message if invalid credentials are entered.

3. **Full-Screen Admin Projector View (Shown Only After Admin Login):**
   - Hide the student nickname login box and quiz questions completely.
   - Use our exact color palette: `#f7f1e6` cream background, `#8c1f3d` main heading ("CABERNET SAUVIGNON WINE MAKING PROCESS CHALLENGE"), `#0b4f36` sub-headings, and `#1a1a1a` text.
   - **QR Code Card (For This Specific Quiz):**
     - Generate a crisp, scannable QR code (using `qrcode.react` or a clean QR SVG library) pointing specifically to this quiz's live URL (`window.location.origin + window.location.pathname` so it always opens this exact quiz link and never mixes with future apps).
     - Display a clear label under the QR code: **"Scan to Join: Cabernet Sauvignon Challenge"** along with the visible URL text underneath.
   - **Live Joined Players Section:** Show the live count ("Joined Players") and large pill badges of every student's nickname as they join in real time.
   - **Main Center Live Leaderboard:** Display a large, projection-friendly leaderboard showing Rank, Nickname, Progress (`Q4/15` or `Completed`), `+3 First Finisher` badge, 1st Place and Last Place badges, and Total Score.
   - **Admin-Only Controls (Top or Bottom Corner):**
     - **"Reset Leaderboard"** button (simple "Are you sure you want to clear all scores?" confirmation dialog—no extra PIN needed).
     - **"Log Out"** button to exit Admin Projector View.

---

## Prompt 4 — Eyebrow Text Update

Change the small eyebrow text above the main heading from "Bordeaux Winemaking Simulation · 15 Questions" to "French Cabernet Sauvignon AOC Label Winemaking Challenge · 15 Questions" (apply this change wherever that eyebrow text appears across all views).

---

## Prompt 5 — Supabase Authentication for Admin

Replace the hardcoded Admin credentials with real Supabase Authentication (`supabase.auth.signInWithPassword`) so no username or password is stored anywhere in the frontend code.

Requirements:
1. **Admin Login Modal:**
   - Keep the two input fields labeled **Admin Username** and **Admin Password**.
   - When the user submits the form, automatically format the username into an email if it doesn't contain `@` (e.g., `${username.trim().toLowerCase()}@admin.local`) and pass it to `supabase.auth.signInWithPassword({ email, password })`.
   - Show a clear red error message if Supabase returns an authentication error ("Invalid admin username or password").
2. **Secure Admin Session & Projector View:**
   - Verify the active admin session via `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange` before displaying the Admin Projector View or the "Reset Leaderboard" button.
   - Make sure the "Log Out" button calls `supabase.auth.signOut()` and returns to the normal participant view.
   - Remove all hardcoded admin usernames or passwords from the codebase.

---

## Prompt 6 — Synchronized Waiting Lobby

Add a synchronized "Waiting Lobby" state controlled by the Admin using the existing `leaderboard` table (no new Supabase tables needed).

Requirements:
1. **Sync Start State via Existing `leaderboard` Table:**
   - Use a dedicated control row in the existing `leaderboard` table where `nickname === '__QUIZ_STATE__'` (if it doesn't exist yet, create it automatically with `is_finished: false`, `score: 0`).
   - Use this row's `is_finished` boolean to represent whether the quiz has started (`false` = Waiting Lobby, `true` = Quiz Started).
   - **Important:** Filter out `nickname === '__QUIZ_STATE__'` from the Joined Players count, Joined Players list, and Live Leaderboard so it never appears as a participant.

2. **Participant Waiting Lobby (When Not Started Yet):**
   - After a student enters their nickname and joins, DO NOT show Question 1 yet.
   - Instead, show a clean **Waiting Lobby** screen displaying a status banner (`"Waiting for instructor to start the challenge..."`), the live **Joined Players** list, and the **Live Leaderboard** (without the QR code).
   - As soon as the Admin clicks "Start Quiz", automatically transition every joined student's screen straight into Question 1 in real time without refreshing!

3. **Admin Projector Panel Controls:**
   - Add a prominent **"Start Quiz"** button in the Admin Projector View (styled in `#0b4f36` green) while waiting. Clicking it updates the `'__QUIZ_STATE__'` row to `is_finished = true`.
   - Once started, replace the button with a `"Quiz in Progress"` status badge.
   - When the Admin clicks **"Reset Leaderboard"**, delete all participant rows (where `nickname !== '__QUIZ_STATE__'`) AND set the `'__QUIZ_STATE__'` row back to `is_finished = false` so the room returns to Waiting Lobby mode.

---

## Prompt 7 — Synchronized 10-Second Countdown Timer

Add a big, synchronized 10-second countdown timer that runs after the Admin clicks "Start Quiz" before Question 1 opens for participants.

Requirements:
1. **Sync Countdown Using the Existing `__QUIZ_STATE__` Row:**
   - When waiting before the quiz starts (`is_finished === false` and `finished_at === null`), show a large countdown badge/box directly below the "Start Quiz" / "Quiz in Progress" button in the Admin Projector View displaying **"10 SECONDS"**.
   - When the Admin clicks **"Start Quiz"**, update the `__QUIZ_STATE__` row in Supabase by setting `finished_at` to the current timestamp (`new Date().toISOString()`) and `is_finished = true`.
   - Use `finished_at` so both the Admin Projector View and every joined student's Waiting Lobby calculate the exact remaining seconds (`10` down to `0`) in real time.

2. **Visual Countdown Behavior (10 -> 0):**
   - **On the Admin Projector View:** Directly below the top-right status button (`Quiz in Progress`), display a big, bold countdown display (`10`, `9`, `8` ... `1`, `0`) styled in `#8c1f3d` burgundy with `#f7f1e6` cream background. Once it hits `0`, show `"LIVE - GO!"` in `#0b4f36` green.
   - **On Student Waiting Lobby Screens:** As soon as the countdown starts, show a large, exciting countdown overlay/banner (`"Get Ready! Starting in 10... 9... 8..."`) on every joined student's phone while keeping Question 1 hidden.
   - **When the timer hits `0`:** Automatically reveal Question 1 on every student's screen simultaneously!

3. **Reset Behavior:**
   - When the Admin clicks **"Reset Leaderboard"**, reset the `__QUIZ_STATE__` row back to `is_finished = false` and `finished_at = null` so the big timer resets cleanly back to **"10 SECONDS"**.
