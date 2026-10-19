-- Nothing in the API, Sanity Studio or any database function writes
-- scripts.subject_id or scripts.professor_id after creation (PATCH /scripts/:id
-- only accepts title, description and additional_reading). The UPDATE policy's
-- WITH CHECK only verifies ownership/restriction, so with these column grants
-- any author could use their JWT against the REST API to re-home a script into
-- another subject or pair it with an unrelated professor, bypassing the checks
-- POST /scripts performs. Least privilege: drop them.
revoke update (subject_id, professor_id)
  on public.scripts from authenticated;
