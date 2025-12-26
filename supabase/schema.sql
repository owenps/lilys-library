-- Lily's Library Database Schema
-- Run this in Supabase SQL Editor to set up your database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Books table
create table if not exists books (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  author text not null,
  author_nationality text, -- ISO 3166-1 alpha-2 country code
  isbn text,
  cover_url text,
  page_count integer,
  genre text,
  description text,
  published_year integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User books (reading status, progress)
create table if not exists user_books (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  status text check (status in ('want_to_read', 'reading', 'completed')) default 'want_to_read' not null,
  current_page integer default 0 not null,
  current_session_id uuid, -- References reading_sessions, added after table creation
  -- Legacy fields (kept for backward compatibility, prefer reading_sessions)
  rating integer check (rating >= 1 and rating <= 5),
  review text,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, book_id)
);

-- Reading sessions (tracks each read of a book, supports re-reads)
create table if not exists reading_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  user_book_id uuid references user_books(id) on delete cascade not null,
  read_number integer not null default 1,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  rating integer check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_book_id, read_number)
);

-- Add foreign key constraint for current_session_id after reading_sessions exists
alter table user_books
  add constraint user_books_current_session_fkey
  foreign key (current_session_id)
  references reading_sessions(id)
  on delete set null;

-- Collections (custom shelves)
create table if not exists collections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  cover_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Book collections (many-to-many)
create table if not exists book_collections (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references books(id) on delete cascade not null,
  collection_id uuid references collections(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(book_id, collection_id)
);

-- Notes (reading journal, quotes)
create table if not exists notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  content text not null,
  is_quote boolean default false not null,
  page_number integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
alter table books enable row level security;
alter table user_books enable row level security;
alter table reading_sessions enable row level security;
alter table collections enable row level security;
alter table book_collections enable row level security;
alter table notes enable row level security;

-- Books policies
create policy "Users can view their own books"
  on books for select
  using (auth.uid() = user_id);

create policy "Users can insert their own books"
  on books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on books for update
  using (auth.uid() = user_id);

create policy "Users can delete their own books"
  on books for delete
  using (auth.uid() = user_id);

-- User books policies
create policy "Users can view their own user_books"
  on user_books for select
  using (auth.uid() = user_id);

create policy "Users can insert their own user_books"
  on user_books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own user_books"
  on user_books for update
  using (auth.uid() = user_id);

create policy "Users can delete their own user_books"
  on user_books for delete
  using (auth.uid() = user_id);

-- Reading sessions policies
create policy "Users can view their own reading_sessions"
  on reading_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reading_sessions"
  on reading_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reading_sessions"
  on reading_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reading_sessions"
  on reading_sessions for delete
  using (auth.uid() = user_id);

-- Collections policies
create policy "Users can view their own collections"
  on collections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own collections"
  on collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own collections"
  on collections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own collections"
  on collections for delete
  using (auth.uid() = user_id);

-- Book collections policies
create policy "Users can view book_collections for their books"
  on book_collections for select
  using (
    exists (
      select 1 from books
      where books.id = book_collections.book_id
      and books.user_id = auth.uid()
    )
  );

create policy "Users can insert book_collections for their books"
  on book_collections for insert
  with check (
    exists (
      select 1 from books
      where books.id = book_collections.book_id
      and books.user_id = auth.uid()
    )
  );

create policy "Users can delete book_collections for their books"
  on book_collections for delete
  using (
    exists (
      select 1 from books
      where books.id = book_collections.book_id
      and books.user_id = auth.uid()
    )
  );

-- Notes policies
create policy "Users can view their own notes"
  on notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on notes for delete
  using (auth.uid() = user_id);

-- Indexes for better performance
create index if not exists books_user_id_idx on books(user_id);
create index if not exists user_books_user_id_idx on user_books(user_id);
create index if not exists user_books_book_id_idx on user_books(book_id);
create index if not exists collections_user_id_idx on collections(user_id);
create index if not exists book_collections_book_id_idx on book_collections(book_id);
create index if not exists book_collections_collection_id_idx on book_collections(collection_id);
create index if not exists notes_user_id_idx on notes(user_id);
create index if not exists notes_book_id_idx on notes(book_id);
create index if not exists reading_sessions_user_book_id_idx on reading_sessions(user_book_id);
create index if not exists reading_sessions_book_id_idx on reading_sessions(book_id);
create index if not exists reading_sessions_user_id_idx on reading_sessions(user_id);
