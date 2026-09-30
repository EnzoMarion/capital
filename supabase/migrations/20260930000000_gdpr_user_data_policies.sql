-- Keep private account tables inaccessible unless the row belongs to the signed-in user.
do $$
declare
    target_table text;
    existing_policy record;
begin
    foreach target_table in array array['quizzes', 'quiz_country_progress'] loop
        if to_regclass(format('public.%I', target_table)) is not null then
            execute format('alter table public.%I enable row level security', target_table);

            for existing_policy in
                select policyname
                from pg_policies
                where schemaname = 'public' and tablename = target_table
            loop
                execute format('drop policy %I on public.%I', existing_policy.policyname, target_table);
            end loop;

            execute format(
                'create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
                'Atlas users manage their own rows', target_table
            );
            execute format('grant select, insert, update, delete on table public.%I to authenticated', target_table);
        end if;
    end loop;

    if to_regclass('public.fr_departements') is not null then
        execute 'alter table public.fr_departements enable row level security';
        execute 'grant select on table public.fr_departements to anon, authenticated';
        for existing_policy in
            select policyname
            from pg_policies
            where schemaname = 'public' and tablename = 'fr_departements'
        loop
            execute format('drop policy %I on public.fr_departements', existing_policy.policyname);
        end loop;
        execute 'create policy "Atlas public French geography read" on public.fr_departements for select to anon, authenticated using (true)';
    end if;
end;
$$;
