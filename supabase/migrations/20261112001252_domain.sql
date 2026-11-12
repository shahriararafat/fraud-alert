-- Domain tables for reports, the things being reported, evidence, and appeals.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create type public.entity_kind as enum ('phone', 'shop_name', 'url', 'social');
create type public.report_status as enum ('pending', 'approved', 'rejected', 'needs_info');
create type public.appeal_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table public.scam_entities (
  id uuid primary key default gen_random_uuid(),
  kind public.entity_kind not null,
  value text not null,
  created_at timestamptz not null default now(),
  constraint scam_entities_value_present check (char_length(btrim(value)) > 0),
  constraint scam_entities_phone_shape check (
    kind <> 'phone' or value ~ '^01[3-9][0-9]{8}$'
  ),
  constraint scam_entities_kind_value_key unique (kind, value)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete restrict,
  description text not null,
  amount_lost numeric(12, 2),
  status public.report_status not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_description_present check (char_length(btrim(description)) > 0),
  constraint reports_amount_nonnegative check (amount_lost is null or amount_lost >= 0)
);

create table public.report_entities (
  report_id uuid not null references public.reports (id) on delete cascade,
  entity_id uuid not null references public.scam_entities (id) on delete cascade,
  primary key (report_id, entity_id)
);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.scam_entities (id) on delete cascade,
  appellant_id uuid not null references public.profiles (id) on delete restrict,
  reason text not null,
  status public.appeal_status not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appeals_reason_present check (char_length(btrim(reason)) > 0)
);

create table public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports (id) on delete cascade,
  appeal_id uuid references public.appeals (id) on delete cascade,
  storage_path text not null,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint evidence_one_parent check (
    (report_id is not null and appeal_id is null)
    or (report_id is null and appeal_id is not null)
  ),
  constraint evidence_own_folder check (
    storage_path like uploaded_by::text || '/%'
    and storage_path not like '%..%'
  )
);

create index reports_reporter_id_idx on public.reports (reporter_id);
create index reports_status_idx on public.reports (status);
create index report_entities_entity_id_idx on public.report_entities (entity_id);
create index appeals_entity_id_idx on public.appeals (entity_id);

-- Approved-report count only. Severity labels live in lib/severity.ts.
create view public.entity_approved_counts
with (security_invoker = true) as
select
  e.id as entity_id,
  e.kind,
  e.value,
  count(r.id)::integer as approved_report_count
from public.scam_entities e
join public.report_entities re on re.entity_id = e.id
join public.reports r on r.id = re.report_id and r.status = 'approved'
group by e.id, e.kind, e.value;

-- Helpers. security definer functions stay in private so the Data API cannot call them.

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create function private.report_visible(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.reports
    where id = target
      and (
        status = 'approved'
        or reporter_id = (select auth.uid())
        or (select private.is_admin())
      )
  );
$$;

create function private.owns_report(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.reports
    where id = target
      and reporter_id = (select auth.uid())
  );
$$;

create function private.owns_open_report(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.reports
    where id = target
      and reporter_id = (select auth.uid())
      and status in ('pending', 'needs_info')
  );
$$;

create function private.owns_appeal(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.appeals
    where id = target
      and appellant_id = (select auth.uid())
  );
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not private.is_admin()
  then
    raise exception 'only an admin can change role';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function private.guard_profile_role();

create function private.guard_report_update()
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
    then
      raise exception 'only an admin can change review fields';
    end if;
  end if;
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create trigger reports_guard_update
  before update on public.reports
  for each row execute function private.guard_report_update();

create function private.guard_appeal_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not private.is_admin() then
    if new.entity_id is distinct from old.entity_id
       or new.appellant_id is distinct from old.appellant_id
       or new.status is distinct from old.status
       or new.admin_notes is distinct from old.admin_notes
    then
      raise exception 'only an admin can change review fields';
    end if;
  end if;
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create trigger appeals_guard_update
  before update on public.appeals
  for each row execute function private.guard_appeal_update();

