# Movage

*Joint Venture*

(Formerly Signal Mobility. The repository and web address keep the old name.)

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

- 1.68.3 (17 Nov 2026): Ready for Strava's 64-bit activity IDs (from 1 June 2027): the app reads IDs from Strava's id_str field, or from the raw reply, so they're never rounded and the Recovery tag always goes on the right activity.
- 1.68.2 (17 Nov 2026): Bigger joint angle numbers on the camera view, and the joints that count for the current test (for example shoulders for shoulder flexion, hips for the straight leg raise, knees and ankles for knee-to-wall) are shown much larger in a highlighted box with a bigger arc.
- 1.68.1 (17 Nov 2026): Each joint angle on the camera wireframe now has a small shaded arc showing the angle, with the number placed beside it so it doesn't cover the arc or the body lines.
- 1.68.0 (17 Nov 2026): Knee-to-wall is now done the standard way at a real wall: start with the toe about 5 cm away, touch the wall with the knee, step back 1 cm at a time until the knee only just reaches. The camera treats the furthest point the knee reaches as the wall, only counts touches with the heel down, and records the toe-to-wall distance for the last touch (a tape measurement can still be typed in). The camera view now shows the angle at each main joint (shoulders, elbows, hips, knees, ankles) as a number beside the wireframe.
- 1.67.0 (17 Nov 2026): Strava sessions are now sent as a list of exercises (one per hold, each matched to Strava's own exercise type, such as pigeon pose, kneeling hip flexor stretch or 90/90 hip rolls), so Strava fills in the muscle map for the activity. Still tagged Recovery with the same title and description. If Strava won't take the exercise list, or the activity type is set to something other than Mobility or Workout, it is sent the old way.
- 1.66.0 (17 Nov 2026): New 3, 2, 1 countdown voice: Cori (British female, Piper TTS, trained on public-domain recordings, so cleared for App Store use). She is now the default, and anyone on the old male voice is moved to her once (male can still be picked in Settings). The old American female voice is gone.
- 1.65.1 (16 Nov 2026): The 8-week stretching calendar labels every row (M T W T F S S), in the app's language.
- 1.65.0 (16 Nov 2026): New "Mobility test warm-up" routine (arm circles, cat-cow, world's greatest stretch, leg swings, knee-to-wall rocks; about 6 minutes, all six zones) with a "Warm up first" button at the top of the mobility test.
- 1.64.0 (16 Nov 2026): Removed the ankle dorsiflexion (shin lean) test, which measured the same movement as knee-to-wall. The full test is now 11 tests in about 15 minutes; the quick test is unchanged (6 tests, about 8 minutes). Its "Improve your ankle bend" routine is gone, the ankle goal now uses knee-to-wall (10 cm), and saved shin lean goals move across automatically.
- 1.63.1 (16 Nov 2026): The 90/90 hip rotation test uses the 90/90 stretch demo video (women and men). It plays once and stops on the last frame instead of looping (VIDEO_NOLOOP in videos.js).
- 1.63.0 (16 Nov 2026): Demo videos for the Thomas hip flexor test (women and men): sit on the end of the bench, catch one knee as it comes up and roll back to hug it, other leg relaxed with the foot near the floor.
- 1.62.1 (16 Nov 2026): Sign-in with Google is switched off for now (GOOGLE_SIGNIN in app.js). Community sign-in is by emailed code only.
- 1.62.0 (16 Nov 2026): Optional gender on the Community profile (Female, Male, Non-binary, Other or Prefer not to say). Private like name, country and age, and kept in step with the website.
- 1.61.1 (16 Nov 2026): Tidier Settings. Voice coaching, Beeps, Full screen view and Play over music are now on/off switches, each on its own row with the label beside the switch.
- 1.61.0 (16 Nov 2026): Private profile details. Settings has Last name and Country next to First name, and setting up a Community profile now asks for first name, last name, country and an optional age. They are stored on your account (never shown to other members) and kept in step between the phone and the website.
- 1.60.1 (16 Nov 2026): Community, Top clubs: when your club isn't on the board because it has only 1 member, the empty board now says so and suggests inviting someone.
- 1.60.0 (16 Nov 2026): When the get-ready countdown ends, each stretch switches to a full screen view: demo video (or photo) at the top, then the move name and side, a large timer, the Easier, +15s and Harder buttons, and previous, pause and next. It closes itself for the last 3 seconds and the gap before the next move. Can be turned off in Settings ("Full screen view during each stretch").
- 1.59.0 (16 Nov 2026): The coach's voice and beeps now play over music from other apps (Spotify, Apple Music) instead of pausing it (iPhone audio session "ambient"). New Settings option "Play over music from other apps", on by default; turn it off to go back to the old behaviour, which ignores the silent switch but pauses other music.
- 1.58.1 (16 Nov 2026): During a routine, the full screen demo video or photo now sits at the top of the screen with the routine timer large and centred below it.
- 1.58.0 (16 Nov 2026): A full screen demo video opened during a routine now shows the routine timer circle in the top left, counting down with the stretch.
- 1.57.9 (16 Nov 2026): During a routine, a full screen photo or demo video opened mid-stretch now closes itself in the last 3 seconds, so it no longer hides the countdown and the next move.
- 1.57.8 (16 Nov 2026): Hip internal rotation test video for the female model, with the towel between the knees.
- 1.57.7 (16 Nov 2026): Hip internal rotation test video for the male model.
- 1.57.6 (16 Nov 2026): New hip internal rotation photos (female and male) and camera setup diagram, showing one foot out at a time with a towel between the knees.
- 1.57.5 (16 Nov 2026): Hip internal rotation test is now done one leg at a time (camera voice says "Then do the other leg"), with a tip that a rolled towel or foam roller squeezed between the knees helps keep them still.
- 1.57.4 (16 Nov 2026): Strava sessions now reliably get the Recovery tag: if Strava drops the tag when the activity is created, the app adds it straight after with an activity update.
- 1.57.3 (15 Nov 2026): Fixed the routine finish screen not scrolling, which hid the feedback and the Finish button on longer routines.
- 1.57.2 (15 Nov 2026): Demo videos for the standing toe touch test (female and male), on the floor.
- 1.57.1 (15 Nov 2026): Fixed the move-swap note on routines being unreadable in dark mode (light text on a light box). Tight Hips is done on a bed, so the bed now counts as the furniture its moves need and they are no longer swapped out when furniture is not ticked in your equipment.
- 1.57.0 (15 Nov 2026): Standing toe touch is now done on a flat floor, not on a box or step: new instructions, photos and camera setup diagram, scored from -30 cm up to 0 (fingertips touching the floor), and the camera reading stops at 0. "Tight hips, in bed" renamed "Tight Hips".
- 1.56.1 (15 Nov 2026): Demo videos for the straight leg raise test (female and male).
- 1.56.0 (15 Nov 2026): Today page opens with Good morning, Good afternoon or Good evening, followed by your first name when you are signed in. First name is a new field in Settings, filled in from your Google account the first time you sign in with Google.
- 1.55.0 (15 Nov 2026): Favourites. A heart button on every routine and stretch sheet. Favourite routines appear at the top of Routines, For you, and favourite stretches get their own Favourites filter in the stretch library. Hearts show on the cards, and favourites are kept in backups.
- 1.54.2 (15 Nov 2026): Tapping a test's name now does the same as tapping its picture: the full screen video if it has one, otherwise the photo. Tapping the picture itself also opens the photo now for tests without a video.
- 1.54.1 (15 Nov 2026): Demo videos for the seated thoracic rotation test (female and male), done on a chair.
- 1.54.0 (15 Nov 2026): "Share to Strava" tick box on the finish screen when Strava is connected. It is ticked by default (the Settings option now sets that default) and the session is only sent if it stays ticked, when you close the screen, leave the app, or after 3 minutes.
- 1.53.2 (15 Nov 2026): New male photo for the seated thoracic rotation test.
- 1.53.1 (15 Nov 2026): Seated thoracic rotation is now done sitting on a chair instead of cross-legged on the floor, with new instructions, photos, camera setup diagram and stick figure.
- 1.53.0 (15 Nov 2026): Quick test option on the Test tab: 6 tests, one per scored zone (shoulder flexion, back scratch, seated thoracic rotation, standing toe touch, 90/90 hip rotation, knee to wall), about 8 minutes, guided one at a time with its own progress bar.
- 1.52.0 (15 Nov 2026): Removed the wall overhead reach test (it overlapped with shoulder flexion), so the test is now 12 moves and the overhead zone is scored from shoulder flexion alone. The "Arms fully overhead" goal now targets 170° shoulder flexion on both sides, and any existing wall reach goals move over automatically.
- 1.51.1 (15 Nov 2026): Shoulder flexion test video for the male model, with a matching new photo.
- 1.51.0 (15 Nov 2026): every mobility test now links to a routine that works on that range of motion ("Routine to improve this" at the bottom of each test card). The 13 routines also sit in a collapsible "Improve a test result" group on Routines, For you.
- 1.50.3 (15 Nov 2026): Shoulder flexion test now has a demo video (female model; male to follow). Tall clips are now shown in full instead of being cropped square.
- 1.50.2 (15 Nov 2026): Back scratch camera setup diagram now shows the phone at chest height, matching the spoken setup.
- 1.50.1 (15 Nov 2026): Corrected camera setup diagram for shoulder external rotation.
- 1.50.0 (15 Nov 2026): Every mobility test now has a camera setup diagram in "How to do it", showing the person as a silhouette in a simple room outline and where to put the phone, how high and how far away.
- 1.49.5 (15 Nov 2026): New female shoulder external rotation video, with her other hand resting on her stomach throughout.
- 1.49.4 (15 Nov 2026): Shoulder external rotation test now has corrected one-arm photos (the far hand rests on the stomach) and a half-speed demo video with both models. The numbers in the test result boxes and the Score so far figure are now centred.
- 1.49.3 (15 Nov 2026): Save test is now a small button in the top bar next to Settings, shown only on the Test tab, instead of the large bar at the bottom. The shoulder external rotation test has new photos showing one arm, the one nearest the camera.
- 1.49.2 (15 Nov 2026): "How to do it" on each test now has an arrow showing it opens, which flips when it is open.
- 1.49.1 (15 Nov 2026): The test camera button now reads "Do Test" next to the camera icon.
- 1.49.0 (15 Nov 2026): Mobility test page now says how long the full test takes (worked out from the tests, plus a 5 minute warm-up), and has a Start test button. The guided test takes you through each test one at a time with a progress bar, how many are done and the time left, with Back, Skip or Next, and Save test at the end. Exit returns to the full list and keeps your results.
- 1.48.3 (15 Nov 2026): The full screen video shows the movement photo and a loading spinner straight away, then fades the clip in as soon as it plays, instead of a blank screen. Opening it from a video that is already playing reuses that video, so it starts instantly.
- 1.48.2 (15 Nov 2026): Tap the play badge on any thumbnail, or tap a demo video, to watch it full screen. It loops until you close it with the X, a tap outside the video, or Escape.
- 1.48.1 (15 Nov 2026): Tapping Camera on a test that has a demo video now shows the looping clip instead of the stick figure. Test videos in "How to do it" now start playing when the section is opened on iPhone.
- 1.48.0 (15 Nov 2026): Mobility tests can now show a demo video in "How to do it", starting with the back scratch test, with both the female and male model.
- 1.47.12 (15 Nov 2026): Mobility test "How to do it" instructions now use the full width of the card instead of being squeezed to the left.
- 1.47.11 (15 Nov 2026): Thread the needle now has a demo video, with both the female and male model, played at 75% speed so the movement is easier to follow.
- 1.47.10 (14 Nov 2026): Standing side bend now has a demo video, with both the female and male model, and hip circles on all fours now has its male video too (half speed, like the female one).
- 1.47.9 (14 Nov 2026): Pigeon pose now has a demo video, with both the female and male model.
- 1.47.8 (14 Nov 2026): Hip circles on all fours now has a demo video (five reps), played at half speed so the circle is easy to follow. Clips can now have their own playback speed.
- 1.47.7 (14 Nov 2026): Downward dog with foot pedals now has a demo video, with both the female and male model. Wide clips are now shown in full instead of being cropped square, so hands and feet stay in view.
- 1.47.6 (14 Nov 2026): Deep squat hold now has a demo video, with both the female and male model.
- 1.47.5 (14 Nov 2026): Cat-cow now has a demo video, with both the female and male model.
- 1.47.4 (14 Nov 2026): Bodyweight good mornings now has a demo video, with both the female and male model.
- 1.47.3 (14 Nov 2026): Ankle pogo hops now has a demo video, with both the female and male model.
- 1.47.2 (14 Nov 2026): Squat to stand videos fixed. The female clip is now a small H.264 file served with the app, so it plays in every browser including Firefox, and the male clip has been remade so he keeps his own short hair.
- 1.47.1 (14 Nov 2026): Squat to stand now has a demo video, with both the female and male model, made from our own reference models.
- 1.47.0 (14 Nov 2026): Accessibility and tidier movement sheets. Every photo and logo now has descriptive alt text for screen readers (for example "Cat-cow, demonstrated by a woman"), translated into all six languages. Movements that have a demo video no longer show the extra "Show the movement" photo toggle, since the video already shows it.
- 1.46.0 (14 Nov 2026): Step through movements. When you open a movement from the stretch library (or any list of movements), left and right arrows under the picture take you to the previous or next movement in that list, with a "3 of 24" counter. It follows your current filter or search, and you can also swipe left or right on the picture.
- 1.45.2 (14 Nov 2026): Updates arrive straight away. The app now always checks for newer files instead of reusing GitHub Pages' 10-minute copies, looks for a new version whenever it comes back to the front, and reloads itself once when a new version takes over (never in the middle of a routine).
- 1.45.1 (14 Nov 2026): Session image rebalanced. The spare height is now shared evenly between the sections so it no longer looks top-heavy or squashed, the Time, Moves and Day streak numbers are centred in their boxes, the logo uses a sharp high-resolution file, move names drop their bracketed extras instead of being cut off, and English dates use the UK format.
- 1.45.0 (14 Nov 2026): Goals. Set up to 3 mobility goals from the Today screen, each with a target date 4, 8 or 12 weeks away: reach a mobility score (your current score plus about 5), touch your toes, arms fully overhead, fingers meeting behind your back, a heels-down deep squat, looser hamstrings, free-turning hips, open hip flexors or more rotation. Each goal is tied to a test result (the weaker side counts), shows a progress bar from where you started, and has "Train for it", which plays a short routine for that zone. When a new test reaches a goal, it's ticked off with a congratulations message. Goals are saved on the phone and included in backups.
- 1.44.0 (14 Nov 2026): Sport packs and lift prep. Routines are now grouped into For you (your daily 10, your sport's routines, everyday routines and your own), By sport and Before a lift. By sport gives each sport an Activate routine for before training and a Recover routine for after: CrossFit, Hyrox, running, cycling, golf, weightlifting and strength, plus new rowing and indoor erg, swimming, triathlon, football, tennis/padel/squash and climbing packs (21 new routines in all). Before a lift has a prep routine for squat and clean, deadlift, snatch/jerk/overhead, bench press, pull-ups, lunges, kettlebell swings, and thrusters and wall balls. The six new sports can also be picked as your sport in Settings. All translated.
- 1.43.1 (14 Nov 2026): Fixed the Community leaderboard staying on "Loading…" when the app opened already signed in. It now fetches the board as soon as the tab opens.
- 1.43.0 (14 Nov 2026): Clubs. Communities are now called clubs: start one from "+ Club" to get a 6-letter invite code and your club's own leaderboard. A new "Top clubs" board under Everyone ranks clubs with 2 or more members by total guided time this week or month, or by average mobility score, and shows each club's member count. Tap your own club on it to open its board. When you create a club you choose whether it appears on Top clubs, and the owner can change that later. Only club names and member counts are shown, never who's in a club. Needs the supabase/migrations-clubs.sql update on the database.
- 1.42.0 (14 Nov 2026): Session image. The finish screen has "Save session image", which makes a 1080x1350 Movage image (logo, routine, date, time, moves, streak, muscles stretched, the moves, @movageapp and www.movage.co.uk) to save or share, and "Open in Strava", which opens the activity just logged so the image can be added there (Strava's API doesn't let apps attach photos).
- 1.41.0 (14 Nov 2026): Strava activities are now tagged Recovery, and the description starts "Mobility work using Movage App (@movageapp)", followed by the muscles worked (most used first) and the list of moves. If Strava ever refuses the tag, the activity is sent without it rather than failing.
- 1.40.0 (13 Nov 2026): "Continue with Google" on the Community sign-in screen, alongside the emailed code. A Google sign-up suggests your first name as the nickname. Invite links still work if you sign in with Google first.
- 1.39.1 (13 Nov 2026): Community tab switched on, connected to the Movage Supabase project (London).
- 1.39.0 (13 Nov 2026): New Community tab. Sign in with an emailed code, choose a nickname, create or join communities with a 6-character code or invite link, and see leaderboards for total mobility time (today, this week, this month) and mobility score, for each community or everyone. Scores measured entirely with the camera get a verified tick, with a camera-verified-only filter. Sharing is opt-in and accounts can be deleted in the app. Runs on Supabase; see supabase/README.md to switch it on.
- 1.38.1 (13 Nov 2026): Removed the animated stick figure from the mobility test "How to do it" sections; the photo and written steps remain.
- 1.38.0 (13 Nov 2026): The splash screen shows the app version number under the logo.
- 1.37.0 (13 Nov 2026): Stretch library is now in alphabetical order (in the chosen language), and a new "With video" filter shows only the moves that have a video demo.
- 1.36.0 (13 Nov 2026): Movage logo added from the brand design pack: in the header of the Today screen, on a short splash screen when the app opens, and on the shared score image. The light and dark versions follow the app theme.
- 1.35.1 (13 Nov 2026): New Tibialis raises photos (female and male) with both heels on the floor and only the toes lifted.
- 1.35.0 (13 Nov 2026): 45 new stretches, taking the library to 102. They cover every zone (neck and shoulders, overhead, upper back, hamstrings, hips and ankles), each with photos of both the female and male model, coaching cues, and translations in all six languages. They work in search, Build your own, the body map and the Make me a routine builder.
- 1.34.1 (13 Nov 2026): The shared score image now includes the Instagram handle @movageapp.
- 1.34.0 (13 Nov 2026): The app is now called Movage, with the tagline "Joint Venture". The new name shows on the home screen icon label, in the app, on shared score images, backups, calendar reminders and feedback emails. Saved data carries over, and backups made under the old name still restore.
- 1.33.0 (13 Nov 2026): Share to Instagram button on the Today score card. It makes a Story sized image (score ring, zone bars, streak and this month's medal) and opens the iPhone share sheet, where you pick Instagram. Where sharing images is not supported, the image is saved instead.
- 1.32.1 (13 Nov 2026): New Bird dog videos (female and male), made by copying the movement from a real demonstration clip, so one arm reaches forward with the opposite leg back, then the other side.
- 1.32.0 (13 Nov 2026): Monthly challenge with Bronze (4 sessions), Silver (8), Gold (12) and Platinum (20) medals each calendar month. Up to two sessions a day count. A card on Today and History shows this month's medal, a progress bar marked with each level, how many more you need and days left. You get a medal message at the end of the session that earns it, and tapping the card shows the levels and your medals from past months.
- 1.31.1 (13 Nov 2026): Routine cards no longer show the video badge, since it only applies to single moves.
- 1.31.0 (13 Nov 2026): Moves with a looping demo video now show a small play badge on their thumbnail, in the Stretch library, routine lists, Make me a routine and the sport picks, with a key above the library. It follows the Female/Male model setting and hides when videos are off.
- 1.30.0 (13 Nov 2026): Make me a routine. Pick 5, 10 or 20 minutes, choose chains, areas or muscles and/or a sport, then say whether it's before training, after training or any time. The app builds a routine that fits the time (rests included), skips moves that hurt or need kit you don't have, and spreads it across the body. Start it, shuffle for a different mix, or save it to your routines. On the Today screen and in Routines.
- 1.29.2 (13 Nov 2026): Library search now matches move names only, so typing 90 shows just the 90/90 moves.
- 1.29.1 (13 Nov 2026): Fixed demo videos stopping when the coach speaks (for example at the halfway call). On iPhone, speech pauses inline videos; the app now restarts the clip straight away unless you have paused the routine.
- 1.29.0 (13 Nov 2026): Search box in the Stretch library. Type part of a move name, a muscle (hamstrings, lower back), an area, a sport tag or a piece of kit (roller, band). It works with the area and sport chips, ignores accents, and English names also work in other languages. Also fixed the Golf filter chip in non-English languages.
- 1.28.3 (13 Nov 2026): New 90/90 switches videos (female and male), made by copying the movement from a real demonstration clip: switch the knees to one side and lean in, then switch to the other side and lean in.
- 1.28.2 (13 Nov 2026): Male Dead bug video remade by copying the movement from a real demonstration clip (motion transfer), so the arms and legs move exactly as they should.
- 1.28.1 (13 Nov 2026): Male Dead bug photos and video remade so the correct arm and opposite leg move on each side.
- 1.28.0 (13 Nov 2026): Dead bug reshot from directly overhead so both sides are clear. New photos (start position, then each side) and new looping videos for both models: one arm goes back along the floor above the head while the opposite leg straightens, both stopping just above the floor, then the other side.
- 1.27.4 (13 Nov 2026): Dead bug video (female) remade from keyframes so only one arm and the opposite leg move at a time.
- 1.27.3 (13 Nov 2026): Dead bug redone from the correct start position (both arms vertical, hips and knees at 90 degrees). New photos and videos for both models: left arm and right leg lower together to just above the floor and return, then right arm and left leg.
- 1.27.2 (13 Nov 2026): New Dead bug videos (female and male) with the correct cross-body pattern: one arm lowers with the opposite leg, then swap.
- 1.27.1 (13 Nov 2026): New Leg swings videos (female and male) with bigger, quicker swings, up to hip height in front and well behind at the back.
- 1.27.0 (13 Nov 2026): Looping demo videos for 11 more moves, in female and male versions: Walking lunge with a twist, Standing hip circles, Leg swings, Upper-back extensions, Cossack squats, Shoulder pass-throughs, Club shoulder turns, Dead bug, Bird dog, 90/90 switches and A-skips (shown on the spot).
- 1.26.0 (13 Nov 2026): World's greatest stretch now shows a short looping video of the full movement instead of a still photo, in the player and on its stretch page. There are female and male model versions, following the Settings choice. It pauses with the routine. Tap it to see the still photos. Save all photos for offline also saves the clips. With Reduce Motion on, or photos turned off, the still photos are shown instead.
- 1.25.1 (13 Nov 2026): The feedback section no longer shows the email address on screen.
- 1.25.0 (13 Nov 2026): Settings has a new Report a bug or suggest an idea section. Choose Bug or New feature idea, describe it, and tap Send by email to open a ready-to-send email in the Mail app. The app version, language and phone details are added (you can turn this off), and bug reports also include the last few lines of the diagnostics log.
- 1.24.0 (13 Nov 2026): Routine timeline at the top of the player. Each stage has its own segment, sized by its time: amber for getting into position, green for each hold, with both sides of a move shown and a gap between moves. The current stage is raised and fills as you go, with a halfway mark on longer holds. Underneath it shows the move number, the stage and the time left for the whole routine. Adding 15 seconds lengthens the bar. Coach captions now sit just below it.
- 1.23.0 (12 Nov 2026): New Settings option, Mobility model in photos: choose a Female or Male model for every stretch photo. Male photos match the same poses, props and room. Tap Save all photos for offline after switching to keep the new set on your phone.
- 1.22.1 (12 Nov 2026): My equipment shows how many items are selected (or that it's off).
- 1.22.0 (12 Nov 2026): accessibility: text size setting (Standard to Largest, or match the iPhone's text size), on-screen captions of everything the coach says (on by default, also shown with the voice off), VoiceOver labels for the body map muscles (as toggle buttons, keyboard operable), player timer, pause/resume and adjust buttons.
- 1.21.3 (12 Nov 2026): Today's streak, minutes and sessions numbers centred in their boxes.
- 1.21.2 (12 Nov 2026): small icons for each item in My equipment.
- 1.21.1 (12 Nov 2026): fixed routines pausing at the halfway call on iPhone (iOS reported the coach's voice as a lock-screen pause).
- 1.21.0 (12 Nov 2026): lock-screen and Control Centre controls during routines (move, phase, time left, pause, skip, back, +15s); Easier, Harder and +15s buttons in the player; after-session feedback (too easy, about right, too much) adjusts hold times, and moves that hurt are swapped for easier ones or skipped next time; My equipment setting swaps or skips moves you don't have the kit for, with notes on each routine. Personal adjustments can be reviewed and reset in Settings.
- 1.20.0 (12 Nov 2026): mobility reminders in Settings: time, how often (every day, weekdays, weekends, Mon/Wed/Fri or chosen days), which routine and alert lead time. Reminder by Calendar alert (repeating event, works with the app closed), a card on Today when it's time, and a notification when the app is open or in the background. Reminder links open the app on that routine.
- 1.19.1 (12 Nov 2026): Mobility added as a Strava activity type (now the default). Strava has no Mobility sport type, so it logs as a Workout titled "Mobility: routine name".
- 1.19.0 (12 Nov 2026): Strava connection (Settings > Strava). Finished sessions are logged to Strava as Yoga, Workout or Pilates activities with the routine name, duration and moves; sessions finished offline are queued and sent later. Uses your own Strava API app (Client ID and Secret stay on the phone).
- 1.18.1 (12 Nov 2026): language files moved next to the other app files (lang-xx.js) and loaded directly by the page, so switching language reliably takes effect; a warning appears if a language file is missing.
- 1.18.0 (12 Nov 2026): language setting (English, Español, Français, Deutsch, Italiano, Português). Translates the whole interface, the coach's spoken lines, all stretch names and instructions, routines and tests; the coach uses a voice in the chosen language and dates follow the language. The recorded 3, 2, 1 clips are English, so other languages count down with the coach's voice. First launch follows the phone's language.
- 1.17.7 (12 Nov 2026): sideways-scrolling button rows (muscle groups, muscles, library filters) now show left and right arrows and fade at the edges; rows keep their scroll position when you tap.
- 1.17.6 (12 Nov 2026): body map muscle groups (posterior chain, anterior chain, hips, shoulder girdle, upper body, lower body) select all their muscles in one tap.
- 1.17.5 (12 Nov 2026): body map calves moved lower down the leg and ankles slimmed.
- 1.17.4 (12 Nov 2026): body map proportions refined: slimmer male figure, narrower female hips, larger heads.
- 1.17.3 (12 Nov 2026): body map shows a male or female figure to match the sex set in Settings.
- 1.17.2 (12 Nov 2026): more realistic body map (body outline and muscle shapes where they sit); tapping a muscle labels it on the figure and shows its name, what it is and how many moves stretch it.
- 1.17.1 (12 Nov 2026): new Before a ride, After a ride and Cyclist's posture routines with a Cycling filter; they are now the top routines when Cycling is your sport.
- 1.17.0 (12 Nov 2026): favourite sport setting (CrossFit, Hyrox, running, golf, lifting, cycling, desk/general) sets the top stretches and routines on Today; Build your own now has a front and back body map to pick muscle groups, filtering the moves to match.
- 1.16.0 (12 Nov 2026): new Hyrox warm-up, Hyrox recovery, Golf warm-up and Golf mobility routines; new moves (club hip hinge, club shoulder turns, wrist and forearm stretch) with photos; Hyrox and Golf filters.
- 1.15.7 (12 Nov 2026): on iPhone the music now pauses itself just before the coach speaks and returns when the coach finishes (iOS was cutting the coach off when it paused the music itself).
- 1.15.6 (12 Nov 2026): on iPhone the music waits until the coach has finished the whole message before restarting (restarting early was cutting the coach off), and comes back as soon as the coach finishes.
- 1.15.5 (12 Nov 2026): on iPhone and iPad the background music now always plays as a pre-rendered loop started from the Play tap (the coach's voice was freezing the generated music); pausing mutes it.
- 1.15.4 (12 Nov 2026): removed third-party brand references; average markers now labelled "typical score".
- 1.15.3 (12 Nov 2026): background music restarts automatically if the phone pauses it when the coach speaks (or on the next tap if the phone blocks the restart).
- 1.15.2 (12 Nov 2026): if the phone's audio clock freezes (seen in Firefox on iPhone), the music switches to a pre-rendered seamless loop played as a normal audio file.
- 1.15.1 (12 Nov 2026): fixed background music staying almost silent on iPhone (the phone could report the coach as still speaking, keeping the music ducked); music status now shows in the diagnostics log.
- 1.15.0 (12 Nov 2026): moves can now have any number of positions (down dog pedals shows both heels, overhead squat, bird dog, seated rotations and thread the needle start from their set-up position, Cossack squats show both sides); full-screen photos get left and right arrows (or swipe) to step through each position.
- 1.14.0 (12 Nov 2026): offline photo saving now lives only in Settings; moves with two positions show a photo of each and slowly cross-fade between them.
- 1.13.0 (12 Nov 2026): new "Before a run" and "After a run" routines with 7 new moves (hip circles, lunge with twist, A-skips, pogo hops, world's greatest stretch, standing quad, standing side bend) and a Running filter; equipment wording made generic (anything sturdy, a towel instead of a band, and so on).
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

Countdown clips generated with Piper TTS (rhasspy/piper). Female: "Cori" (en_GB-cori-high, British), trained by Bryce Beattie on public-domain LibriVox recordings, cleared for commercial use; the default since 1.66.0. Male: "Alan" (en_GB-alan, from Mycroft mimic3 apope), licence "All Rights Reserved", so not cleared for the App Store and due to be replaced. The old "Amy" (US female) clips were removed in 1.66.0 for the same reason.
