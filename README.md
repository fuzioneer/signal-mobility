# Signal Mobility

A phone web app for GOWOD-style mobility testing (with live camera body tracking) and guided stretching routines. All data stays on the phone. Export a backup from Settings.

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

Countdown clips generated with Piper TTS (rhasspy/piper) using the British "Southern English Female" voice (trained on OpenSLR 83, CC BY-SA 4.0) and "Alan" voice (Mycroft mimic3).
