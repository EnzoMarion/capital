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
    updated_at timestamp with time zone not null default now(),
    constraint quiz_review_items_user_item_key unique (user_id, item_key),
    constraint quiz_review_items_item_key_check check (length(trim(item_key)) > 0)
);

create index if not exists quiz_review_items_user_due_idx
    on public.quiz_review_items (user_id, is_correct, updated_at desc);

alter table public.quiz_review_items enable row level security;

drop policy if exists "Users can read their quiz review items" on public.quiz_review_items;
create policy "Users can read their quiz review items"
    on public.quiz_review_items for select
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their quiz review items" on public.quiz_review_items;
create policy "Users can add their quiz review items"
    on public.quiz_review_items for insert
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their quiz review items" on public.quiz_review_items;
create policy "Users can update their quiz review items"
    on public.quiz_review_items for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

grant select, insert, update on public.quiz_review_items to authenticated;
grant usage, select on sequence public.quiz_review_items_id_seq to authenticated;

notify pgrst, 'reload schema';
