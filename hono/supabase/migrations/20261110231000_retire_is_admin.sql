-- Retire `is_admin()`: it has been an alias of `is_owner()` since the role
-- split, kept only so nineteen older policies did not have to be rewritten.
--
-- Rewriting them by hand means reproducing each expression exactly, and a typo
-- there changes who can read or write what. This reads the live definitions out
-- of `pg_policies`, swaps the one function name, and writes them back with
-- `ALTER POLICY` — same expression, same shape, renamed call.
--
-- If anything still mentions `is_admin(` afterwards (a policy shape this script
-- does not handle), the transaction aborts instead of dropping the function the
-- policies still need.

do $$
declare
  policy record;
begin
  for policy in
    select schemaname, tablename, policyname, cmd, qual, with_check
      from pg_policies
     where schemaname = 'public'
       and (coalesce(qual, '') like '%is_admin(%'
         or coalesce(with_check, '') like '%is_admin(%')
  loop
    if policy.cmd in ('SELECT', 'DELETE') then
      execute format(
        'alter policy %I on %I.%I using (%s)',
        policy.policyname,
        policy.schemaname,
        policy.tablename,
        replace(policy.qual, 'is_admin(', 'is_owner(')
      );
    elsif policy.cmd = 'INSERT' then
      execute format(
        'alter policy %I on %I.%I with check (%s)',
        policy.policyname,
        policy.schemaname,
        policy.tablename,
        replace(policy.with_check, 'is_admin(', 'is_owner(')
      );
    else
      -- UPDATE and ALL: each clause is rewritten only when it exists, so a
      -- policy whose check was implicit keeps following its USING expression.
      if policy.qual is not null then
        execute format(
          'alter policy %I on %I.%I using (%s)',
          policy.policyname,
          policy.schemaname,
          policy.tablename,
          replace(policy.qual, 'is_admin(', 'is_owner(')
        );
      end if;
      if policy.with_check is not null then
        execute format(
          'alter policy %I on %I.%I with check (%s)',
          policy.policyname,
          policy.schemaname,
          policy.tablename,
          replace(policy.with_check, 'is_admin(', 'is_owner(')
        );
      end if;
    end if;
  end loop;
end
$$;

do $$
begin
  if exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and (coalesce(qual, '') like '%is_admin(%'
         or coalesce(with_check, '') like '%is_admin(%')
  ) then
    raise exception 'A policy still calls is_admin(); the function cannot be dropped';
  end if;
end
$$;

drop function if exists public.is_admin(uuid);
