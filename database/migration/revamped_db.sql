create extension if not exists moddatetime with schema extensions;
create extension if not exists "uuid-ossp";

-- =========================
-- enums
-- =========================

create type public.revamped_user_role as enum (
    'Staff',
    'Manager',
    'Director',
    'Senior Management'
);

-- =========================
-- departments
-- =========================

create table public.revamped_departments (
    id uuid not null default uuid_generate_v4(),
    name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint pk_department primary key (id)
);

drop trigger if exists revamped_departments_set_updated_at on public.revamped_departments;
create trigger revamped_departments_set_updated_at
before update on public.revamped_departments
for each row execute procedure extensions.moddatetime(updated_at);

-- =========================
-- teams
-- =========================

create table public.revamped_teams (
    id uuid not null default uuid_generate_v4(),
    department_id uuid not null,
    name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint pk_team primary key (id),
    constraint fk_team_department_id_department foreign key (department_id) references public.revamped_departments(id) on delete cascade
);

drop trigger if exists revamped_teams_set_updated_at on public.revamped_teams;
create trigger revamped_teams_set_updated_at
before update on public.revamped_teams
for each row execute procedure extensions.moddatetime(updated_at);

-- =========================
-- project
-- =========================
create table public.revamped_project (
    id uuid not null default uuid_generate_v4(),
    display_name text not null,
    title text not null,
    description text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint pk_project primary key (id)
);

drop trigger if exists revamped_project_set_updated_at on public.revamped_project;
create trigger revamped_project_set_updated_at
before update on public.revamped_project
for each row execute procedure extensions.moddatetime(updated_at);

-- =========================
-- Profile: J edit the columns cause got some triggers in place idk if the ones here are the latest ones
-- =========================
create table public.revamped_profiles (
    id uuid not null,
    department_id uuid null,
    team_id uuid null,
    display_name text not null,
    role public.revamped_user_role null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint pk_profile primary key (id),
    constraint fk_profile_department_id_department foreign key (department_id) references public.revamped_departments(id) on delete set null,
    constraint fk_profile_team_id_team foreign key (team_id) references public.revamped_teams(id) on delete set null
);

drop trigger if exists profile_set_updated_at on public.revamped_profiles;
create trigger profile_set_updated_at
before update on public.revamped_profiles
for each row execute procedure extensions.moddatetime(updated_at);


drop trigger if exists revamped_on_auth_user_created on auth.users;
create trigger revamped_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- task
-- =========================
create table public.revamped_task (
    id uuid not null default uuid_generate_v4(),
    parent_task_id uuid null,
    project_id uuid null,
    title text not null,
    deadline timestamptz not null,
    description text not null,
    status public.task_status not null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint pk_task primary key (id),
    constraint fk_task_parent_task_id_tas foreign key (parent_task_id) references public.revamped_task(id) on delete cascade,
    constraint fk_task_project_id_project foreign key (project_id) references public.revamped_project(id) on delete set null
);

drop trigger if exists revamped_task_set_updated_at on public.revamped_task;
create trigger revamped_task_set_updated_at
before update on public.revamped_task
for each row execute procedure extensions.moddatetime(updated_at);

-- =========================
-- task participant
-- =========================
create table public.revamped_task_participant (
    task_id uuid not null,
    profile_id uuid not null,
    is_owner boolean not null default false,
    created_at timestamptz not null default now(),

    constraint pk_task_participant primary key (task_id, profile_id),
    constraint fk_task_participant_task_id_task foreign key (task_id) references public.revamped_task(id) on delete cascade,
    constraint fk_task_participant_profile_id_profile foreign key (profile_id) references public.revamped_profiles(id) on delete restrict
);


-- =========================
-- project participant
-- =========================
create table public.revamped_project_participant (
    project_id uuid not null,
    profile_id uuid not null,
    is_owner boolean not null default false,
    created_at timestamptz not null default now(),

    constraint pk_project_participant primary key (project_id, profile_id),
    constraint fk_project_participant_project_id_project foreign key (project_id) references public.revamped_project(id) on delete cascade,
    constraint fk_project_participant_profile_id_profile foreign key (profile_id) references public.revamped_profiles(id) on delete restrict
);

-- =========================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =========================

-- Profiles: Finding users by department/team for project assignment
create index idx_profiles_department_id on public.revamped_profiles(department_id);
create index idx_profiles_team_id on public.revamped_profiles(team_id);

-- Departments: Finding by name for user management
create index idx_departments_name on public.revamped_departments(name);

-- Teams: Finding teams within a department
create index idx_teams_department_id on public.revamped_teams(department_id);

-- Tasks: Core business scenarios
-- Finding subtasks of a parent task (high priority use case)
create index idx_task_parent_task_id on public.revamped_task(parent_task_id);
-- Finding tasks by project for project management
create index idx_task_project_id on public.revamped_task(project_id);
-- Finding tasks by status for filtering/dashboards
create index idx_task_status on public.revamped_task(status);
-- Finding tasks by deadline for overdue/upcoming alerts
create index idx_task_deadline on public.revamped_task(deadline);
-- Composite index for common project + status queries
create index idx_task_project_status on public.revamped_task(project_id, status);

-- Task Participants: Finding assigned tasks (highest priority use case)
-- Finding all tasks assigned to a user
create index idx_task_participant_profile_id on public.revamped_task_participant(profile_id);
-- Finding owners vs collaborators
create index idx_task_participant_profile_owner on public.revamped_task_participant(profile_id, is_owner);

-- Project Participants: Finding assigned projects
-- Finding all projects assigned to a user
create index idx_project_participant_profile_id on public.revamped_project_participant(profile_id);
-- Finding project owners vs collaborators
create index idx_project_participant_profile_owner on public.revamped_project_participant(profile_id, is_owner);