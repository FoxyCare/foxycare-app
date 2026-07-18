-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role text not null check (role in ('parent', 'nanny')),
  full_name text not null,
  avatar_url text,
  bio text,
  location text,
  phone text,
  -- Nanny-specific fields
  hourly_rate numeric(10, 2),
  experience_years integer,
  certifications text[],
  rating numeric(3, 2),
  total_reviews integer default 0,
  -- Parent-specific fields
  children_count integer,
  children_ages integer[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bookings table
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid references public.profiles(id) on delete cascade not null,
  nanny_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  hourly_rate numeric(10, 2) not null,
  total_amount numeric(10, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_time_check check (end_time > start_time)
);

-- Conversations table
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  participant_ids uuid[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists bookings_parent_id_idx on public.bookings(parent_id);
create index if not exists bookings_nanny_id_idx on public.bookings(nanny_id);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists conversations_participant_ids_idx on public.conversations using gin(participant_ids);

-- Row-Level Security
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Bookings policies
create policy "Users can view their own bookings"
  on public.bookings for select
  using (
    auth.uid() in (
      select user_id from public.profiles where id = parent_id
      union
      select user_id from public.profiles where id = nanny_id
    )
  );

create policy "Parents can create bookings"
  on public.bookings for insert
  with check (
    auth.uid() = (select user_id from public.profiles where id = parent_id)
  );

create policy "Booking parties can update their booking"
  on public.bookings for update
  using (
    auth.uid() in (
      select user_id from public.profiles where id = parent_id
      union
      select user_id from public.profiles where id = nanny_id
    )
  );

-- Conversations policies
create policy "Participants can view their conversations"
  on public.conversations for select
  using (auth.uid() = any(participant_ids));

create policy "Authenticated users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = any(participant_ids));

-- Messages policies
create policy "Conversation participants can view messages"
  on public.messages for select
  using (
    auth.uid() in (
      select unnest(participant_ids)
      from public.conversations
      where id = conversation_id
    )
  );

create policy "Conversation participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and auth.uid() in (
      select unnest(participant_ids)
      from public.conversations
      where id = conversation_id
    )
  );

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute procedure public.handle_updated_at();

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'role', 'parent')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