-- Find or create the thing being reported. Callers must already have normalized phones.
create function private.upsert_entity(entity_kind public.entity_kind, entity_value text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := btrim(entity_value);
  found uuid;
begin
  if auth.uid() is null then
    raise exception 'sign in required';
  end if;
  if normalized = '' then
    raise exception 'value required';
  end if;
  if entity_kind = 'phone' and normalized !~ '^01[3-9][0-9]{8}$' then
    raise exception 'phone must be normalized to 01XXXXXXXXX';
  end if;

  insert into public.scam_entities (kind, value)
  values (entity_kind, normalized)
  on conflict (kind, value) do nothing;

  select id into found
  from public.scam_entities
  where kind = entity_kind and value = normalized;

  return found;
end;
$$;

create function public.upsert_entity(entity_kind public.entity_kind, entity_value text)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.upsert_entity(entity_kind, entity_value);
$$;

-- Reporter id and admin notes are not readable as columns. Owner and admin use this.
create function private.report_private(target uuid)
returns table (reporter_id uuid, admin_notes text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.reporter_id, r.admin_notes
  from public.reports r
  where r.id = target
    and (
      r.reporter_id = (select auth.uid())
      or (select private.is_admin())
    );
$$;

create function public.report_private(target uuid)
returns table (reporter_id uuid, admin_notes text)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.report_private(target);
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.report_visible(uuid) from public;
revoke all on function private.owns_report(uuid) from public;
revoke all on function private.owns_open_report(uuid) from public;
revoke all on function private.owns_appeal(uuid) from public;
revoke all on function private.handle_new_user() from public;
revoke all on function private.guard_profile_role() from public;
revoke all on function private.guard_report_update() from public;
revoke all on function private.guard_appeal_update() from public;
revoke all on function private.upsert_entity(public.entity_kind, text) from public;
revoke all on function private.report_private(uuid) from public;
revoke all on function public.upsert_entity(public.entity_kind, text) from public;
revoke all on function public.report_private(uuid) from public;

grant execute on function private.is_admin() to anon, authenticated, service_role;
grant execute on function private.report_visible(uuid) to anon, authenticated, service_role;
grant execute on function private.owns_report(uuid) to authenticated, service_role;
grant execute on function private.owns_open_report(uuid) to authenticated, service_role;
grant execute on function private.owns_appeal(uuid) to authenticated, service_role;
grant execute on function private.handle_new_user() to supabase_auth_admin, service_role;
grant execute on function private.guard_profile_role() to authenticated, service_role;
grant execute on function private.guard_report_update() to authenticated, service_role;
grant execute on function private.guard_appeal_update() to authenticated, service_role;
grant execute on function private.upsert_entity(public.entity_kind, text) to authenticated, service_role;
grant execute on function private.report_private(uuid) to authenticated, service_role;
grant usage on schema private to supabase_auth_admin;

grant execute on function public.upsert_entity(public.entity_kind, text) to authenticated, service_role;
grant execute on function public.report_private(uuid) to authenticated, service_role;

grant usage on type public.entity_kind to anon, authenticated, service_role;
grant usage on type public.report_status to anon, authenticated, service_role;
grant usage on type public.appeal_status to anon, authenticated, service_role;

-- Grants. Default privileges hand everything to anon and authenticated; take that back.

revoke all on public.profiles from anon, authenticated;
revoke all on public.scam_entities from anon, authenticated;
revoke all on public.reports from anon, authenticated;
revoke all on public.report_entities from anon, authenticated;
revoke all on public.appeals from anon, authenticated;
revoke all on public.evidence_files from anon, authenticated;
revoke all on public.entity_approved_counts from anon, authenticated;

grant select (id, display_name, role, created_at) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

grant select on public.scam_entities to anon, authenticated;
grant update, delete on public.scam_entities to authenticated;

grant select (
  id, description, amount_lost, status, created_at, updated_at
) on public.reports to anon, authenticated;
grant insert (reporter_id, description, amount_lost) on public.reports to authenticated;
grant update (description, amount_lost, status, admin_notes, updated_at)
  on public.reports to authenticated;
grant delete on public.reports to authenticated;

grant select on public.report_entities to anon, authenticated;
grant insert, delete on public.report_entities to authenticated;

grant select, insert, update, delete on public.appeals to authenticated;
grant select, insert, delete on public.evidence_files to authenticated;

grant select on public.entity_approved_counts to anon, authenticated;

grant all on public.profiles to service_role;
grant all on public.scam_entities to service_role;
grant all on public.reports to service_role;
grant all on public.report_entities to service_role;
grant all on public.appeals to service_role;
grant all on public.evidence_files to service_role;
grant select on public.entity_approved_counts to service_role;

alter table public.profiles enable row level security;
alter table public.scam_entities enable row level security;
alter table public.reports enable row level security;
alter table public.report_entities enable row level security;
alter table public.appeals enable row level security;
alter table public.evidence_files enable row level security;

create policy profiles_select
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_update
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

create policy entities_select
  on public.scam_entities for select to anon, authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.report_entities re
      where re.entity_id = scam_entities.id
        and (select private.report_visible(re.report_id))
    )
  );

