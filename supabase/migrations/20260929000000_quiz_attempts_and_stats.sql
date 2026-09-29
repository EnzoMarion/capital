create table if not exists public.quiz_attempts (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    quiz_key text not null check (length(trim(quiz_key)) > 0),
    score integer not null check (score >= 0),
    total_questions integer not null check (total_questions > 0 and score <= total_questions),
    percent integer generated always as (round(score::numeric * 100 / total_questions)::integer) stored,
    created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_key_created_idx
    on public.quiz_attempts (user_id, quiz_key, created_at desc);
create index if not exists quiz_attempts_key_user_idx
    on public.quiz_attempts (quiz_key, user_id);

alter table public.quiz_attempts enable row level security;

drop policy if exists "Read own quiz attempts" on public.quiz_attempts;
create policy "Read own quiz attempts"
    on public.quiz_attempts for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Insert own quiz attempts" on public.quiz_attempts;
create policy "Insert own quiz attempts"
    on public.quiz_attempts for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

grant select, insert on public.quiz_attempts to authenticated;
grant usage, select on sequence public.quiz_attempts_id_seq to authenticated;

create or replace function public.get_my_quiz_stats()
returns table (
    quiz_key text,
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
        select a.quiz_key, count(*)::bigint as attempt_count
        from public.quiz_attempts as a
        where a.user_id = (select auth.uid())
        group by a.quiz_key
    ),
    my_best_ranked as (
        select a.quiz_key, a.percent, a.score, a.total_questions,
               row_number() over (partition by a.quiz_key order by a.percent desc, a.created_at desc) as row_number
        from public.quiz_attempts as a
        where a.user_id = (select auth.uid())
    ),
    my_best as (
        select quiz_key, percent as best_percent, score as best_score, total_questions as best_total
        from my_best_ranked
        where row_number = 1
    ),
    player_best as (
        select a.quiz_key, a.user_id, max(a.percent)::integer as best_percent
        from public.quiz_attempts as a
        group by a.quiz_key, a.user_id
    ),
    comparison as (
        select mine.quiz_key,
               count(players.user_id)::bigint as player_count,
               count(*) filter (where players.best_percent < mine.best_percent)::bigint as players_below
        from my_best as mine
        join player_best as players on players.quiz_key = mine.quiz_key
        group by mine.quiz_key
    )
    select mine.quiz_key, mine.attempt_count, best.best_percent, best.best_score, best.best_total,
           comparison.player_count, comparison.players_below
    from my_attempts as mine
    join my_best as best on best.quiz_key = mine.quiz_key
    join comparison on comparison.quiz_key = mine.quiz_key;
$$;

revoke all on function public.get_my_quiz_stats() from public;
grant execute on function public.get_my_quiz_stats() to authenticated;
