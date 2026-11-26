-- Share N Care public preview is scoped to one selected active college.
-- Anonymous users can discover active college names and read only that college's posts.
drop function if exists public.get_public_campus_board_posts();

create or replace function public.get_public_campus_board_colleges()
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = ''
as $function$
  select c.id, c.name
  from public.colleges c
  where c.is_active = true
  order by c.name;
$function$;

revoke all on function public.get_public_campus_board_colleges() from public, authenticated;
grant execute on function public.get_public_campus_board_colleges() to anon;

create or replace function public.get_public_campus_board_posts(p_college_id uuid)
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
  where p.college_id = p_college_id
    and p.status = 'active'
    and (p.expires_at is null or p.expires_at > pg_catalog.now())
  order by p.created_at desc
  limit 100;
$function$;

revoke all on function public.get_public_campus_board_posts(uuid) from public, authenticated;
grant execute on function public.get_public_campus_board_posts(uuid) to anon;
