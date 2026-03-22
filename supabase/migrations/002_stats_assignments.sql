-- Game Stats
create table public.game_stats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete cascade not null,
  home_score integer default 0,
  away_score integer default 0,
  opponent text,
  is_live boolean default false,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Player Stats
create table public.player_stats (
  id uuid primary key default gen_random_uuid(),
  game_stat_id uuid references public.game_stats(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sport text not null,
  stats jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(game_stat_id, user_id)
);

-- Assignments
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete set null,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  is_completed boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- RLS
alter table public.game_stats enable row level security;
alter table public.player_stats enable row level security;
alter table public.assignments enable row level security;

create policy "game_stats_select" on public.game_stats for select
  using (exists (select 1 from public.team_members where team_id = game_stats.team_id and user_id = auth.uid()));
create policy "game_stats_insert" on public.game_stats for insert
  with check (exists (select 1 from public.team_members where team_id = game_stats.team_id and user_id = auth.uid() and role in ('coach','manager')));
create policy "game_stats_update" on public.game_stats for update
  using (exists (select 1 from public.team_members where team_id = game_stats.team_id and user_id = auth.uid() and role in ('coach','manager')));

create policy "player_stats_select" on public.player_stats for select using (true);
create policy "player_stats_upsert" on public.player_stats for all using (auth.uid() = user_id);

create policy "assignments_select" on public.assignments for select
  using (exists (select 1 from public.team_members where team_id = assignments.team_id and user_id = auth.uid()));
create policy "assignments_insert" on public.assignments for insert
  with check (exists (select 1 from public.team_members where team_id = assignments.team_id and user_id = auth.uid() and role in ('coach','manager')));
create policy "assignments_update" on public.assignments for update
  using (auth.uid() = assigned_to or exists (select 1 from public.team_members where team_id = assignments.team_id and user_id = auth.uid() and role in ('coach','manager')));
