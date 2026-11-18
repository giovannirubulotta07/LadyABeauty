-- Client area: the client's own preferences (lash effect, curl, length,
-- brow style…), shown to Alessia in the client file before each visit.
-- Free text, kept short; health details are discussed in person (the form
-- says so), so this column holds no special-category data.
alter table public.clients
  add column preferences text
    check (preferences is null or char_length(preferences) <= 600);

-- Clients may edit it on their own row (RLS own_row_update already applies).
grant update (preferences) on public.clients to authenticated;
