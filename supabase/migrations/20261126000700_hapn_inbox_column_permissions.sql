-- Keep contact and message evidence immutable to inbox moderators.
revoke update on public.hapn_inbox from authenticated;
grant update(status,admin_reply,replied_by,replied_at,updated_at) on public.hapn_inbox to authenticated;