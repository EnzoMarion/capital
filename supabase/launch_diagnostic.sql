-- Atlas production check. Read-only: this script does not change any data or settings.
select
    t.table_name,
    t.column_name,
    t.data_type,
    t.is_nullable,
    t.column_default,
    c.is_identity,
    c.is_generated
from information_schema.columns as t
left join information_schema.columns as c
  on c.table_schema = t.table_schema
 and c.table_name = t.table_name
 and c.column_name = t.column_name
where t.table_schema = 'public'
  and t.table_name in (
      'countries', 'fr_departements', 'quiz_attempts', 'quiz_country_progress',
      'quiz_review_items', 'quizzes', 'sessions', 'users'
  )
order by t.table_name, t.ordinal_position;

select
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
      'countries', 'fr_departements', 'quiz_attempts', 'quiz_country_progress',
      'quiz_review_items', 'quizzes', 'sessions', 'users'
  )
order by tablename, policyname;

select
    p.oid::regprocedure as function_name,
    p.prosecdef as security_definer,
    p.proacl as privileges,
    pg_get_functiondef(p.oid) as function_definition
from pg_proc as p
join pg_namespace as n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_my_quiz_stats';
