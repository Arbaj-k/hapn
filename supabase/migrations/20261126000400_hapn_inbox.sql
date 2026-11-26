-- Hapn Inbox: public contact submissions with college-scoped moderation.
begin;
create table if not exists public.hapn_inbox (
 id uuid primary key default gen_random_uuid(),
 college_id uuid references public.colleges(id) on delete set null,
 user_id uuid references auth.users(id) on delete set null,
 first_name text not null check (char_length(trim(first_name)) between 1 and 60),
 last_name text not null check (char_length(trim(last_name)) between 1 and 60),
 email text not null check (char_length(email) between 5 and 254),
 phone text check (phone is null or char_length(phone) <= 24),
 message text not null check (char_length(trim(message)) between 5 and 5000),
 source_type text not null default 'message' check (source_type in ('message','event_report','campus_post_report')),
 source_id uuid,
 source_label text,
 status text not null default 'new' check (status in ('new','in_review','replied','resolved')),
 admin_reply text check (admin_reply is null or char_length(admin_reply) <= 5000),
 replied_by uuid references auth.users(id) on delete set null,
 replied_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists hapn_inbox_college_created_idx on public.hapn_inbox(college_id,created_at desc);
create index if not exists hapn_inbox_status_created_idx on public.hapn_inbox(status,created_at desc);
alter table public.hapn_inbox enable row level security;
revoke all on public.hapn_inbox from anon, authenticated;
grant select,update on public.hapn_inbox to authenticated;
drop policy if exists "Hapn admins read routed inbox" on public.hapn_inbox;
create policy "Hapn admins read routed inbox" on public.hapn_inbox for select to authenticated
using (public.is_super_admin() or (public.is_college_admin() and college_id=public.current_college_id()));
drop policy if exists "Hapn admins update routed inbox" on public.hapn_inbox;
create policy "Hapn admins update routed inbox" on public.hapn_inbox for update to authenticated
using (public.is_super_admin() or (public.is_college_admin() and college_id=public.current_college_id()))
with check (public.is_super_admin() or (public.is_college_admin() and college_id=public.current_college_id()));
create or replace function public.submit_hapn_inbox(
 p_college_id uuid,p_first_name text,p_last_name text,p_email text,p_phone text,p_message text,
 p_source_type text default 'message',p_source_id uuid default null,p_source_label text default null
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_uid uuid := auth.uid(); v_college uuid := p_college_id;
begin
 if length(trim(coalesce(p_first_name,''))) not between 1 and 60 then raise exception 'Enter your first name.'; end if;
 if length(trim(coalesce(p_last_name,''))) not between 1 and 60 then raise exception 'Enter your last name.'; end if;
 if length(trim(coalesce(p_email,''))) not between 5 and 254 or trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$' then raise exception 'Enter a valid email address.'; end if;
 if coalesce(p_phone,'')<>'' and p_phone !~ '^\\+?[0-9][0-9 -]{6,20}$' then raise exception 'Enter a valid phone number.'; end if;
 if length(trim(coalesce(p_message,''))) not between 5 and 5000 then raise exception 'Message must contain 5 to 5000 characters.'; end if;
 if p_source_type not in ('message','event_report','campus_post_report') then raise exception 'Invalid message type.'; end if;
 if v_college is not null and not exists(select 1 from public.colleges c where c.id=v_college and c.is_active) then raise exception 'Choose an active college.'; end if;
 if v_uid is not null and v_college is null then select cm.college_id into v_college from public.campus_members cm where cm.user_id=v_uid limit 1; end if;
 insert into public.hapn_inbox(college_id,user_id,first_name,last_name,email,phone,message,source_type,source_id,source_label)
 values(v_college,v_uid,trim(p_first_name),trim(p_last_name),lower(trim(p_email)),nullif(trim(p_phone),''),trim(p_message),p_source_type,p_source_id,nullif(trim(p_source_label),'')) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.submit_hapn_inbox(uuid,text,text,text,text,text,text,uuid,text) from public;
grant execute on function public.submit_hapn_inbox(uuid,text,text,text,text,text,text,uuid,text) to anon,authenticated;
commit;