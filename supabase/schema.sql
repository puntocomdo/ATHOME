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

-- Words (edited from the admin "Words" page). Already created in your project.
create table if not exists words (
  id bigint generated always as identity primary key,
  lang text not null default 'en',
  grade int not null,
  unit int not null default 1,
  week int not null default 1,
  school text not null default '',      -- blank = every school
  word text not null,
  definition text not null default '',
  sentence text not null default '',
  photo text not null default '',       -- file name in public/photos, or a full web address
  sight boolean not null default false, -- true = no photo, show the sentence with a blank
  active boolean not null default true,
  updated bigint
);
create unique index if not exists words_unique on words (lang, grade, unit, week, word, school);
create index if not exists words_lookup on words (grade, lang);
alter table words enable row level security;
