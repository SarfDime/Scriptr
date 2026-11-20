# Moderation

- **Flags:** one table for scripts, users and comments (exactly one target per row). Users
  manage only their own and cannot report their own content. When five distinct reporters
  have a non-dismissed flag, every admin gets a `flag_threshold` alert; reporter identities
  are not included.
- **Resolution:** admins only (`pending → reviewed → dismissed`, with
  `reviewed_by`/`reviewed_at`); dismissing the last pending flag clears `is_flagged`.
  Flagged content stays visible.
- **Admin pages:** flags queue (status filters, restrictions, username lookup),
  suspicious-download review (`/admin/download-review`: accounts and scripts with the most
  counted downloads among the newest 2,000 `download_events`, searchable, sortable,
  paginated), rating-type and achievement-definition CRUD, the user manager
  (`/admin/users`: filtered listing over `GET /profiles`, detail, edits to
  username/name/role, delete that also removes the Auth login), and an announcement
  broadcast (`/admin/announcements`: one `announcement` notification per profile, or per
  member of one study, through `POST /admin/notifications`; an owner addresses everyone,
  a study admin only their study). Academic sync/dependency tooling is deferred at this
  scale; moderator tools are out of scope.
- **Download dedupe:** append-only `download_events` (service-role only), aggregated
  account → IP → device. The web app sends `x-device-id` from a per-browser id
  (`next/lib/device-id.ts`), so a rotated address from the same browser is not a second
  download. An author's own download is not counted (`counted: false`, nothing recorded);
  an anonymous self-download cannot be detected. A counted download bumps
  `scripts.download_count` through the atomic `increment_script_download_count` RPC, runs
  the `total_script_downloads` award check, then revalidates tags — award first, so a
  cached public profile cannot miss it.
- **Moderators** have no elevated access and no notification pipeline.
