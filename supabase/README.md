# Movage community back end (Supabase)

The Community tab (accounts, communities, time and score leaderboards) runs on Supabase. Until
`cloud-config.js` has a project URL and key, the tab shows "Community leaderboards are coming soon"
and nothing is sent anywhere.

## One-off setup (about 15 minutes)

1. **Create the project.** Sign up at supabase.com, then New project.
   - Name: `movage`
   - Region: **West EU (London)**, so data stays in the UK
   - Database password: let Supabase generate one and keep it in your password manager. The app never needs it.
2. **Create the tables.** In the project, open SQL Editor, New query, paste the whole of
   `supabase/schema.sql` and press Run. It should finish with "Success. No rows returned".
   It is safe to run again after an update.
3. **Turn on email codes.**
   - Authentication > Sign In / Providers > Email: enabled, "Confirm email" on.
   - Authentication > Email Templates: in both **Confirm signup** and **Magic Link**, replace the body with:

     ```html
     <h2>Your Movage code</h2>
     <p>Enter this code in the app to sign in:</p>
     <p style="font-size:28px;font-weight:700;letter-spacing:4px">{{ .Token }}</p>
     <p>If you didn't ask for this, you can ignore this email.</p>
     ```

     Subject: `Your Movage code`
4. **Set the app address.** Authentication > URL Configuration > Site URL:
   `https://fuzioneer.github.io/signal-mobility/`
5. **Connect the app.** Project Settings > API keys: copy the **Project URL** and the
   **publishable** key (older projects call it the **anon public** key). Put them in `cloud-config.js`.
   Both are designed to be public; the security rules in `schema.sql` decide what anyone can do.
   Never put the **secret** or **service_role** key in the app.

## Before launch

- **Email sending.** Supabase's built-in email is rate limited (a few emails an hour) and meant for
  testing. Before inviting people, add your own SMTP provider under Authentication > Emails > SMTP
  (for example Resend or Postmark, sending from an address on movage.co.uk).
- **Privacy policy.** Say that nickname, email (for sign-in only), session length and date, and the
  latest mobility score are stored in the UK on Supabase, that sharing is opt-in, and that people can
  delete their account in the app.
- **Sign in with Apple** for the App Store build: Authentication > Sign In / Providers > Apple.

## What is stored

| Table | Contents |
| --- | --- |
| profiles | nickname, share time on/off, share score on/off |
| communities | name, 6-character invite code, owner |
| memberships | who is in which community |
| sessions | session id, the person's local date, length in seconds (guided player only) |
| scores | latest overall score, zone scores, camera-verified flag, test date |

Emails live in Supabase's own sign-in system and are never returned to the app or shown to anyone.

## Fair play

- Only sessions from the guided player are sent; each is 30 seconds to 2 hours, dated within the
  last 35 days, and one person can log at most 4 hours a day.
- A score is "camera verified" only if every result in it was measured with the camera. Results typed
  in by hand, or edited after a camera reading, remove the tick.
- Everything is checked by the database, so a modified app can't read other people's rows or post
  for someone else.
