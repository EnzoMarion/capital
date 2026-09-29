alter table public.quiz_attempts
    add column if not exists scope_key text not null default 'global';

alter table public.quiz_attempts
    add column if not exists scope_label text not null default 'Toutes les questions';

-- Assign legacy complete records to a stable scope so they remain visible.
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

-- Floor the percentage so a score with one or more errors cannot display 100%.
drop function if exists public.get_my_quiz_stats();
alter table public.quiz_attempts drop column percent;
alter table public.quiz_attempts
    add column percent integer generated always as (
        floor(score::numeric * 100 / total_questions)::integer
    ) stored;

create index if not exists quiz_attempts_key_scope_user_idx
    on public.quiz_attempts (quiz_key, scope_key, user_id);

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
        where a.user_id = (select auth.uid())
          and a.is_complete
        group by a.quiz_key, a.scope_key
    ),
    my_best_ranked as (
        select a.quiz_key, a.scope_key, a.scope_label, a.percent, a.score, a.total_questions,
               row_number() over (
                   partition by a.quiz_key, a.scope_key
                   order by a.percent desc, a.created_at desc
               ) as row_number
        from public.quiz_attempts as a
        where a.user_id = (select auth.uid())
          and a.is_complete
    ),
    my_best as (
        select quiz_key, scope_key, scope_label,
               percent as best_percent, score as best_score, total_questions as best_total
        from my_best_ranked
        where row_number = 1
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
          on players.quiz_key = mine.quiz_key
         and players.scope_key = mine.scope_key
        group by mine.quiz_key, mine.scope_key
    )
    select mine.quiz_key, best.scope_key, best.scope_label, mine.attempt_count,
           best.best_percent, best.best_score, best.best_total,
           comparison.player_count, comparison.players_below
    from my_attempts as mine
    join my_best as best
      on best.quiz_key = mine.quiz_key
     and best.scope_key = mine.scope_key
    join comparison
      on comparison.quiz_key = mine.quiz_key
     and comparison.scope_key = mine.scope_key;
$$;

revoke all on function public.get_my_quiz_stats() from public;
grant execute on function public.get_my_quiz_stats() to authenticated;

notify pgrst, 'reload schema';
