-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type app_role as enum ('admin', 'member');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type project_status as enum ('planned', 'active', 'on_hold', 'completed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type task_status as enum ('todo', 'in_progress', 'completed', 'overdue');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type priority_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role app_role not null default 'member',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  due_date date,
  priority priority_level not null default 'medium',
  status project_status not null default 'planned',
  owner_id uuid not null references public.profiles(id) on delete cascade,
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role app_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  status task_status not null default 'todo',
  priority priority_level not null default 'medium',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_project_members_user on public.project_members(user_id);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_assignee on public.tasks(assignee_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_activity_logs_project on public.activity_logs(project_id);

-- Trigger for profile auto-create
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when lower(coalesce(new.raw_user_meta_data ->> 'role', 'member')) = 'admin' then 'admin'::app_role
      else 'member'::app_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.activity_logs enable row level security;

create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = user_uuid and p.role = 'admin'
  );
$$;

create or replace function public.is_project_owner(project_uuid uuid, user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_uuid and p.owner_id = user_uuid
  );
$$;

create or replace function public.is_project_member(project_uuid uuid, user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = project_uuid and pm.user_id = user_uuid
  );
$$;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
for select using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "projects member read" on public.projects;
create policy "projects member read" on public.projects
for select using (
  public.is_admin(auth.uid())
  or owner_id = auth.uid()
  or public.is_project_member(id, auth.uid())
  or exists (
    select 1 from public.tasks t
    where t.project_id = id and t.assignee_id = auth.uid()
  )
);

drop policy if exists "projects create own" on public.projects;
create policy "projects create own" on public.projects
for insert with check (public.is_admin(auth.uid()) and owner_id = auth.uid());

drop policy if exists "projects admin update/delete" on public.projects;
create policy "projects admin update/delete" on public.projects
for update using (public.is_admin(auth.uid()) or owner_id = auth.uid())
with check (public.is_admin(auth.uid()) or owner_id = auth.uid());

drop policy if exists "projects admin delete" on public.projects;
create policy "projects admin delete" on public.projects
for delete using (public.is_admin(auth.uid()) or owner_id = auth.uid());

drop policy if exists "project members read own project" on public.project_members;
create policy "project members read own project" on public.project_members
for select using (
  public.is_admin(auth.uid()) or user_id = auth.uid() or public.is_project_owner(project_id, auth.uid())
);

drop policy if exists "project members admin manage" on public.project_members;
create policy "project members admin manage" on public.project_members
for all using (public.is_admin(auth.uid()) or public.is_project_owner(project_id, auth.uid()))
with check (public.is_admin(auth.uid()) or public.is_project_owner(project_id, auth.uid()));

drop policy if exists "tasks read project members" on public.tasks;
create policy "tasks read project members" on public.tasks
for select using (
  public.is_admin(auth.uid()) or assignee_id = auth.uid() or public.is_project_owner(tasks.project_id, auth.uid()) or exists (
    select 1 from public.project_members pm
    where pm.project_id = tasks.project_id and pm.user_id = auth.uid()
  )
);

drop policy if exists "tasks create by admins/project owners" on public.tasks;
create policy "tasks create by admins/project owners" on public.tasks
for insert with check (
  public.is_admin(auth.uid())
);

drop policy if exists "tasks assignee update status" on public.tasks;
create policy "tasks assignee update status" on public.tasks
for update using (
  public.is_admin(auth.uid()) or assignee_id = auth.uid()
) with check (
  public.is_admin(auth.uid()) or assignee_id = auth.uid()
);

drop policy if exists "task comments member read/write" on public.task_comments;
create policy "task comments member read/write" on public.task_comments
for all using (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.tasks t
    where t.id = task_id and (t.assignee_id = auth.uid() or t.creator_id = auth.uid())
  )
) with check (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.tasks t
    where t.id = task_id and (t.assignee_id = auth.uid() or t.creator_id = auth.uid())
  )
);

drop policy if exists "activity logs read project members" on public.activity_logs;
create policy "activity logs read project members" on public.activity_logs
for select using (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.project_members pm
    where pm.project_id = activity_logs.project_id and pm.user_id = auth.uid()
  )
);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('project-attachments', 'project-attachments', false)
on conflict (id) do nothing;

drop policy if exists "avatars are publicly viewable" on storage.objects;
create policy "avatars are publicly viewable" on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists "users manage own avatar" on storage.objects;
create policy "users manage own avatar" on storage.objects
for all using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "project attachments visible to members" on storage.objects;
create policy "project attachments visible to members" on storage.objects
for select using (
  bucket_id = 'project-attachments' and
  exists (
    select 1 from public.project_members pm
    where pm.project_id::text = (storage.foldername(name))[1]
      and pm.user_id = auth.uid()
  )
);

drop policy if exists "project attachments upload by admins" on storage.objects;
create policy "project attachments upload by admins" on storage.objects
for insert with check (
  bucket_id = 'project-attachments' and public.is_admin(auth.uid())
);
