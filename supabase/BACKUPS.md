# Movage backups to Google Drive

The workflow `.github/workflows/backup-to-drive.yml` runs every Monday at 03:17 UTC (and on demand from
**Actions > Backup to Google Drive > Run workflow**). Each run creates a dated folder in
**My Drive / Movage Backups** containing:

- `movage-site-YYYY-MM-DD.zip`: the app/site source at that point
- `movage-db-YYYY-MM-DD.tar.gz.gpg`: the Supabase database (roles, schema, data), encrypted with AES-256

Backups older than 120 days are moved to the Drive trash automatically.

The repo is public, so the database dump is always encrypted before upload and never stored on GitHub.

## One-time setup (about 10 minutes)

Add three secrets in GitHub: **repo Settings > Secrets and variables > Actions > New repository secret**.

### 1. `SUPABASE_DB_URL`
In Supabase, open the **movage** project, click **Connect**, choose **Session pooler**, copy the URI and
put your database password in place of `[YOUR-PASSWORD]`. It looks like:

    postgresql://postgres.atmoejivzryboipwvwdv:PASSWORD@aws-0-eu-west-2.pooler.supabase.com:5432/postgres

Use the Session pooler, not the Direct connection: the direct host is IPv6 only and GitHub runners
cannot reach it.

### 2. `BACKUP_PASSPHRASE`
A long random passphrase, for example from `openssl rand -base64 32`. **Save it in your password
manager too.** Without it the database backups cannot be opened.

### 3. `RCLONE_CONFIG`
On your Mac:

    brew install rclone
    rclone config

- `n` for new remote, name it **gdrive**
- Storage type: **drive** (Google Drive)
- client_id / client_secret: leave blank
- scope: **2** (`drive.file`, so rclone can only see files it created itself)
- Leave the rest as default, say **y** to auto config, sign in with your Google account in the browser
- Not a shared drive: **n**, then confirm and quit

Then print the config and paste the whole output (including the `[gdrive]` line) into the secret:

    rclone config show gdrive

### 4. Test it
Actions tab > **Backup to Google Drive** > **Run workflow**. A green tick and a new folder in
Drive means it works.

## Restoring

    gpg -d movage-db-YYYY-MM-DD.tar.gz.gpg > db.tar.gz && tar -xzf db.tar.gz
    # into a fresh Supabase project (use its Session pooler URL):
    psql "$NEW_DB_URL" -f db/roles.sql -f db/schema.sql -c 'SET session_replication_role = replica' -f db/data.sql

Edge functions are in `supabase/functions` inside the site zip; redeploy them with
`supabase functions deploy`. Edge function secrets (SMTP2GO etc.) are not in the backup, so keep those
in your password manager.
