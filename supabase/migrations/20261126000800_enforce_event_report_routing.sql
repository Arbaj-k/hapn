-- Restrict public submissions to contact/event reports and derive event report routing from the event row.
create or replace function public.submit_hapn_inbox(
 p_college_id uuid,p_first_name text,p_last_name text,p_email text,p_phone text,p_message text,
 p_source_type text default 'message',p_source_id uuid default null,p_source_label text default null
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_uid uuid := auth.uid(); v_college uuid := p_college_id; v_recent integer; v_event_college uuid; v_event_title text;
begin
 if length(trim(coalesce(p_first_name,''))) not between 1 and 60 then raise exception 'Enter your first name.'; end if;
 if length(trim(coalesce(p_last_name,''))) not between 1 and 60 then raise exception 'Enter your last name.'; end if;
 if length(trim(coalesce(p_email,''))) not between 5 and 254 or trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$' then raise exception 'Enter a valid email address.'; end if;
 if coalesce(p_phone,'')<>'' and p_phone !~ '^[+]?[0-9][0-9 -]{6,20}$' then raise exception 'Enter a valid phone number.'; end if;
 if length(trim(coalesce(p_message,''))) not between 5 and 5000 then raise exception 'Message must contain 5 to 5000 characters.'; end if;
 if p_source_type not in ('message','event_report') then raise exception 'Invalid message type.'; end if;
 if p_source_type='event_report' then
   if p_source_id is null then raise exception 'The event could not be identified.'; end if;
   select e.college_id,e.title into v_event_college,v_event_title from public.events e where e.id=p_source_id;
   if not found then raise exception 'The event could not be found.'; end if;
   if p_college_id is not null and p_college_id is distinct from v_event_college then raise exception 'Event college does not match.'; end if;
   v_college:=v_event_college;
 end if;
 if v_college is not null and not exists(select 1 from public.colleges c where c.id=v_college and c.is_active) then raise exception 'Choose an active college.'; end if;
 select count(*) into v_recent from public.hapn_inbox i where lower(i.email)=lower(trim(p_email)) and i.created_at>pg_catalog.now()-interval '1 hour';
 if v_recent>=5 then raise exception 'Too many messages from this email. Please try again later.'; end if;
 if v_uid is not null and v_college is null then select cm.college_id into v_college from public.campus_members cm where cm.user_id=v_uid limit 1; end if;
 insert into public.hapn_inbox(college_id,user_id,first_name,last_name,email,phone,message,source_type,source_id,source_label)
 values(v_college,v_uid,trim(p_first_name),trim(p_last_name),lower(trim(p_email)),nullif(trim(p_phone),''),trim(p_message),p_source_type,p_source_id,coalesce(nullif(trim(p_source_label),''),v_event_title)) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.submit_hapn_inbox(uuid,text,text,text,text,text,text,uuid,text) from public;
grant execute on function public.submit_hapn_inbox(uuid,text,text,text,text,text,text,uuid,text) to anon,authenticated;