-- The RPC intentionally remains available to signed-in users for personal progress.
-- Remove inherited/public and anonymous grants, then grant only the authenticated role.
revoke all on function public.get_my_quiz_stats() from public, anon, authenticated;
grant execute on function public.get_my_quiz_stats() to authenticated;

notify pgrst, 'reload schema';
