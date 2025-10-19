-- =========================
-- 1. Enable pg_cron extension
-- =========================
create extension if not exists pg_cron with schema extensions;

-- =========================
-- 2. Create function to update overdue tasks
-- =========================
create or replace function public.update_overdue_tasks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Update all tasks (parent and subtasks) that are past deadline and not completed
  update public.revamped_task
  set status = 'Overdue'
  where deadline < now()
    and status != 'Completed';
end;
$$;

-- Add comment to document the function
comment on function public.update_overdue_tasks() is 
  'Automatically updates task status to Overdue for tasks past their deadline (excludes Completed tasks)';

-- =========================
-- 3. Schedule the cron job to run every 30 minutes
-- =========================
select cron.schedule(
  'update-overdue-tasks-every-30min',    -- Unique job name
  '*/30 * * * *',                         -- Cron expression: every 30 minutes
  $$select public.update_overdue_tasks();$$
);

-- =========================
-- 4. Verification queries (run these after migration to verify setup)
-- =========================

-- View all scheduled cron jobs
-- select * from cron.job;

-- View cron job run history
-- select * from cron.job_run_details order by start_time desc limit 10;

-- Manually test the function
-- select public.update_overdue_tasks();

-- Check tasks that should be overdue
-- select id, title, status, deadline, 
--        case when deadline < now() then 'Should be Overdue' else 'Not yet due' end as check_status
-- from public.revamped_task
-- where status != 'Completed'
-- order by deadline;

-- =========================
-- To unschedule the job (if needed):
-- =========================
-- select cron.unschedule('update-overdue-tasks-every-30min');

