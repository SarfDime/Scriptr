# Security Policy

## Reporting a vulnerability

Do not open a public issue. Use GitHub's private vulnerability reporting on the
[Security tab](https://github.com/this repository/security/advisories/new).

Include the affected route or file, reproduction steps, and the impact you believe it
has. Please give a reasonable window to fix the issue before disclosing it.

## Scope

The production deployment and the `main`, `main-api` and `main-sanity` branches.
A local Supabase stack built from `hono/supabase/config.toml`, and the placeholder
values in the `.env.example` files, are not production and are out of scope.
