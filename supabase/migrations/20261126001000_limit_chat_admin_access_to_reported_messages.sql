-- Keep chat histories private. Moderation uses the reported message snapshot in Hapn Inbox.
begin;
drop policy if exists "Admins moderate chat messages" on public.chat_messages;
drop policy if exists chat_admin_read_messages on public.chat_messages;
notify pgrst,'reload schema';
commit;