-- SFC tax returns table + public tracking view
-- Powers the refund-tracking Netlify function (anon key, no PII exposed)

create table if not exists public.sfc_tax_returns (
  id                   bigint generated always as identity primary key,
  tracking_id          text unique not null,
  source_system        text,
  source_submission_id text,
  client_first_name    text,
  client_last_name     text,
  client_email         text,
  filing_status        text,
  tax_year             integer default extract(year from current_date)::integer,
  status               text not null default 'draft',
  efile_submission_id  text,
  last_error           text,
  payload              jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_sfc_tax_returns_tracking_id on public.sfc_tax_returns (tracking_id);
create index if not exists idx_sfc_tax_returns_status      on public.sfc_tax_returns (status);

alter table public.sfc_tax_returns enable row level security;

-- Only admins/tax_preparers can read raw rows — anon goes through the view
create policy "Admins can manage sfc_tax_returns"
  on public.sfc_tax_returns for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin', 'tax_preparer')
    )
  );

-- Auto-update updated_at
create or replace function public.sfc_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sfc_tax_returns_updated_at on public.sfc_tax_returns;
create trigger trg_sfc_tax_returns_updated_at
  before update on public.sfc_tax_returns
  for each row execute function public.sfc_set_updated_at();
