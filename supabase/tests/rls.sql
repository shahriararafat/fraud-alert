-- Row-level checks against the local database. Rolls back, so it is safe to re-run.
-- Usage: npm run test:rls

begin;

insert into auth.users (
  instance_id, id, aud, role, email,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'a@example.com',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'b@example.com',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    now(), now()
  );

do $$
declare
  user_a uuid := '11111111-1111-4111-8111-111111111111';
  user_b uuid := '22222222-2222-4222-8222-222222222222';
  found_entity uuid;
  report_a uuid;
  report_b uuid;
  seen int;
begin
  if (select count(*) from public.profiles where id in (user_a, user_b)) <> 2 then
    raise exception 'signing up did not create profiles';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'scam_entities' and column_name = 'severity'
  ) then
    raise exception 'severity must be derived, not stored';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_a, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  found_entity := public.upsert_entity('phone', '01711111111');
  if found_entity is null then
    raise exception 'upsert did not return an entity';
  end if;

  insert into public.reports (reporter_id, description, amount_lost, occurred_on)
  values (
    user_a,
    'Sent bKash money for a phone that never arrived',
    2500,
    (timezone('Asia/Dhaka', now()))::date
  )
  returning id into report_a;

  insert into public.report_entities (report_id, entity_id)
  values (report_a, found_entity);

  begin
    insert into public.reports (reporter_id, description, status, occurred_on)
    values (
      user_a,
      'Trying to approve my own report',
      'approved',
      (timezone('Asia/Dhaka', now()))::date
    );
    raise exception 'a user inserted an approved report';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    update public.reports set status = 'approved' where id = report_a;
    raise exception 'a user approved their own report';
  exception
    when others then
      if sqlerrm not like '%only an admin%' and sqlerrm not like '%permission denied%' then
        raise;
      end if;
  end;

  begin
    update public.profiles set role = 'admin' where id = user_a;
    raise exception 'a user changed their own role';
  exception
    when insufficient_privilege or others then
      if sqlerrm not like '%permission denied%' and sqlerrm not like '%only an admin%' then
        raise;
      end if;
  end;

  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);

  execute 'set local role anon';
  select count(*) into seen from public.reports;
  if seen <> 0 then
    raise exception 'anon saw % pending report(s)', seen;
  end if;
  select count(*) into seen from public.entity_approved_counts;
  if seen <> 0 then
    raise exception 'anon saw an entity before any report was approved';
  end if;
  begin
    perform reporter_id from public.reports;
    raise exception 'anon could select reporter_id';
  exception
    when insufficient_privilege then
      null;
  end;
  begin
    perform * from public.appeals;
    raise exception 'anon could read appeals';
  exception
    when insufficient_privilege then
      null;
  end;
  execute 'reset role';

  update public.reports set status = 'approved' where id = report_a;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_b, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  if public.upsert_entity('phone', '01711111111') is distinct from found_entity then
    raise exception 'the same phone created a second entity';
  end if;
  begin
    perform public.upsert_entity('phone', '+8801711111111');
    raise exception 'un-normalized phone was accepted';
  exception
    when others then
      if sqlerrm not like '%normalized%' then
        raise;
      end if;
  end;

  select count(*) into seen
  from public.reports
  where id = report_a and description like 'Sent bKash%';
  if seen <> 1 then
    raise exception 'signed-in user could not read an approved report';
  end if;

  insert into public.reports (reporter_id, description, occurred_on)
  values (user_b, 'A second pending report', (timezone('Asia/Dhaka', now()))::date)
  returning id into report_b;

  select count(*) into seen from public.reports where id = report_b;
  if seen <> 1 then
    raise exception 'user could not read their own pending report';
  end if;
  execute 'reset role';

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_a, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  select count(*) into seen from public.reports where id = report_b;
  if seen <> 0 then
    raise exception 'user A saw user B pending report';
  end if;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);

  execute 'set local role anon';
  select count(*) into seen from public.reports where status = 'approved';
  if seen <> 1 then
    raise exception 'anon should see the one approved report, saw %', seen;
  end if;
  select approved_report_count into seen
  from public.entity_approved_counts
  where entity_id = found_entity;
  if seen is distinct from 1 then
    raise exception 'approved count should be 1, got %', seen;
  end if;
  begin
    perform reporter_id from public.reports;
    raise exception 'anon could select reporter_id on an approved report';
  exception
    when insufficient_privilege then
      null;
  end;
  execute 'reset role';

  update public.profiles set role = 'admin' where id = user_b;
  if (select role from public.profiles where id = user_b) <> 'admin' then
    raise exception 'SQL editor could not promote an admin';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_b, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  update public.reports set status = 'rejected', admin_notes = 'not enough evidence' where id = report_a;
  if (select status from public.reports where id = report_a) <> 'rejected' then
    raise exception 'admin could not change report status';
  end if;
  if (select admin_notes from public.report_private(report_a)) is distinct from 'not enough evidence' then
    raise exception 'admin could not read admin notes';
  end if;
  execute 'reset role';

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_a, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  if (select admin_notes from public.report_private(report_a)) is distinct from 'not enough evidence' then
    raise exception 'reporter could not read the note on their own report';
  end if;
  if exists (select 1 from public.report_private(report_b)) then
    raise exception 'reporter could read another report''s private fields';
  end if;

  insert into storage.objects (bucket_id, name)
  values ('evidence', user_a::text || '/shot.png');
  begin
    insert into storage.objects (bucket_id, name)
    values ('evidence', user_b::text || '/shot.png');
    raise exception 'user stored a file in someone else''s folder';
  exception
    when others then
      if sqlerrm not like '%row-level security%' and sqlerrm not like '%permission denied%' then
        raise;
      end if;
  end;
