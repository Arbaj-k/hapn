-- Event audience scope: college-only (default) or visible across Hapn.
-- Existing events remain college-only so their current audience does not unexpectedly expand.
alter table public.events
  add column if not exists visibility_scope text not null default 'college';

alter table public.events
  drop constraint if exists events_visibility_scope_check;

alter table public.events
  add constraint events_visibility_scope_check
  check (visibility_scope in ('college', 'all'));

create index if not exists events_visibility_scope_college_idx
  on public.events (visibility_scope, college_id, "date");
