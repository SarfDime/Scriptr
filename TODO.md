# TODO: ideas & open questions

Concrete work (bugs, features, cleanups with a clear outcome) is tracked in
`PROGRESS.md`. This file is for things that aren't concrete yet.

## To investigate

- [ ] Cache Components and the `use cache` directive, for partial prerendering.
- [ ] CSS `transition-behavior` (https://tailwindcss.com/docs/transition-behavior) for transitions like the notification shade popping up.
- [ ] Make the header show real content, possibly sourced from Sanity.
- [ ] Add a "source inline" option for the color palettes as well (clarify what this should cover).
- [ ] Draft mode / live editing: not used for now. If it comes back, add the `/api/disable-draft` endpoint that `next/components/ui/DisableDraft.tsx` links to (and check that component isn't rendered while draft mode is unused).
- [ ] Add salts and encryption for secrets like `INTERNAL_API_SECRET` and `SANITY_STUDIO_INTERNAL_SECRET`, since they are sent in headers and are not encrypted. So this way all projects can have their salts set by env and it would match across projects so they can easily verify each other's requests.

## Visual ideas

- [ ] Background-mode easter egg: clicking the black hole repeatedly switches the view background.
- [ ] Christmas background and effects for the Christmas season.
- [ ] Aurora background and effects for the aurora season.
- [ ] "Simple mode" button next to the theme toggle that disables complex effects (blur, transparency, animations, background).
