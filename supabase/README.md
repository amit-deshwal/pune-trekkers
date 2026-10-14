# Set up Supabase for Pune Trekkers

The site works without Supabase (it falls back to `data/community.json`). Supabase adds a private admin page at `/admin` for adding treks and photos without a deploy.

1. **Create a project** at supabase.com → New project. Pick the Mumbai (`ap-south-1`) region.
2. **Run the migration.** Dashboard → SQL Editor → paste `supabase/migrations/20261014_admin_content.sql` → Run. It creates the private `trip-uploads` bucket, the admin allow-list, and the raw/public content tables with row-level security.
3. **Create the admin account.** Authentication → Users → Add user (email + password, tick "Auto confirm"). Copy that user's UUID, then in the SQL Editor run:
   ```sql
   insert into public.admin_users (user_id) values ('PASTE_USER_UUID_HERE');
   ```
4. **Copy your keys.** Project Settings → API. Put them in `.env.local` (copy `.env.example`):
   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
   ```
   The service-role key is server-only. Never prefix it with `NEXT_PUBLIC_` or commit it.
5. **Seed the content:** `npm run seed`. This publishes `data/community.json` so the site is not empty before your first admin save.
6. **Run it:** `npm run dev`, open `/admin`, sign in, add a trek.
7. **Production:** add the same three variables in Vercel → Project → Settings → Environment Variables, then redeploy.

Notes
- Photos stay in the private bucket and are served through `/api/media/...` only when the consent box was ticked.
- A trek shows as confirmed only when "organizer confirmed" and "date verified" are both checked.
- `next.config.js` now reads the Supabase hostname from your env, so no hard-coded project ID is needed.
