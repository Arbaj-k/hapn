-- Public, read-only Campus Board preview.
-- Anonymous visitors can read only global, active, non-expired posts.
-- Private fields and all write actions remain unavailable to anon.
create or replace function public.get_public_campus_board_posts()
returns table (
  id uuid,
  display_name text,
  academic_year text,
  post_type text,
  custom_type text,
  body text,
  image_url text,
  status text,
  expires_at timestamptz,
  created_at timestamptz,
  college_name text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select p.id, p.display_name, p.academic_year, p.post_type, p.custom_type,
         p.body, p.image_url, p.status, p.expires_at, p.created_at, c.name
  from public.campus_posts p
  join public.colleges c on c.id = p.college_id and c.is_active = true
  where p.visibility = 'all'
    and p.status = 'active'
    and (p.expires_at is null or p.expires_at > pg_catalog.now())
  order by p.created_at desc
  limit 100;
$function$;

revoke all on function public.get_public_campus_board_posts() from public, authenticated;
grant execute on function public.get_public_campus_board_posts() to anon;
