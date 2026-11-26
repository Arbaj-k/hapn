-- Route chat reports into the central inbox while preserving private-chat confidentiality.
begin;
alter table public.hapn_inbox drop constraint if exists hapn_inbox_source_type_check;
alter table public.hapn_inbox add constraint hapn_inbox_source_type_check check (source_type in ('message','event_report','campus_post_report','chat_report','private_chat_report'));
drop policy if exists chat_private_participant_read on public.chat_private_conversations;
create policy chat_private_participant_read on public.chat_private_conversations for select to authenticated using ((select auth.uid())=user_a or (select auth.uid())=user_b);
drop policy if exists chat_private_messages_participant_read on public.chat_private_messages;
create policy chat_private_messages_participant_read on public.chat_private_messages for select to authenticated using (deleted_at is null and exists(select 1 from public.chat_private_conversations c where c.id=chat_private_messages.conversation_id and ((select auth.uid())=c.user_a or (select auth.uid())=c.user_b)));
drop policy if exists chat_private_messages_admin_update on public.chat_private_messages;
drop policy if exists chat_private_reports_admin_update on public.chat_private_reports;
drop policy if exists chat_private_reports_own_or_admin_read on public.chat_private_reports;
create policy chat_private_reports_own_read on public.chat_private_reports for select to authenticated using (reporter_id=(select auth.uid()));
drop policy if exists "Admins review chat reports" on public.chat_reports;
drop policy if exists "Admins update chat reports" on public.chat_reports;
create or replace function public.route_chat_report_to_hapn_inbox() returns trigger language plpgsql security definer set search_path='' as $$
declare v_body text; v_nickname text; v_room text; v_college uuid; v_message text; v_source text; v_label text;
begin
 select cm.college_id into v_college from public.campus_members cm where cm.user_id=new.reporter_id limit 1;
 if tg_table_name='chat_reports' then
  select m.body,m.nickname,m.room_id into v_body,v_nickname,v_room from public.chat_messages m where m.id=new.message_id;
  if not found then return new; end if; v_source:='chat_report'; v_label:='Group chat · '||coalesce(v_room,'Campus room');
 elsif tg_table_name='chat_private_reports' then
  select m.body,m.nickname into v_body,v_nickname from public.chat_private_messages m where m.id=new.message_id;
  if not found then return new; end if; v_source:='private_chat_report'; v_label:='Private chat · reported message only';
 else return new; end if;
 v_message:='Report reason: '||coalesce(new.reason,'unspecified')||E'\nReported sender: '||coalesce(v_nickname,'Student')||E'\nReported message: '||left(coalesce(v_body,'[message unavailable]'),3000)||case when coalesce(new.details,'')<>'' then E'\nReporter details: '||left(new.details,500) else '' end;
 insert into public.hapn_inbox(college_id,user_id,first_name,last_name,email,phone,message,source_type,source_id,source_label) values(v_college,new.reporter_id,'Chat','Report','chat-report@hapn.info',null,left(v_message,5000),v_source,new.id,v_label);
 return new;
end; $$;
revoke all on function public.route_chat_report_to_hapn_inbox() from public,anon,authenticated;
create or replace function public.route_campus_post_report_to_hapn_inbox() returns trigger language plpgsql security definer set search_path='' as $$
declare v_first text; v_last text; v_name text; v_email text; v_body text;
begin
 select cm.full_name,cm.email into v_name,v_email from public.campus_members cm where cm.user_id=new.reporter_id limit 1;
 select p.body into v_body from public.campus_posts p where p.id=new.post_id;
 v_first:=split_part(coalesce(nullif(trim(v_name),''),'Campus Member'),' ',1);
 v_last:=nullif(trim(substr(coalesce(v_name,'Campus Member'),length(v_first)+1)),'');
 insert into public.hapn_inbox(college_id,user_id,first_name,last_name,email,message,source_type,source_id,source_label) values(new.college_id,new.reporter_id,v_first,coalesce(v_last,'Member'),coalesce(v_email,'no-reply@hapn.info'),'Campus Board post report: '||new.reason||case when coalesce(v_body,'')<>'' then E'\n\nReported post: '||left(v_body,2500) else '' end,'campus_post_report',new.post_id,'Share N Care post');
 return new;
end; $$;
revoke all on function public.route_campus_post_report_to_hapn_inbox() from public,anon,authenticated;
drop trigger if exists campus_post_report_to_hapn_inbox on public.campus_post_reports;
create trigger campus_post_report_to_hapn_inbox after insert on public.campus_post_reports for each row execute function public.route_campus_post_report_to_hapn_inbox();
drop trigger if exists route_group_chat_report_to_hapn_inbox on public.chat_reports;
create trigger route_group_chat_report_to_hapn_inbox after insert on public.chat_reports for each row execute function public.route_chat_report_to_hapn_inbox();
drop trigger if exists route_private_chat_report_to_hapn_inbox on public.chat_private_reports;
create trigger route_private_chat_report_to_hapn_inbox after insert on public.chat_private_reports for each row execute function public.route_chat_report_to_hapn_inbox();
create or replace function public.sync_hapn_inbox_chat_report_status() returns trigger language plpgsql security definer set search_path='' as $$
declare v_status text;
begin
 if new.status is not distinct from old.status or new.source_type not in ('chat_report','private_chat_report') or new.source_id is null then return new; end if;
 v_status:=case when new.status='new' then 'pending' when new.status='resolved' then 'dismissed' else 'reviewed' end;
 if new.source_type='chat_report' then update public.chat_reports set status=v_status where id=new.source_id; else update public.chat_private_reports set status=v_status where id=new.source_id; end if;
 return new;
end; $$;
revoke all on function public.sync_hapn_inbox_chat_report_status() from public,anon,authenticated;
drop trigger if exists hapn_inbox_sync_chat_report_status on public.hapn_inbox;
create trigger hapn_inbox_sync_chat_report_status after update of status on public.hapn_inbox for each row execute function public.sync_hapn_inbox_chat_report_status();
notify pgrst,'reload schema';
commit;