-- sfc_tax_return_public_status: public-safe view for refund tracking lookups.
-- ALL PII masking is enforced here in SQL, not in the API handler.
--
-- SECURITY CONTRACT:
--   Any modification to this view requires security review.
--   Do NOT add: user_id, email, phone, notes, internal_status,
--   raw payload fields, document metadata, or internal IDs.
--
-- SECURITY DEFINER by design: anon users query this view for refund tracking.
-- anon has no direct access to sfc_tax_returns — the DEFINER privilege is required.

drop view if exists public.sfc_tax_return_public_status;

create view public.sfc_tax_return_public_status
with (security_invoker = false)
as
select
  tracking_id,

  -- Map internal statuses to user-facing values
  case status
    when 'draft'            then 'received'
    when 'pending_review'   then 'processing'
    when 'generating_forms' then 'processing'
    when 'queued_for_efile' then 'processing'
    when 'transmitted'      then 'submitted'
    when 'accepted'         then 'accepted'
    when 'rejected'         then 'action_required'
    else 'received'
  end as status,

  -- Sanitized rejection reason — never expose raw last_error
  case
    when status = 'rejected' and last_error ilike '%missing%document%'  then 'missing_documents'
    when status = 'rejected' and last_error ilike '%verification%'      then 'verification_failed'
    when status = 'rejected' and last_error ilike '%ssn%'               then 'identity_mismatch'
    when status = 'rejected' and last_error ilike '%duplicate%'         then 'duplicate_filing'
    when status = 'rejected' and last_error is not null                 then 'review_required'
    else null
  end as rejection_reason,

  created_at,
  updated_at,

  -- First name only — no full last name
  client_first_name,
  -- Last initial only
  left(client_last_name, 1) as client_last_initial

from public.sfc_tax_returns
where tracking_id is not null;

-- Anon can SELECT from the view only — no direct table access
revoke all on public.sfc_tax_return_public_status from anon, authenticated;
grant select on public.sfc_tax_return_public_status to anon;
grant select on public.sfc_tax_return_public_status to authenticated;

comment on view public.sfc_tax_return_public_status is
  'SECURITY DEFINER by design: anon users query this view for refund tracking. '
  'Exposes: tracking_id, mapped status, sanitized rejection_reason, '
  'timestamps, first name, last initial only. '
  'Does NOT expose: user_id, email, phone, notes, raw last_error, '
  'internal statuses, document metadata, or payload fields. '
  'ANY modification requires security review.';
