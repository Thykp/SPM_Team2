-- =========================
-- 1. Enable pg_cron extension
-- =========================
create extension if not exists pg_cron with schema extensions;

-- =========================
-- 2. Create function to calculate next occurrence for recurring tasks
-- =========================
create or replace function public.calculate_next_occurrence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_timestamp timestamptz;
begin
  -- If the client already provides next_occurrence, skip recalculation
  if NEW.next_occurrence is not null then
    return NEW;
  end if;

  -- Fetch the linked task's deadline for calculation baseline
  select deadline
  into base_timestamp
  from public.revamped_task
  where id = NEW.task_id;

  -- If no deadline found, fallback to now()
  if base_timestamp is null then
    base_timestamp := now();
  end if;

  -- Compute next_occurrence based on frequency and interval
  case
    when NEW.frequency = 'Day' then
      NEW.next_occurrence := base_timestamp + (NEW.interval || ' days')::interval;
    when NEW.frequency = 'Week' then
      NEW.next_occurrence := base_timestamp + (NEW.interval || ' weeks')::interval;
    when NEW.frequency = 'Month' then
      NEW.next_occurrence := base_timestamp + (NEW.interval || ' months')::interval;
    else
      raise exception 'Unknown frequency type: %', NEW.frequency;
  end case;

  return NEW;
end;
$$;

-- Add comment to document the function
comment on function public.calculate_next_occurrence() is 
  'Automatically calculates next_occurrence for recurring tasks based on frequency and interval';

-- =========================
-- 3. Create trigger to auto-calculate next occurrence
-- =========================
create trigger trigger_auto_next_occurrence
  before insert or update on public.revamped_recurrence
  for each row
  execute function public.calculate_next_occurrence();

-- =========================
-- 4. Create function to generate next recurring tasks
-- =========================
create or replace function public.create_next_recurring_task()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  new_task_id uuid;
  new_deadline timestamptz;
  sub record;
  sub_new_id uuid;
  pt record;
  subpt record;
begin
  for rec in
    select r.*, t.*
    from public.revamped_recurrence r
    join public.revamped_task t on r.task_id = t.id
    where t.status = 'Completed'
      and r.next_occurrence <= now()
      and (r.end_date is null or r.next_occurrence <= r.end_date)
  loop
    -- Calculate new deadline for the next occurrence
    if rec.frequency = 'Day' then
      new_deadline := rec.next_occurrence + (rec.interval || ' days')::interval;
    elsif rec.frequency = 'Week' then
      new_deadline := rec.next_occurrence + (rec.interval || ' weeks')::interval;
    elsif rec.frequency = 'Month' then
      new_deadline := rec.next_occurrence + (rec.interval || ' months')::interval;
    end if;

    -- Create the new recurring parent task
    insert into public.revamped_task (
      parent_task_id, project_id, title, deadline, description, status, priority
    )
    values (
      null, rec.project_id, rec.title, new_deadline, rec.description, 'Unassigned', rec.priority
    )
    returning id into new_task_id;

    -- Copy parent task participants
    for pt in
      select * from public.revamped_task_participant where task_id = rec.task_id
    loop
      insert into public.revamped_task_participant (
        task_id, profile_id, is_owner, deadline_reminder
      )
      values (
        new_task_id, pt.profile_id, pt.is_owner, pt.deadline_reminder
      );
    end loop;

    -- Create recurring subtasks
    for sub in
      select * from public.revamped_task where parent_task_id = rec.task_id
    loop
      insert into public.revamped_task (
        parent_task_id, project_id, title, deadline, description, status, priority
      )
      values (
        new_task_id, sub.project_id, sub.title,
        new_deadline + (sub.deadline - rec.deadline), -- preserves offset
        sub.description, 'Unassigned', sub.priority
      )
      returning id into sub_new_id;

      -- Copy subtask participants
      for subpt in
        select * from public.revamped_task_participant where task_id = sub.id
      loop
        insert into public.revamped_task_participant (
          task_id, profile_id, is_owner, deadline_reminder
        )
        values (
          sub_new_id, subpt.profile_id, subpt.is_owner, subpt.deadline_reminder
        );
      end loop;
    end loop;

    -- Update next_occurrence for the recurrence row
    update public.revamped_recurrence
    set next_occurrence = new_deadline
    where id = rec.id;
  end loop;
end;
$$;

-- Add comment to document the function
comment on function public.create_next_recurring_task() is 
  'Automatically creates new recurring tasks when completed tasks reach their next_occurrence time';

-- =========================
-- 5. Schedule the cron job to run every 5 minutes
-- =========================
select cron.schedule(
  'update-recurring-task',              -- Unique job name
  '*/5 * * * *',                        -- Cron expression: every 5 minutes
  $$select public.create_next_recurring_task();$$
);

-- =========================
-- 6. Verification queries (run these after migration to verify setup)
-- =========================

-- View all scheduled cron jobs
-- select * from cron.job;

-- View cron job run history
-- select * from cron.job_run_details order by start_time desc limit 10;

-- Manually test the calculate_next_occurrence function
-- insert into public.revamped_recurrence (task_id, frequency, interval) values ('[task-id]', 'Day', 1);

-- Manually test the create_next_recurring_task function
-- select public.create_next_recurring_task();

-- Check recurring tasks and their next occurrences
-- select t.id, t.title, t.status, t.deadline, r.frequency, r.interval, r.next_occurrence, r.end_date
-- from public.revamped_task t
-- join public.revamped_recurrence r on t.id = r.task_id
-- order by r.next_occurrence;

-- Check for completed recurring tasks ready for next occurrence
-- select t.id, t.title, t.status, t.deadline, r.next_occurrence
-- from public.revamped_task t
-- join public.revamped_recurrence r on t.id = r.task_id
-- where t.status = 'Completed'
--   and r.next_occurrence <= now()
--   and (r.end_date is null or r.next_occurrence <= r.end_date);

-- =========================
-- To unschedule the job (if needed):
-- =========================
-- select cron.unschedule('update-recurring-task');


