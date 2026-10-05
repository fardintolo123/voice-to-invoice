do $$
declare
  table_to_drop record;
begin
  for table_to_drop in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('drop table if exists %I.%I cascade', table_to_drop.schemaname, table_to_drop.tablename);
  end loop;
end $$;

create table public.quote_drafts (
  id text primary key,
  quote_number text not null unique,
  transcript text,
  quote_json jsonb,
  audio_mime_type text,
  audio_bytes integer,
  pdf_generated_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index quote_drafts_created_at_idx
  on public.quote_drafts (created_at desc);

alter table public.quote_drafts enable row level security;
