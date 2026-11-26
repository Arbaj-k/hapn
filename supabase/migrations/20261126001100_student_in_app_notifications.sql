-- Student in-app notifications: college events, fests, Connect posts and community replies.
begin;
alter table public.campus_notifications add column if not exists target_url text, add column if not exists source_key text;
alter table public.campus_notifications drop constraint if exists campus_notifications_notification_type_check;
alter table public.campus_notifications add constraint campus_notifications_notification_type_check check(notification_type in ('request','approved','declined','info','event','fest','connect','reply'));
create unique index if not exists campus_notifications_user_source_key_uidx on public.campus_notifications(user_id,source_key) where source_key is not null;
create index if not exists campus_notifications_user_unread_created_idx on public.campus_notifications(user_id,created_at desc) where read_at is null;
create or replace function public.notify_campus_members(p_college_id uuid,p_type text,p_message text,p_target_url text,p_source_key text,p_exclude_user_id uuid default null) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_college_id is null then return; end if;
 insert into public.campus_notifications(user_id,college_id,notification_type,message,target_url,source_key)
 select m.user_id,p_college_id,p_type,left(p_message,240),p_target_url,p_source_key from public.campus_members m
 where m.college_id=p_college_id and (p_exclude_user_id is null or m.user_id<>p_exclude_user_id)
 on conflict(user_id,source_key) where source_key is not null do nothing;
end; $$;
revoke all on function public.notify_campus_members(uuid,text,text,text,text,uuid) from public,anon,authenticated;
create or replace function public.notify_published_college_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.is_published and new.college_id is not null and (tg_op='INSERT' or old.is_published is distinct from true) then
  perform public.notify_campus_members(new.college_id,'event','New event: '||coalesce(new.title,'A new campus event'),'/event/?id='||new.id::text,'event:'||new.id::text,null);
 end if; return new;
end; $$;
revoke all on function public.notify_published_college_event() from public,anon,authenticated;
drop trigger if exists notify_published_college_event on public.events;
create trigger notify_published_college_event after insert or update of is_published on public.events for each row execute function public.notify_published_college_event();
create or replace function public.notify_published_college_fest() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.is_published and new.college_id is not null and (tg_op='INSERT' or old.is_published is distinct from true) then
  perform public.notify_campus_members(new.college_id,'fest','New fest: '||coalesce(new.title,'A new campus fest'),'/fest/?id='||new.id::text,'fest:'||new.id::text,null);
 end if; return new;
end; $$;
revoke all on function public.notify_published_college_fest() from public,anon,authenticated;
drop trigger if exists notify_published_college_fest on public.fests;
create trigger notify_published_college_fest after insert or update of is_published on public.fests for each row execute function public.notify_published_college_fest();
create or replace function public.notify_new_connect_post() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='active' then perform public.notify_campus_members(new.college_id,'connect','New Connect post: '||coalesce(new.post_type,'Campus update'),'/connect/board/?post='||new.id::text,'connect-post:'||new.id::text,new.user_id); end if;
 return new;
end; $$;
revoke all on function public.notify_new_connect_post() from public,anon,authenticated;
drop trigger if exists notify_new_connect_post on public.campus_posts;
create trigger notify_new_connect_post after insert on public.campus_posts for each row execute function public.notify_new_connect_post();
create or replace function public.notify_community_post_reply() returns trigger language plpgsql security definer set search_path='' as $$
declare v_owner uuid; v_college uuid; v_title text;
begin
 select p.author_id,p.title into v_owner,v_title from public.chat_community_posts p where p.id=new.post_id and p.deleted_at is null;
 if v_owner is null or v_owner=new.author_id then return new; end if;
 select m.college_id into v_college from public.campus_members m where m.user_id=v_owner limit 1;
 if v_college is null then return new; end if;
 insert into public.campus_notifications(user_id,college_id,notification_type,message,target_url,source_key)
 values(v_owner,v_college,'reply','New reply on your community post: '||coalesce(v_title,'Your post'),'/chat/','community-reply:'||new.id::text)
 on conflict(user_id,source_key) where source_key is not null do nothing;
 return new;
end; $$;
revoke all on function public.notify_community_post_reply() from public,anon,authenticated;
drop trigger if exists notify_community_post_reply on public.chat_community_comments;
create trigger notify_community_post_reply after insert on public.chat_community_comments for each row execute function public.notify_community_post_reply();
notify pgrst,'reload schema';
commit;