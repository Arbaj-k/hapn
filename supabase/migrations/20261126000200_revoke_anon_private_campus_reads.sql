-- Anonymous visitors only need the safe public feed RPC and public post images.
-- Remove inherited table-level SELECT grants from private Campus Board tables;
-- authenticated members continue to use their existing RLS-governed permissions.
revoke select on table
  public.campus_members,
  public.campus_member_private,
  public.campus_connect_requests,
  public.campus_notifications,
  public.campus_post_saves,
  public.campus_post_reports
from anon;
