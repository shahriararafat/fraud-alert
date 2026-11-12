-- The day the scam happened, and a cap of 5 reports per person per Asia/Dhaka day.

alter table public.reports
  add column occurred_on date;

update public.reports
set occurred_on = (created_at at time zone 'Asia/Dhaka')::date
where occurred_on is null;

alter table public.reports
  alter column occurred_on set not null;

alter table public.reports
  add constraint reports_occurred_not_future
  check (occurred_on <= (timezone('Asia/Dhaka', now()))::date);

grant insert (occurred_on) on public.reports to authenticated;
grant select (occurred_on) on public.reports to anon, authenticated;

create function private.guard_report_daily_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.reports
    where reporter_id = new.reporter_id
      and (created_at at time zone 'Asia/Dhaka')::date
        = (pg_catalog.now() at time zone 'Asia/Dhaka')::date
  ) >= 5 then
    raise exception 'report limit reached';
  end if;
  return new;
end;
$$;

create trigger reports_daily_limit
  before insert on public.reports
  for each row execute function private.guard_report_daily_limit();

-- One write for the report, the entities it names, and the screenshot rows.
-- security invoker: the signed-in user's row policies still apply.
create function public.submit_report(
  report_description text,
  report_amount numeric,
  report_date date,
  entities jsonb,
  evidence_paths text[]
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  created_id uuid;
  item jsonb;
  linked_id uuid;
  path text;
  i integer;
begin
  if (select auth.uid()) is null then
    raise exception 'sign in required';
  end if;
  if entities is null
     or pg_catalog.jsonb_typeof(entities) <> 'array'
     or pg_catalog.jsonb_array_length(entities) = 0
  then
    raise exception 'identifier required';
  end if;
  if evidence_paths is null
     or pg_catalog.cardinality(evidence_paths) < 1
     or pg_catalog.cardinality(evidence_paths) > 3
  then
    raise exception 'evidence required';
  end if;

  insert into public.reports (reporter_id, description, amount_lost, occurred_on)
  values ((select auth.uid()), pg_catalog.btrim(report_description), report_amount, report_date)
  returning id into created_id;

  for i in 0 .. pg_catalog.jsonb_array_length(entities) - 1 loop
    item := entities -> i;
    linked_id := public.upsert_entity(
      (item ->> 'kind')::public.entity_kind,
      item ->> 'value'
    );
    insert into public.report_entities (report_id, entity_id)
    values (created_id, linked_id)
    on conflict do nothing;
  end loop;

  foreach path in array evidence_paths
  loop
    insert into public.evidence_files (report_id, storage_path, uploaded_by)
    values (created_id, path, (select auth.uid()));
  end loop;

  return created_id;
end;
$$;

-- The reporter's own rows, including the admin note column that is otherwise hidden.
create function private.my_reports()
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
security definer
set search_path = ''
as $$
  select
    r.id,
    r.description,
    r.amount_lost,
    r.status,
    r.occurred_on,
    r.admin_notes,
    r.created_at
  from public.reports r
  where r.reporter_id = (select auth.uid());
$$;

create function public.my_reports()
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
  select * from private.my_reports();
$$;

revoke all on function private.guard_report_daily_limit() from public;
revoke all on function private.my_reports() from public;
revoke all on function public.submit_report(text, numeric, date, jsonb, text[]) from public;
revoke all on function public.my_reports() from public;

grant execute on function private.guard_report_daily_limit() to authenticated, service_role;
grant execute on function private.my_reports() to authenticated, service_role;
grant execute on function public.submit_report(text, numeric, date, jsonb, text[]) to authenticated, service_role;
grant execute on function public.my_reports() to authenticated, service_role;
