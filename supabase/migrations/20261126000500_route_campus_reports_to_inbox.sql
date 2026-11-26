-- Route every new Share N Care report into the unified Hapn moderation inbox.
begin;
create or replace function public.route_campus_post_report_to_hapn_inbox()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_first text; v_last text; v_name text; v_email text; v_body text;
begin
 select cm.full_name,cm.email into v_name,v_email from public.campus_members cm where cm.user_id=new.reporter_id limit 1;
 select p.body into v_body from public.campus_posts p where p.id=new.post_id;
 v_first:=split_part(coalesce(nullif(trim(v_name),''),'Campus Member'),' ',1);
 v_last:=nullif(trim(substr(coalesce(v_name,'Campus Member'),length(v_first)+1)),'');
 insert into public.hapn_inbox(college_id,user_id,first_name,last_name,email,message,source_type,source_id,source_label)
 values(new.college_id,new.reporter_id,v_first,coalesce(v_last,'Member'),coalesce(v_email,'no-reply@hapn.info'),
 'Campus Board post report: '||new.reason||case when coalesce(v_body,'')<>'' then E'\n\nReported post: '||left(v_body,2500) else '' end,
 'campus_post_report',new.post_id,'Share N Care post');
 return new;
end $$;
drop trigger if exists campus_post_report_to_hapn_inbox on public.campus_post_reports;
create trigger campus_post_report_to_hapn_inbox after insert on public.campus_post_reports
for each row execute function public.route_campus_post_report_to_hapn_inbox();
commit;