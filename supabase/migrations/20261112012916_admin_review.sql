-- Who reviewed a report, and the actions an admin uses. A normal user cannot call them.

alter table public.reports
  add column reviewed_by uuid references public.profiles (id) on delete set null,
  add column reviewed_at timestamptz,
  add constraint reports_admin_notes_length
    check (admin_notes is null or char_length(admin_notes) <= 2000);

-- reviewed_by and reviewed_at are review fields, same as status and the note.
create or replace function private.guard_report_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not private.is_admin() then
    if new.reporter_id is distinct from old.reporter_id
       or new.status is distinct from old.status
       or new.admin_notes is distinct from old.admin_notes
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at
    then
      raise exception 'only an admin can change review fields';
    end if;
  end if;
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

-- Pending and needs-info reports, oldest first. Hidden columns included.
create function private.admin_review_queue()
returns table (
  id uuid,
  description text,
  amount_lost numeric,
  status public.report_status,
  occurred_on date,
  admin_notes text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'admin only';
  end if;

  return query
  select
    r.id,
    r.description,
    r.amount_lost,
    r.status,
    r.occurred_on,
    r.admin_notes,
    r.created_at
  from public.reports r
  where r.status in ('pending'::public.report_status, 'needs_info'::public.report_status)
  order by r.created_at asc, r.id asc;
end;
$$;

create function public.admin_review_queue()
returns table (
  id uuid,
  description text,
  amount_lost numeric,
  status public.report_status,
  occurred_on date,
  admin_notes text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.admin_review_queue();
$$;

-- One report for the review screen, including who filed it and who reviewed it.
create function private.admin_report_detail(target uuid)
returns table (
  id uuid,
  reporter_id uuid,
  description text,
  amount_lost numeric,
  status public.report_status,
  occurred_on date,
  admin_notes text,
  created_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  other_report_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'admin only';
  end if;

  return query
  select
    r.id,
    r.reporter_id,
    r.description,
    r.amount_lost,
    r.status,
    r.occurred_on,
    r.admin_notes,
    r.created_at,
    r.reviewed_by,
    r.reviewed_at,
    (
      select count(*)::integer
      from public.reports other
      where other.reporter_id = r.reporter_id
        and other.id <> r.id
    ) as other_report_count
  from public.reports r
  where r.id = target;
end;
$$;

create function public.admin_report_detail(target uuid)
returns table (
  id uuid,
  reporter_id uuid,
  description text,
  amount_lost numeric,
  status public.report_status,
  occurred_on date,
  admin_notes text,
  created_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  other_report_count integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.admin_report_detail(target);
$$;

-- Approve, reject, ask for more information, or unpublish.
-- The note is what the reporter sees. Unpublish sets an approved report back to rejected.
create function private.review_report(target uuid, decision text, review_note text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_status public.report_status;
  next_status public.report_status;
  trimmed text := pg_catalog.btrim(review_note);
begin
  if (select auth.uid()) is null or not private.is_admin() then
    raise exception 'admin only';
  end if;
  if trimmed is null or trimmed = '' or pg_catalog.char_length(trimmed) > 2000 then
    raise exception 'note required';
  end if;

  select r.status into current_status
  from public.reports r
  where r.id = target
  for update;

  if not found then
    raise exception 'report not found';
  end if;

  if decision = 'approve' then
    next_status := 'approved';
  elsif decision = 'reject' then
    next_status := 'rejected';
  elsif decision = 'needs_info' then
    next_status := 'needs_info';
  elsif decision = 'unpublish' then
    next_status := 'rejected';
  else
    raise exception 'unknown decision';
  end if;

  if decision = 'unpublish' then
    if current_status <> 'approved' then
      raise exception 'report is not approved';
    end if;
  elsif current_status not in ('pending'::public.report_status, 'needs_info'::public.report_status) then
    raise exception 'report is not awaiting review';
  end if;

  update public.reports
  set
    status = next_status,
    admin_notes = trimmed,
    reviewed_by = (select auth.uid()),
    reviewed_at = pg_catalog.now()
  where id = target;
end;
$$;

create function public.review_report(target uuid, decision text, review_note text)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  perform private.review_report(target, decision, review_note);
end;
$$;

revoke all on function private.admin_review_queue() from public;
revoke all on function private.admin_report_detail(uuid) from public;
revoke all on function private.review_report(uuid, text, text) from public;
revoke all on function public.admin_review_queue() from public;
revoke all on function public.admin_report_detail(uuid) from public;
revoke all on function public.review_report(uuid, text, text) from public;

grant execute on function private.admin_review_queue() to authenticated, service_role;
grant execute on function private.admin_report_detail(uuid) to authenticated, service_role;
grant execute on function private.review_report(uuid, text, text) to authenticated, service_role;
grant execute on function public.admin_review_queue() to authenticated, service_role;
grant execute on function public.admin_report_detail(uuid) to authenticated, service_role;
grant execute on function public.review_report(uuid, text, text) to authenticated, service_role;
