## TaskFlow Pro – Project & Task Management

A small but production‑style project & task management app built in ~1 day.

It focuses on:

- Authentication and roles
- Project & team management
- Task creation, assignment & status tracking
- Simple analytics dashboard (projects, tasks, overdue)

---

## Tech Stack

- **Frontend**: React + Vite + TypeScript, React Router, Tailwind CSS
- **Backend**: Node + Express REST API
- **Auth & DB**: Supabase Auth + Postgres
- **Validation**: Zod (for REST payloads)
- **RBAC & Security**: Supabase Row Level Security (RLS) + API checks

---

## Features (What works)

- **Authentication**
  - Signup, login, logout via Supabase Auth
  - Session persistence and protected routes

- **Roles**
  - `admin`: create/edit projects, assign members, create tasks
  - `member`: can only see projects/tasks they are assigned to and update their own task status

- **Projects**
  - Admin creates projects with: name, description, due date, priority, status
  - Admin assigns members to projects (no duplicates – upsert)
  - Per‑project metrics: total tasks, completed, due soon (next 3 days), overdue

- **Tasks**
  - Admin creates tasks inside projects
  - Each task: title, project, assignee, due date, priority, status
  - Member can update status (Todo/In Progress/Completed/Overdue) for tasks assigned to them
  - Overdue is derived from `due_date` in the UI (anything past today becomes “Overdue”)

- **Dashboards**
  - Admin / Member dashboard summary:
    - Total projects (visible to that user via RLS)
    - Total tasks
    - Completed tasks
    - Overdue tasks (derived from due dates)
  - Project page shows per‑project progress + small “upcoming tasks” list

- **Team**
  - Team page lists all profiles
  - Shows which projects each member is assigned to

---

## Setup & Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_API_BASE_URL=http://localhost:4000
API_PORT=4000
```

> Note: never expose the Supabase `service_role` key to the frontend – this app only uses the public anon key.

### 3. Database schema & policies

In the Supabase SQL editor, run the contents of:

```text
supabase/schema.sql
```

This sets up:

- Tables: `profiles`, `projects`, `project_members`, `tasks`, `task_comments`, `activity_logs`
- Enums for roles, task status, priority, project status
- Foreign keys + cascade delete
- Indexes for common queries
- Trigger to auto‑create a `profiles` row when a user signs up
- RLS policies for:
  - **Profiles**: users can read themselves, admins can read all
  - **Projects**: visible to admins, owners, explicit members, and users assigned tasks
  - **Project members**: visible to admins and project owners
  - **Tasks**: visible to admins, assignees, and project members
  - **Inserts**:
    - Projects: **admin only**
    - Tasks: **admin only**
  - **Updates**:
    - Task status: assignee or admin

### 4. Make your user an admin

After signing up your first user, promote them to admin in Supabase:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

### 5. Run REST API + Frontend

In one terminal (REST API):

```bash
npm run dev:api
```

This starts the Express server at `http://localhost:4000`.

In another terminal (frontend):

```bash
npm run dev
```

Open the URL that Vite prints (usually `http://localhost:5173`).

---

## How to Demo (Suggested Flow)

1. **Signup/login** as admin.
2. Create a **project** with due date and priority.
3. Invite/create a member account and assign them to the project.
4. As admin, create a **task** in that project, assign it to the member, set a due date.
5. Switch to the member account:
   - See assigned project(s) and tasks.
   - Change task status on the board.
6. Show the **dashboard**:
   - Project count, task count, completed, and overdue reflect the current state.

---

## Notes / Trade‑offs (for a 1‑day project)

- Focus is on **core flows** + **security** rather than full analytics or realtime.
- Overdue is computed in the UI from `due_date` instead of a background job.
- REST API currently covers the main CRUD paths (projects, tasks, members); some operations are intentionally left minimal.
- Code is organized for clarity and extension rather than micro‑optimizations.

