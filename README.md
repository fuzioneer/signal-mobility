# Signal Mobility

A phone web app for mobility testing (with live camera body tracking) and guided stretching routines. All data stays on the phone. Export a backup from Settings.

## Put it online with GitHub Pages

1. Sign in at github.com and create a new repository called `signal-mobility` (Public).
2. On the new repo page, choose **uploading an existing file**. Drag in everything from this folder, including the `icons` folder. Commit.
3. Go to **Settings > Pages**. Under Source pick **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
4. After a minute or two the site is live at `https://<your-username>.github.io/signal-mobility/`.

## Install on iPhone

1. Open that address in Safari.
2. Tap Share, then **Add to Home Screen**.
3. Open Mobility from the new icon. Allow camera access the first time you use a camera test.

The first camera test downloads the tracking model (a few MB). After that it works offline.

## Versions

The version shows at the bottom of the Today screen and in Settings.

- 1.13.0 (12 Nov 2026): new "Before a run" and "After a run" routines with 7 new moves (hip circles, lunge with twist, A-skips, pogo hops, world's greatest stretch, standing quad, standing side bend) and a Running filter; equipment wording made generic (anything sturdy, a towel instead of a band, and so on).
- 1.14.0 (12 Nov 2026): offline photo saving now lives only in Settings; moves with two positions show a photo of each and slowly cross-fade between them.
- 1.15.0 (12 Nov 2026): moves can now have any number of positions (down dog pedals shows both heels, overhead squat, bird dog, seated rotations and thread the needle start from their set-up position, Cossack squats show both sides); full-screen photos get left and right arrows (or swipe) to step through each position.
- 1.15.1 (12 Nov 2026): fixed background music staying almost silent on iPhone (the phone could report the coach as still speaking, keeping the music ducked); music status now shows in the diagnostics log.
- 1.15.2 (12 Nov 2026): if the phone's audio clock freezes (seen in Firefox on iPhone), the music switches to a pre-rendered seamless loop played as a normal audio file.
- 1.15.3 (12 Nov 2026): background music restarts automatically if the phone pauses it when the coach speaks (or on the next tap if the phone blocks the restart).
- 1.15.4 (12 Nov 2026): removed third-party brand references; average markers now labelled "typical score".
- 1.15.5 (12 Nov 2026): on iPhone and iPad the background music now always plays as a pre-rendered loop started from the Play tap (the coach's voice was freezing the generated music); pausing mutes it.
- 1.15.6 (12 Nov 2026): on iPhone the music waits until the coach has finished the whole message before restarting (restarting early was cutting the coach off), and comes back as soon as the coach finishes.
- 1.15.7 (12 Nov 2026): on iPhone the music now pauses itself just before the coach speaks and returns when the coach finishes (iOS was cutting the coach off when it paused the music itself).
- 1.16.0 (12 Nov 2026): new Hyrox warm-up, Hyrox recovery, Golf warm-up and Golf mobility routines; new moves (club hip hinge, club shoulder turns, wrist and forearm stretch) with photos; Hyrox and Golf filters.
- 1.17.0 (12 Nov 2026): favourite sport setting (CrossFit, Hyrox, running, golf, lifting, cycling, desk/general) sets the top stretches and routines on Today; Build your own now has a front and back body map to pick muscle groups, filtering the moves to match.
- 1.17.1 (12 Nov 2026): new Before a ride, After a ride and Cyclist's posture routines with a Cycling filter; they are now the top routines when Cycling is your sport.
- 1.17.2 (12 Nov 2026): more realistic body map (body outline and muscle shapes where they sit); tapping a muscle labels it on the figure and shows its name, what it is and how many moves stretch it.
- 1.17.3 (12 Nov 2026): body map shows a male or female figure to match the sex set in Settings.
- 1.17.4 (12 Nov 2026): body map proportions refined: slimmer male figure, narrower female hips, larger heads.
- 1.17.5 (12 Nov 2026): body map calves moved lower down the leg and ankles slimmed.
- 1.17.6 (12 Nov 2026): body map muscle groups (posterior chain, anterior chain, hips, shoulder girdle, upper body, lower body) select all their muscles in one tap.
- 1.17.7 (12 Nov 2026): sideways-scrolling button rows (muscle groups, muscles, library filters) now show left and right arrows and fade at the edges; rows keep their scroll position when you tap.
- 1.18.0 (12 Nov 2026): language setting (English, Español, Français, Deutsch, Italiano, Português). Translates the whole interface, the coach's spoken lines, all stretch names and instructions, routines and tests; the coach uses a voice in the chosen language and dates follow the language. The recorded 3, 2, 1 clips are English, so other languages count down with the coach's voice. First launch follows the phone's language.
- 1.18.1 (12 Nov 2026): language files moved next to the other app files (lang-xx.js) and loaded directly by the page, so switching language reliably takes effect; a warning appears if a language file is missing.
- 1.19.0 (12 Nov 2026): Strava connection (Settings > Strava). Finished sessions are logged to Strava as Yoga, Workout or Pilates activities with the routine name, duration and moves; sessions finished offline are queued and sent later. Uses your own Strava API app (Client ID and Secret stay on the phone).
- 1.19.1 (12 Nov 2026): Mobility added as a Strava activity type (now the default). Strava has no Mobility sport type, so it logs as a Workout titled "Mobility: routine name".
- 1.20.0 (12 Nov 2026): mobility reminders in Settings: time, how often (every day, weekdays, weekends, Mon/Wed/Fri or chosen days), which routine and alert lead time. Reminder by Calendar alert (repeating event, works with the app closed), a card on Today when it's time, and a notification when the app is open or in the background. Reminder links open the app on that routine.
- 1.21.0 (12 Nov 2026): lock-screen and Control Centre controls during routines (move, phase, time left, pause, skip, back, +15s); Easier, Harder and +15s buttons in the player; after-session feedback (too easy, about right, too much) adjusts hold times, and moves that hurt are swapped for easier ones or skipped next time; My equipment setting swaps or skips moves you don't have the kit for, with notes on each routine. Personal adjustments can be reviewed and reset in Settings.
- 1.21.1 (12 Nov 2026): fixed routines pausing at the halfway call on iPhone (iOS reported the coach's voice as a lock-screen pause).
- 1.21.2 (12 Nov 2026): small icons for each item in My equipment.
- 1.21.3 (12 Nov 2026): Today's streak, minutes and sessions numbers centred in their boxes.
- 1.12.1 (12 Nov 2026): tap a stretch or test photo to view it full screen (pinch to zoom, tap to close).
- 1.12.0 (12 Nov 2026): "Save all photos for offline" (Settings and a one-time prompt on Today) downloads every stretch photo to the phone so routines work with bad or no signal.
- 1.11.0 (12 Nov 2026): photos for every stretch and test (generated with Higgsfield), shown on cards, stretch details, test how-tos and in the routine player with a "Show movement" toggle; photos cache for offline use; option in Settings to go back to stick figures.
- 1.10.5 (12 Nov 2026): Done button pinned to the top of Settings and every pop-up; swipe the top bar down to close.
- 1.10.4 (12 Nov 2026): female countdown voice replaced (the old one was garbled); male British voice is now the default; ignore opaque browser script errors in Diagnostics.
- 1.10.3 (12 Nov 2026): countdown voice clips embedded in the app (clips.js) so they no longer depend on the audio folder loading; load errors logged in Diagnostics.
- 1.10.2 (12 Nov 2026): countdown falls back to the voice on any audio error; Diagnostics panel in Settings logs countdown events and errors.
- 1.10.1 (12 Nov 2026): countdown falls back to the phone's voice if the audio clock is stalled (fixes silent 3, 2, 1 on iPhone); clips preload on first tap; "10 seconds" call simplified.
- 1.10.0 (12 Nov 2026): new "Tight hips, in bed" routine and 7 bed-friendly stretches (knee hugs, windscreen wipers, happy baby, reclined butterfly, bed-edge hip flexor, side-lying quad, lying hamstring); "On a bed" filter in the library.
- 1.9.0 (11 Nov 2026): 3, 2, 1 now plays recorded number clips on the audio clock for exact one-second gaps, with a soft chime on zero. Choose female voice, male voice, beeps or off in Settings.
- 1.8.4 (11 Nov 2026): 3, 2, 1 timed from when the voice actually starts, so the gaps are even and the hold ends exactly on time.
- 1.8.3 (11 Nov 2026): halfway call on every hold of 24 seconds or more (was only 60-second holds).
- 1.8.2 (11 Nov 2026): 3, 2, 1 countdown no longer runs numbers together or cuts off "one".
- 1.8.1 (11 Nov 2026): music now starts with the first hold, not during the get-ready countdown; it ducks much further and immediately whenever the coach speaks, and sits lower between moves.
- 1.8.0 (11 Nov 2026): set time between exercises (default 10 s) and time to switch sides (default 5 s) in Settings; kit called out at the start of each move; music fades out when you pause and back in when you resume.
- 1.7.0 (11 Nov 2026): spoken "ten seconds to go" reminder and a 3, 2, 1 countdown at the end of each hold.
- 1.6.1 (11 Nov 2026): fix music not starting until toggled off and on (iOS audio context left suspended).
- 1.6.0 (11 Nov 2026): gentle background music for routines (calm pads, singing bowls or ocean waves), generated on the phone; dips when the coach speaks.
- 1.5.1 (11 Nov 2026): voice download instructions updated for iOS 26 (General > Read & Speak).
- 1.5.0 (11 Nov 2026): more natural coach voice: picks the best voice on the phone, conversational phrasing with variety, voice and speed choice in Settings.
- 1.4.0 (11 Nov 2026): version indicator added.
- 1.3.0 (11 Nov 2026): selfie camera by default, spoken coaching during camera tests, captioned images saved to Photos.
- 1.2.0 (11 Nov 2026): every test can be measured with the camera; height setting for cm estimates.
- 1.0.0 (11 Nov 2026): first release.

## Credits

Countdown clips generated with Piper TTS (rhasspy/piper) using the "Alan" (British male) and "Amy" (American female) voices from Mycroft mimic3.
