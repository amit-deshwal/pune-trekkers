# Set up Supabase for Pune Trekkers

The site works without Supabase (it falls back to `data/community.json`). Supabase adds a private admin page at `/admin` for adding treks and photos without a deploy.

1. **Create a project** at supabase.com → New project. Pick the Mumbai (`ap-south-1`) region.
2. **Run the migrations in order.** Dashboard → SQL Editor → run `supabase/migrations/20261014_admin_content.sql`, then `supabase/migrations/20261015_gallery_video.sql`. They create the private `trip-uploads` bucket, allow video uploads, and set up the admin allow-list and content tables.
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
6. **Run it:** `npm run dev`, open `/admin` to add a trek or `/admin/gallery` to create and edit past-trip galleries. The gallery date is optional; approved admins can upload photos and videos.
7. **Production:** add the same three variables in Vercel → Project → Settings → Environment Variables, then redeploy.

Notes
- Photos and videos stay in the private bucket and are served through `/api/media/...` when an admin adds them to published site content. Gallery photos are limited to 10 MB each; videos to 50 MB each.
- A trek shows as confirmed only when "organizer confirmed" and "date verified" are both checked.
- `next.config.js` now reads the Supabase hostname from your env, so no hard-coded project ID is needed.
