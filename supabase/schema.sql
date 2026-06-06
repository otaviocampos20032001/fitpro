-- ============================================================
-- FITPRO - Schema do Banco de Dados
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (professor e alunos)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  avatar_url text,
  role text not null default 'student' check (role in ('trainer', 'student')),
  trainer_id uuid references public.profiles(id) on delete set null,
  phone text,
  birth_date date,
  goal text,
  bio text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- EXERCISES (biblioteca de exercícios)
-- ============================================================
create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  muscle_groups text[] default '{}',
  equipment text,
  video_url text,
  thumbnail_url text,
  instructions text,
  created_by uuid references public.profiles(id),
  is_public boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- WORKOUT PLANS (fichas de treino)
-- ============================================================
create table public.workout_plans (
  id uuid primary key default uuid_generate_v4(),
  trainer_id uuid references public.profiles(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  goal text,
  duration_weeks integer,
  days_per_week integer,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- WORKOUT DAYS (dias do treino - A, B, C, etc)
-- ============================================================
create table public.workout_days (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references public.workout_plans(id) on delete cascade not null,
  name text not null, -- ex: "Treino A - Peito e Tríceps"
  day_of_week integer, -- 0=Dom, 1=Seg... null=qualquer dia
  order_index integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- WORKOUT DAY EXERCISES (exercícios de cada dia)
-- ============================================================
create table public.workout_day_exercises (
  id uuid primary key default uuid_generate_v4(),
  day_id uuid references public.workout_days(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  order_index integer default 0,
  sets integer default 3,
  reps text default '10-12', -- pode ser "10-12", "AMRAP", "30s"
  rest_seconds integer default 60,
  notes text,
  target_weight numeric(6,2),
  is_superset boolean default false,
  superset_group integer
);

-- ============================================================
-- WORKOUT SESSIONS (treinos realizados)
-- ============================================================
create table public.workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  plan_id uuid references public.workout_plans(id) on delete set null,
  day_id uuid references public.workout_days(id) on delete set null,
  status text default 'in_progress' check (status in ('in_progress', 'completed', 'skipped')),
  started_at timestamptz default now(),
  finished_at timestamptz,
  duration_minutes integer,
  notes text,
  rating integer check (rating between 1 and 5),
  created_at timestamptz default now()
);

-- ============================================================
-- SESSION SETS (séries executadas)
-- ============================================================
create table public.session_sets (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.workout_sessions(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  set_number integer not null,
  reps integer,
  weight numeric(6,2),
  duration_seconds integer, -- para exercícios isométricos
  is_pr boolean default false, -- Personal Record
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- PERSONAL RECORDS
-- ============================================================
create table public.personal_records (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  weight numeric(6,2),
  reps integer,
  one_rep_max numeric(6,2), -- calculado: weight * (1 + reps/30)
  achieved_at timestamptz default now(),
  session_id uuid references public.workout_sessions(id),
  unique(student_id, exercise_id)
);

-- ============================================================
-- MEASUREMENTS (medidas corporais)
-- ============================================================
create table public.measurements (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,1),
  muscle_mass_kg numeric(5,2),
  chest_cm numeric(5,1),
  waist_cm numeric(5,1),
  hip_cm numeric(5,1),
  arm_cm numeric(5,1),
  thigh_cm numeric(5,1),
  notes text,
  measured_at date default current_date,
  created_at timestamptz default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'pr')),
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_day_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_sets enable row level security;
alter table public.personal_records enable row level security;
alter table public.measurements enable row level security;
alter table public.notifications enable row level security;

-- Profiles: usuário vê o próprio perfil; trainer vê seus alunos
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Trainers can view their students" on public.profiles for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'trainer')
  and trainer_id = auth.uid()
);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Allow insert on signup" on public.profiles for insert with check (auth.uid() = id);

-- Exercises: públicos são visíveis por todos
create policy "Anyone can view public exercises" on public.exercises for select using (is_public = true or created_by = auth.uid());
create policy "Trainers can create exercises" on public.exercises for insert with check (auth.uid() = created_by);
create policy "Trainers can update own exercises" on public.exercises for update using (auth.uid() = created_by);

-- Workout plans: trainer e o aluno específico
create policy "Trainer or student can view plan" on public.workout_plans for select using (
  trainer_id = auth.uid() or student_id = auth.uid()
);
create policy "Trainer can manage plans" on public.workout_plans for all using (trainer_id = auth.uid());

-- Workout days
create policy "Access workout days through plan" on public.workout_days for select using (
  exists (select 1 from public.workout_plans wp where wp.id = plan_id and (wp.trainer_id = auth.uid() or wp.student_id = auth.uid()))
);
create policy "Trainer can manage workout days" on public.workout_days for all using (
  exists (select 1 from public.workout_plans wp where wp.id = plan_id and wp.trainer_id = auth.uid())
);

-- Workout day exercises
create policy "Access day exercises through plan" on public.workout_day_exercises for select using (
  exists (
    select 1 from public.workout_days wd
    join public.workout_plans wp on wp.id = wd.plan_id
    where wd.id = day_id and (wp.trainer_id = auth.uid() or wp.student_id = auth.uid())
  )
);
create policy "Trainer can manage day exercises" on public.workout_day_exercises for all using (
  exists (
    select 1 from public.workout_days wd
    join public.workout_plans wp on wp.id = wd.plan_id
    where wd.id = day_id and wp.trainer_id = auth.uid()
  )
);

-- Sessions: aluno gerencia as próprias; trainer visualiza dos seus alunos
create policy "Student can manage own sessions" on public.workout_sessions for all using (student_id = auth.uid());
create policy "Trainer can view student sessions" on public.workout_sessions for select using (
  exists (select 1 from public.profiles p where p.id = student_id and p.trainer_id = auth.uid())
);

-- Session sets
create policy "Student can manage own sets" on public.session_sets for all using (
  exists (select 1 from public.workout_sessions ws where ws.id = session_id and ws.student_id = auth.uid())
);
create policy "Trainer can view student sets" on public.session_sets for select using (
  exists (
    select 1 from public.workout_sessions ws
    join public.profiles p on p.id = ws.student_id
    where ws.id = session_id and p.trainer_id = auth.uid()
  )
);

-- Personal records
create policy "Student can manage own PRs" on public.personal_records for all using (student_id = auth.uid());
create policy "Trainer can view student PRs" on public.personal_records for select using (
  exists (select 1 from public.profiles p where p.id = student_id and p.trainer_id = auth.uid())
);

-- Measurements
create policy "Student can manage own measurements" on public.measurements for all using (student_id = auth.uid());
create policy "Trainer can manage student measurements" on public.measurements for all using (
  exists (select 1 from public.profiles p where p.id = student_id and p.trainer_id = auth.uid())
);

-- Notifications
create policy "Users manage own notifications" on public.notifications for all using (user_id = auth.uid());

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();
create trigger workout_plans_updated_at before update on public.workout_plans
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- SEED: exercícios base (50 exercícios)
-- ============================================================
insert into public.exercises (name, muscle_groups, equipment, is_public) values
('Supino Reto com Barra', '{"Peitoral","Tríceps","Deltóide Anterior"}', 'Barra e banco', true),
('Supino Inclinado com Halteres', '{"Peitoral Superior","Tríceps"}', 'Halteres e banco', true),
('Crucifixo com Halteres', '{"Peitoral"}', 'Halteres e banco', true),
('Crossover', '{"Peitoral"}', 'Cabo', true),
('Flexão de Braço', '{"Peitoral","Tríceps","Core"}', 'Peso corporal', true),
('Puxada Frontal', '{"Latíssimo do Dorso","Bíceps"}', 'Pulley', true),
('Remada Curvada', '{"Dorsal","Rombóides","Bíceps"}', 'Barra', true),
('Remada Unilateral', '{"Dorsal","Bíceps"}', 'Halter e banco', true),
('Levantamento Terra', '{"Posterior de Coxa","Glúteo","Dorsal","Core"}', 'Barra', true),
('Pull-Up (Barra Fixa)', '{"Latíssimo do Dorso","Bíceps"}', 'Barra fixa', true),
('Desenvolvimento Militar', '{"Deltóide","Tríceps"}', 'Barra', true),
('Elevação Lateral', '{"Deltóide Médio"}', 'Halteres', true),
('Elevação Frontal', '{"Deltóide Anterior"}', 'Halteres', true),
('Rosca Direta', '{"Bíceps"}', 'Barra ou Halteres', true),
('Rosca Alternada', '{"Bíceps"}', 'Halteres', true),
('Rosca Concentrada', '{"Bíceps"}', 'Halter e banco', true),
('Tríceps Testa', '{"Tríceps"}', 'Barra EZ', true),
('Tríceps Corda', '{"Tríceps"}', 'Cabo', true),
('Tríceps Francês', '{"Tríceps"}', 'Halter', true),
('Agachamento Livre', '{"Quadríceps","Glúteo","Posterior de Coxa"}', 'Barra', true),
('Leg Press 45°', '{"Quadríceps","Glúteo"}', 'Máquina', true),
('Extensão de Joelho', '{"Quadríceps"}', 'Máquina', true),
('Flexão de Joelho', '{"Posterior de Coxa"}', 'Máquina', true),
('Stiff', '{"Posterior de Coxa","Glúteo"}', 'Barra ou Halteres', true),
('Agachamento Búlgaro', '{"Quadríceps","Glúteo"}', 'Halteres e banco', true),
('Cadeira Abdutora', '{"Glúteo Médio","Abdutores"}', 'Máquina', true),
('Cadeira Adutora', '{"Adutores"}', 'Máquina', true),
('Panturrilha em Pé', '{"Gastrocnêmio"}', 'Máquina ou livre', true),
('Panturrilha Sentado', '{"Sóleo"}', 'Máquina', true),
('Hip Thrust', '{"Glúteo Máximo"}', 'Barra e banco', true),
('Abdominal Crunch', '{"Reto Abdominal"}', 'Peso corporal', true),
('Prancha', '{"Core","Reto Abdominal"}', 'Peso corporal', true),
('Abdominal Oblíquo', '{"Oblíquos"}', 'Peso corporal', true),
('Mountain Climber', '{"Core","Cardio"}', 'Peso corporal', true),
('Burpee', '{"Full Body","Cardio"}', 'Peso corporal', true),
('Puxada na Frente', '{"Latíssimo do Dorso"}', 'Pulley', true),
('Remada Baixa', '{"Dorsal Médio","Rombóides"}', 'Cabo', true),
('Face Pull', '{"Deltóide Posterior","Manguito Rotador"}', 'Cabo', true),
('Desenvolvimento com Halteres', '{"Deltóide","Tríceps"}', 'Halteres', true),
('Arnold Press', '{"Deltóide","Tríceps"}', 'Halteres', true),
('Supino Fechado', '{"Tríceps","Peitoral"}', 'Barra', true),
('Mergulho (Dip)', '{"Tríceps","Peitoral Inferior"}', 'Barras paralelas', true),
('Chin-Up', '{"Bíceps","Dorsal"}', 'Barra fixa', true),
('Agachamento Goblet', '{"Quadríceps","Glúteo","Core"}', 'Halter ou Kettlebell', true),
('Afundo (Lunges)', '{"Quadríceps","Glúteo"}', 'Halteres ou livre', true),
('Agachamento Sumô', '{"Adutores","Glúteo","Quadríceps"}', 'Barra ou Halter', true),
('Remada Cavalinho', '{"Trapézio","Deltóide"}', 'Barra', true),
('Crucifixo Invertido', '{"Deltóide Posterior","Rombóides"}', 'Halteres', true),
('Rosca Spider', '{"Bíceps"}', 'Barra EZ', true),
('Tríceps Mergulho no Banco', '{"Tríceps"}', 'Banco', true);
