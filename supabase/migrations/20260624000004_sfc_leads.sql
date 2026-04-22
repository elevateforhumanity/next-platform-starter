-- Supersonic Fast Cash — canonical intake spine
-- sfc_leads: every form on the SFC site writes one row
-- sfc_documents: uploaded files attach to a lead

create table if not exists public.sfc_leads (
  id                       uuid        primary key default gen_random_uuid(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  first_name               text        not null,
  last_name                text        not null,
  email                    text        not null unique,
  phone                    text,
  preferred_contact_method text        default 'phone' check (preferred_contact_method in ('phone','email','text')),
  source                   text        not null default 'website' check (source in ('calculator','service_page','contact','state_page','book_appointment','start','upload','referral','website')),
  source_detail            text,
  utm_campaign             text,
  utm_medium               text,
  service_type             text        check (service_type in ('tax_prep','refund_advance','bookkeeping','payroll','diy','audit_protection','cash_advance')),
  state                    text,
  filing_status            text        check (filing_status in ('single','married_joint','married_separate','head_of_household')),
  income_range             text        check (income_range in ('under_25k','25k_50k','50k_75k','75k_100k','over_100k')),
  refund_estimate          numeric(10,2),
  has_1099                 boolean,
  has_dependents           boolean,
  dependents_count         int,
  needs_refund_advance     boolean,
  status                   text        not null default 'new' check (status in ('new','contacted','docs_pending','docs_received','in_preparation','filed','completed','lost')),
  appointment_id           uuid,
  notes                    text
);

create index if not exists idx_sfc_leads_status     on public.sfc_leads(status);
create index if not exists idx_sfc_leads_source     on public.sfc_leads(source);
create index if not exists idx_sfc_leads_created_at on public.sfc_leads(created_at desc);
create index if not exists idx_sfc_leads_service    on public.sfc_leads(service_type);

create table if not exists public.sfc_documents (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  lead_id      uuid        not null references public.sfc_leads(id) on delete cascade,
  file_url     text        not null,
  file_name    text,
  file_type    text,
  file_size    bigint,
  doc_category text        check (doc_category in ('w2','1099','id','ssn_card','prior_return','other')),
  uploaded_at  timestamptz not null default now()
);

create index if not exists idx_sfc_documents_lead_id on public.sfc_documents(lead_id);

alter table public.sfc_leads     enable row level security;
alter table public.sfc_documents enable row level security;

drop policy if exists sfc_leads_admin_read     on public.sfc_leads;
drop policy if exists sfc_documents_admin_read on public.sfc_documents;
drop policy if exists sfc_leads_admin_write    on public.sfc_leads;

create policy sfc_leads_admin_read on public.sfc_leads
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin','staff'))
  );

create policy sfc_documents_admin_read on public.sfc_documents
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin','staff'))
  );

create policy sfc_leads_admin_write on public.sfc_leads
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin','staff'))
  );

create or replace function public.sfc_leads_set_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sfc_leads_updated_at on public.sfc_leads;
create trigger sfc_leads_updated_at
  before update on public.sfc_leads
  for each row execute function public.sfc_leads_set_updated_at();