create policy entities_write_admin
  on public.scam_entities for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy reports_select
  on public.reports for select to anon, authenticated
  using (
    status = 'approved'
    or reporter_id = (select auth.uid())
    or (select private.is_admin())
  );

create policy reports_insert
  on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'pending'
  );

create policy reports_update_owner
  on public.reports for update to authenticated
  using (
    reporter_id = (select auth.uid())
    and status in ('pending', 'needs_info')
  )
  with check (
    reporter_id = (select auth.uid())
    and status in ('pending', 'needs_info')
  );

create policy reports_update_admin
  on public.reports for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy reports_delete_admin
  on public.reports for delete to authenticated
  using ((select private.is_admin()));

create policy report_entities_select
  on public.report_entities for select to anon, authenticated
  using (
    (select private.is_admin())
    or (select private.report_visible(report_id))
  );

create policy report_entities_insert
  on public.report_entities for insert to authenticated
  with check (
    (select private.owns_open_report(report_id))
    or (select private.is_admin())
  );

create policy report_entities_delete
  on public.report_entities for delete to authenticated
  using (
    (select private.is_admin())
    or (select private.owns_open_report(report_id))
  );

create policy appeals_select
  on public.appeals for select to authenticated
  using (
    appellant_id = (select auth.uid())
    or (select private.is_admin())
  );

create policy appeals_insert
  on public.appeals for insert to authenticated
  with check (
    appellant_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1
      from public.scam_entities e
      where e.id = entity_id
    )
  );

create policy appeals_update_admin
  on public.appeals for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy appeals_delete_admin
  on public.appeals for delete to authenticated
  using ((select private.is_admin()));

create policy evidence_select
  on public.evidence_files for select to authenticated
  using (
    uploaded_by = (select auth.uid())
    or (select private.is_admin())
  );

create policy evidence_insert
  on public.evidence_files for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and (
      (report_id is not null and (select private.owns_report(report_id)))
      or (appeal_id is not null and (select private.owns_appeal(appeal_id)))
      or (select private.is_admin())
    )
  );

create policy evidence_delete
  on public.evidence_files for delete to authenticated
  using (
    (select private.is_admin())
    or (
      uploaded_by = (select auth.uid())
      and report_id is not null
      and (select private.owns_open_report(report_id))
    )
  );

-- Private screenshot bucket. Objects live under <user id>/...

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy evidence_storage_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy evidence_storage_select
  on storage.objects for select to authenticated
  using (
    bucket_id = 'evidence'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

create policy evidence_storage_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidence'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );
