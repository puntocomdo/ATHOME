-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.
create table if not exists accounts (
  id text primary key,          -- request code, like AB12-CD34
  parent text, contact text, child text,
  grade int, school text,
  status text default 'pending', -- pending | approved | rejected
  created bigint, approved bigint, exp bigint,
  reason text,
  username text unique,
  token text
);
create table if not exists progress (
  username text primary key,
  grade int, school text,
  data jsonb,
  updated bigint
);
-- Nobody can read these tables from the browser. Only your server, using the service key, can.
alter table accounts enable row level security;
alter table progress enable row level security;
