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
