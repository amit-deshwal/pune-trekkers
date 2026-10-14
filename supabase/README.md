# Set up the Pune Trekkers admin

1. Create a Supabase project and, in **Authentication → Providers**, keep email/password enabled. Create the first administrator account through the Auth dashboard or the temporary admin sign-in page.
2. Run `migrations/20261014_admin_content.sql` in the Supabase SQL editor. It creates the private upload bucket, admin allow-list, raw content table, and public-only content table.
3. In the SQL editor, add the Auth user to the allow-list:

```sql
insert into public.admin_users (user_id) values ('AUTH_USER_UUID_HERE');
```

4. Set the following values in the hosting environment and local `.env.local` file. The service-role key is server-only: do not prefix it with `NEXT_PUBLIC_` and never paste it into the browser.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

5. Visit `/admin`, sign in with the allowed account, add a trip and optional images. A photo remains in the private bucket until the website-consent checkbox is checked. A trek is shown as confirmed only when both organizer confirmation and date verification are checked.

The public website reads `public_site_content`, not the raw admin draft. The `/api/media/...` endpoint only creates a short-lived image URL after confirming the path appears in that published record.
