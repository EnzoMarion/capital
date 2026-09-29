alter table public.quiz_attempts
    add column if not exists is_complete boolean not null default false;

-- Preserve the complete legacy quiz records that can be identified reliably.
update public.quiz_attempts
set is_complete = true
where quiz_key in ('personnalise', 'france_departements', 'france_regions')
  and not is_complete;

-- Make PostgREST pick up the new column immediately.
notify pgrst, 'reload schema';
