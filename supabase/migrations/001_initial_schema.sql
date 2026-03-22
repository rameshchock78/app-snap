-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  avatar_url text,
  phone text,
  created_at timestamptz default now()
);

-- Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null,
  season text,
  age_group text,
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 8)),
  logo_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Team Members
create type public.member_role as enum ('coach', 'manager', 'player', 'parent');

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role public.member_role not null default 'player',
  jersey_number text,
  position text,
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);

-- Events
create type public.event_type as enum ('game', 'practice', 'meeting', 'other');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade not null,
  title text not null,
  type public.event_type not null default 'practice',
  start_time timestamptz not null,
  end_time timestamptz,
  location text,
  notes text,
  is_recurring boolean default false,
  recurrence_rule text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Event Attendance (RSVP)
create type public.rsvp_status as enum ('yes', 'no', 'maybe');

create table public.event_attendances (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status public.rsvp_status not null,
  note text,
  updated_at timestamptz default now(),
  unique(event_id, user_id)
);

-- Message Threads
create type public.thread_type as enum ('team', 'direct', 'announcement');

create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  type public.thread_type not null default 'team',
  name text,
  participants uuid[],
  created_at timestamptz default now()
);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.message_threads(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz default now()
);

-- Invoices
create type public.payment_status as enum ('pending', 'partial', 'paid', 'overdue');

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  description text not null,
  due_date date,
  status public.payment_status default 'pending',
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);

-- Push Tokens
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  token text not null,
  platform text not null,
  created_at timestamptz default now(),
  unique(user_id, token)
);

-- -------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.events enable row level security;
alter table public.event_attendances enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.invoices enable row level security;
alter table public.push_tokens enable row level security;

-- Profiles: users can read all profiles, only update their own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Teams: visible to members only
create policy "teams_select" on public.teams for select
  using (exists (select 1 from public.team_members where team_id = teams.id and user_id = auth.uid()));
create policy "teams_insert" on public.teams for insert with check (auth.uid() = created_by);
create policy "teams_update" on public.teams for update
  using (exists (select 1 from public.team_members where team_id = teams.id and user_id = auth.uid() and role in ('coach','manager')));

-- Team Members: visible to same team
create policy "team_members_select" on public.team_members for select
  using (exists (select 1 from public.team_members tm where tm.team_id = team_members.team_id and tm.user_id = auth.uid()));
create policy "team_members_insert" on public.team_members for insert with check (auth.uid() = user_id);

-- Events: visible to team members
create policy "events_select" on public.events for select
  using (exists (select 1 from public.team_members where team_id = events.team_id and user_id = auth.uid()));
create policy "events_insert" on public.events for insert
  with check (exists (select 1 from public.team_members where team_id = events.team_id and user_id = auth.uid() and role in ('coach','manager')));

-- Attendance: team members can manage their own
create policy "attendance_select" on public.event_attendances for select
  using (exists (
    select 1 from public.events e
    join public.team_members tm on tm.team_id = e.team_id
    where e.id = event_attendances.event_id and tm.user_id = auth.uid()
  ));
create policy "attendance_upsert" on public.event_attendances for all
  using (auth.uid() = user_id);

-- Messages: thread participants only
create policy "messages_select" on public.messages for select
  using (exists (
    select 1 from public.message_threads mt
    join public.team_members tm on tm.team_id = mt.team_id
    where mt.id = messages.thread_id and tm.user_id = auth.uid()
  ));
create policy "messages_insert" on public.messages for insert
  with check (auth.uid() = sender_id);

-- Invoices: own invoices + coaches/managers of team
create policy "invoices_select" on public.invoices for select
  using (auth.uid() = user_id or exists (
    select 1 from public.team_members where team_id = invoices.team_id and user_id = auth.uid() and role in ('coach','manager')
  ));

-- Push tokens: own only
create policy "push_tokens_all" on public.push_tokens for all using (auth.uid() = user_id);

-- -------------------------------------------------------
-- Trigger: auto-create profile on sign up
-- -------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
