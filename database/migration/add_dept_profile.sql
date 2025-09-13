-- Add department column
alter table public.profiles
  add column if not exists department text;

-- Optional: index if you'll filter/group by department
create index if not exists profiles_department_idx
  on public.profiles (department);
