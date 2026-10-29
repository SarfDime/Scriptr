-- `profiles.avatar_url` is a full public URL, used directly as an image source
-- on cached pages (comments, script cards, the header, the profile page) and,
-- since avatars bypass the Next.js image optimizer, from whatever host it names.
-- It is written only by `POST /profiles/me/avatar`, with the internal
-- (service-role) client: the optimizer crops and converts the photo, stores it
-- in the bucket at `avatars/{userId}.webp`, and builds the URL from
-- `R2_PUBLIC_URL`.
--
-- Left writable by the caller, any signed-in user could point their profile at
-- an arbitrary URL that every visitor's browser then loads. Least privilege:
-- take the privilege away. The service-role client is unaffected by a revoke
-- from `anon`/`authenticated`.
--
-- A column-level `REVOKE ... (avatar_url)` alone would be a no-op if the role
-- holds the table-wide privilege (the Supabase default), because table and
-- column privileges are tracked separately. So the table grant is dropped and
-- the columns the API actually writes are granted back: `PATCH /profiles/me`
-- and `PATCH /profiles/:id` both write only `username` and `full_name`
-- (`updateProfile` in `hono/src/routes/profiles.ts`).
--
-- INSERT is revoked with it: nothing inserts a profile with a user's own
-- credentials (registration and the signup trigger create the row as the
-- service role), and a table-wide INSERT would reopen the same hole by letting
-- a caller insert a row with a chosen `avatar_url`.
--
-- `select` is untouched, so profile reads are unaffected.
revoke update, insert on public.profiles from anon, authenticated;

grant update (username, full_name) on public.profiles to authenticated;

-- Belt and braces, in case a column grant exists without the table grant.
revoke insert (avatar_url), update (avatar_url)
  on public.profiles from anon, authenticated;