end $$;

-- A second person cannot read a pending report or its screenshot.
do $$
declare
  user_a uuid := '11111111-1111-4111-8111-111111111111';
  user_c uuid := '33333333-3333-4333-8333-333333333333';
  submitted uuid;
  seen int;
  limited boolean := false;
  today date := (timezone('Asia/Dhaka', now()))::date;
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);

  insert into auth.users (
    instance_id, id, aud, role, email,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    user_c,
    'authenticated', 'authenticated', 'c@example.com',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    now(), now()
  );

  if not exists (select 1 from public.profiles where id = user_c) then
    raise exception 'signing up did not create a profile';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_c, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';

  begin
    insert into public.reports (reporter_id, description, occurred_on)
    values (user_c, 'This date has not happened yet', today + 1);
    raise exception 'a future date was accepted';
  exception
    when check_violation then
      null;
  end;

  begin
    perform public.submit_report(
      'no identifiers here at all',
      null,
      today,
      '[]'::jsonb,
      array[user_c::text || '/missing.png']
    );
    raise exception 'a report with no identifier was accepted';
  exception
    when others then
      if sqlerrm not like '%identifier required%' then
        raise;
      end if;
  end;

  submitted := public.submit_report(
    'Paid bKash for a phone and the shop disappeared overnight',
    3200,
    today,
    jsonb_build_array(
      jsonb_build_object('kind', 'phone', 'value', '01611111111'),
      jsonb_build_object('kind', 'shop_name', 'value', 'Ghost Mobile')
    ),
    array[user_c::text || '/receipt.jpg']
  );
  if submitted is null then
    raise exception 'submit_report returned nothing';
  end if;
  if (select status from public.reports where id = submitted) is distinct from 'pending' then
    raise exception 'submitted report was not pending';
  end if;
  if (select count(*) from public.report_entities where report_id = submitted) <> 2 then
    raise exception 'submit_report did not link both entities';
  end if;
  if public.upsert_entity('phone', '01611111111') is null then
    raise exception 'phone entity missing after submit';
  end if;

  insert into storage.objects (bucket_id, name)
  values ('evidence', user_c::text || '/receipt.jpg');

  if (select count(*) from public.evidence_files where report_id = submitted) <> 1 then
    raise exception 'reporter could not see their evidence row';
  end if;
  if (
    select count(*) from storage.objects
    where bucket_id = 'evidence' and name = user_c::text || '/receipt.jpg'
  ) <> 1 then
    raise exception 'reporter could not see their evidence file';
  end if;
  if (select admin_notes from public.my_reports() where id = submitted) is not null then
    raise exception 'a new report should not have an admin note';
  end if;

  for i in 1..6 loop
    begin
      insert into public.reports (reporter_id, description, occurred_on)
      values (user_c, 'Extra report number ' || i, today);
    exception
      when others then
        if sqlerrm not like '%report limit reached%' then
          raise;
        end if;
        limited := true;
        exit;
    end;
  end loop;
  if not limited then
    raise exception 'the daily report limit was not enforced';
  end if;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);

  if (select count(*) from public.reports where reporter_id = user_c) <> 5 then
    raise exception 'expected 5 reports for the day, got %',
      (select count(*) from public.reports where reporter_id = user_c);
  end if;

  update public.reports
  set admin_notes = 'please send the chat'
  where id = submitted;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_c, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  if (select admin_notes from public.my_reports() where id = submitted) is distinct from 'please send the chat' then
    raise exception 'reporter could not read the note through my_reports';
  end if;
  if exists (select 1 from public.my_reports() where description like 'Sent bKash%') then
    raise exception 'my_reports leaked another person''s report';
  end if;
  execute 'reset role';

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_a, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  select count(*) into seen from public.reports where id = submitted;
  if seen <> 0 then
    raise exception 'another user saw a pending report';
  end if;
  select count(*) into seen
  from public.evidence_files
  where storage_path = user_c::text || '/receipt.jpg';
  if seen <> 0 then
    raise exception 'another user saw the evidence row';
  end if;
  select count(*) into seen
  from storage.objects
  where bucket_id = 'evidence' and name = user_c::text || '/receipt.jpg';
  if seen <> 0 then
    raise exception 'another user saw the evidence file';
  end if;
  if exists (select 1 from public.my_reports() where id = submitted) then
    raise exception 'my_reports showed another person''s report';
  end if;
  if exists (select 1 from public.my_reports() where admin_notes = 'please send the chat') then
    raise exception 'another user read the admin note';
  end if;
end $$;

rollback;
