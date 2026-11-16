# Movage sign-in email templates

Supabase sends the sign-in code emails itself, so these are pasted into the dashboard rather than deployed:
Supabase > Authentication > Emails > Templates.

- **Magic Link**: paste `magic-link.html`, subject `Your Movage sign-in code`.
- **Confirm signup**: paste `confirm-signup.html`, subject `Welcome to Movage: your code`.

Both use `{{ .Token }}` (the 6-digit code) and end with the standard Movage footer:
confidentiality notice, website, Instagram and YouTube links.
