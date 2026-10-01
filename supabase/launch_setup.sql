-- Atlas production fixes based on launch_diagnostic.sql and the current app code.
-- Run in Supabase SQL Editor as project owner. Wrapped in a transaction: an error rolls everything back.

begin;

-- Add the personal revision table used by the app's export, revision and account-deletion flows.
create table if not exists public.quiz_review_items (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    item_key text not null,
    quiz_key text not null,
    scope_label text not null default 'Toutes les questions',
    question_type text not null,
    subject_group text not null check (subject_group in ('pays', 'france')),
    subject_code text not null,
    subject_label text not null,
    correct_answer text not null,
    is_correct boolean not null default false,
    updated_at timestamptz not null default now(),
    constraint quiz_review_items_user_item_key unique (user_id, item_key),
    constraint quiz_review_items_item_key_check check (length(trim(item_key)) > 0)
);
create index if not exists quiz_review_items_user_due_idx
    on public.quiz_review_items (user_id, is_correct, updated_at desc);
alter table public.quiz_review_items enable row level security;
revoke all privileges on table public.quiz_review_items from public, anon, authenticated;
grant select, insert, update, delete on table public.quiz_review_items to authenticated;
grant usage, select on sequence public.quiz_review_items_id_seq to authenticated;
drop policy if exists "Users can read their quiz review items" on public.quiz_review_items;
drop policy if exists "Users can add their quiz review items" on public.quiz_review_items;
drop policy if exists "Users can update their quiz review items" on public.quiz_review_items;
drop policy if exists "Atlas users manage their own rows" on public.quiz_review_items;
create policy "Atlas users manage their own rows"
    on public.quiz_review_items for all to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- Align score metadata defaults and preserve known complete legacy records.
alter table public.quiz_attempts
    alter column scope_key set default 'continents:tous|territoires:exclus|questions:99999';
update public.quiz_attempts
set is_complete = true
where quiz_key in ('personnalise', 'france_departements', 'france_regions')
  and not is_complete;
update public.quiz_attempts
set scope_key = case quiz_key
        when 'france_departements' then 'tous-les-departements'
        when 'france_regions' then 'toutes-les-regions'
        when 'personnalise' then 'quiz-personnalise-ancien'
        else 'continents:tous|territoires:exclus|questions:99999'
    end,
    scope_label = case quiz_key
        when 'france_departements' then 'Tous les départements'
        when 'france_regions' then 'Toutes les régions'
        when 'personnalise' then 'Quiz personnalisé'
        else 'Tous les continents'
    end
where scope_key = 'global';
create index if not exists quiz_attempts_key_scope_user_idx
    on public.quiz_attempts (quiz_key, scope_key, user_id);

-- Replace the old seven-column function. It currently lets anon execute and has no cohort threshold.
drop function if exists public.get_my_quiz_stats();
create function public.get_my_quiz_stats()
returns table (
    quiz_key text,
    scope_key text,
    scope_label text,
    attempt_count bigint,
    best_percent integer,
    best_score integer,
    best_total integer,
    player_count bigint,
    players_below bigint
)
language sql
stable
security definer
set search_path = ''
as $$
    with my_attempts as (
        select a.quiz_key, a.scope_key, count(*)::bigint as attempt_count
        from public.quiz_attempts as a
        where a.user_id = (select auth.uid()) and a.is_complete
        group by a.quiz_key, a.scope_key
    ),
    my_best_ranked as (
        select a.quiz_key, a.scope_key, a.scope_label, a.percent, a.score, a.total_questions,
               row_number() over (
                   partition by a.quiz_key, a.scope_key
                   order by a.percent desc, a.created_at desc
               ) as row_number
        from public.quiz_attempts as a
        where a.user_id = (select auth.uid()) and a.is_complete
    ),
    my_best as (
        select quiz_key, scope_key, scope_label,
               percent as best_percent, score as best_score, total_questions as best_total
        from my_best_ranked where row_number = 1
    ),
    player_best as (
        select a.quiz_key, a.scope_key, a.user_id, max(a.percent)::integer as best_percent
        from public.quiz_attempts as a
        where a.is_complete
        group by a.quiz_key, a.scope_key, a.user_id
    ),
    comparison as (
        select mine.quiz_key, mine.scope_key,
               count(players.user_id)::bigint as player_count,
               count(*) filter (where players.best_percent < mine.best_percent)::bigint as players_below
        from my_best as mine
        join player_best as players
          on players.quiz_key = mine.quiz_key and players.scope_key = mine.scope_key
        group by mine.quiz_key, mine.scope_key
    )
    select mine.quiz_key, best.scope_key, best.scope_label, mine.attempt_count,
           best.best_percent, best.best_score, best.best_total,
           case when mine.quiz_key like 'personnalise%' or comparison.player_count < 6
                then null else comparison.player_count end,
           case when mine.quiz_key like 'personnalise%' or comparison.player_count < 6
                then null else comparison.players_below end
    from my_attempts as mine
    join my_best as best
      on best.quiz_key = mine.quiz_key and best.scope_key = mine.scope_key
    join comparison
      on comparison.quiz_key = mine.quiz_key and comparison.scope_key = mine.scope_key;
$$;
revoke all on function public.get_my_quiz_stats() from public, anon, authenticated;
grant execute on function public.get_my_quiz_stats() to authenticated;

notify pgrst, 'reload schema';
commit;
