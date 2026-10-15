# TODO: ideas & open questions

Concrete work (bugs, features, cleanups with a clear outcome) is tracked in
`PROGRESS.md`. This file is for things that aren't concrete yet.

## To investigate

- [ ] Cache Components and the `use cache` directive, for partial prerendering.
- [ ] CSS `transition-behavior` (https://tailwindcss.com/docs/transition-behavior) for transitions like the notification shade popping up.
- [ ] Make the header show real content, possibly sourced from Sanity.
- [ ] Add a "source inline" option for the color palettes as well (clarify what this should cover).
- [ ] Draft mode / live editing: not used for now. If it comes back, add the `/api/disable-draft` endpoint that `next/components/ui/DisableDraft.tsx` links to (and check that component isn't rendered while draft mode is unused).

## Visual ideas

- [ ] Background-mode easter egg: clicking the black hole repeatedly switches the view background.
- [ ] Christmas background and effects for the Christmas season.
- [ ] Aurora background and effects for the aurora season.
- [x] "Simple mode" button next to the theme toggle that disables complex effects (blur, transparency, animations, background). Done: `SimpleModeToggle` in the navbar, state in `ThemeProvider`, CSS under `:root[data-simple]` in `components.module.css`. Opaque surfaces only cover `ui-above*`; one-off `bg-*/NN` classes elsewhere stay translucent.

## Next 
- [ ] Do not show explicit errors like ap/scirpts.. whatever to users, users should only see nicely formatted user facing errors, also improve error pages, maybe add some sort of graphic and make them take up the whole available space, maybe add a spaceman floating, it's in theme with the background.