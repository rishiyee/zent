# Implementation Instructions for Claude Code

## Constraint: shadcn/ui Only

When implementing this feature, only use **shadcn/ui components and blocks/layouts** for the UI. Do not introduce custom-built components, other component libraries, or one-off styled elements when a shadcn equivalent exists.

## Rules

1. **Components** — Use shadcn/ui primitives (e.g., `Table`, `Dialog`, `Dropdown Menu`, `Select`, `Input`, `Button`, `Badge`, `Tabs`, `Card`, `Command`, `Checkbox`, `Popover`, `Calendar`/`Date Picker`) instead of writing custom markup for things these already solve.
2. **Blocks/Layouts** — Where shadcn provides pre-built blocks (e.g., data table blocks, dashboard layouts, sidebar layouts), use those as the starting structure rather than building the layout from scratch.
3. **No new dependencies** — Do not pull in other UI/component libraries (e.g., MUI, Ant Design, Chakra) or hand-roll equivalents of components shadcn already provides.
4. **Styling** — Use Tailwind utility classes consistent with shadcn's conventions (CSS variables for theming, existing design tokens) rather than introducing custom CSS or inline styles.
5. **Extending, not replacing** — If a shadcn component doesn't fully cover a need, extend/compose it (e.g., wrap it, add props) rather than replacing it with a custom-built alternative.
6. **Icons** — Use `lucide-react` (shadcn's default icon set) for consistency.
7. **If something is genuinely missing** — If no shadcn component or block fits, flag it explicitly before building a custom one, rather than silently introducing a non-shadcn solution.

## Why

Keeping the implementation strictly within shadcn/ui ensures visual and structural consistency across the app, avoids duplicated/conflicting design systems, and keeps the codebase easier to maintain and extend going forward.
