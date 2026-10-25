-- Public bucket for the resized WebP copies of uploaded photos (served from /photos/). Originals stay in the private
-- trip-uploads bucket. Only the server writes here, with the service role, so no storage policies are needed.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('trip-photos','trip-photos',true,2097152,array['image/webp'])
on conflict (id) do update set public=true,file_size_limit=2097152,allowed_mime_types=array['image/webp'];
