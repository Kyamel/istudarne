# Design system

The interface follows an **Obsidian-like "matte utility"** direction:

- near-neutral gray surfaces separated by *small tonal steps*, not strong
  borders or shadows;
- a **single violet accent** (`#7c3aed`) reserved for selection, focus, links
  and primary actions;
- subtle radii (6–12px), soft shadows, no gradients or glassmorphism;
- functional typography, information-dense sidebars, low ornamentation —
  almost everything on screen communicates state or triggers an action.

Semantic colors (danger/warning/success) are desaturated, editor-style tones
and are never the only cue: correct/wrong states always ship with text.

## Tokens

`app/styles/tokens.css` is the single source of truth. Light values live on
`:root`, dark values on `:root[data-theme="dark"]`. The SPA toggles
`document.documentElement.dataset.theme` and persists it in
`localStorage["istudarne-theme"]`.

| Token group | Purpose |
| --- | --- |
| `--bg`, `--surface`, `--surface-muted`, `--surface-raised`, `--surface-tint` | tonal ladder: page, cards, sidebar, inputs |
| `--text`, `--text-muted`, `--text-soft` | foreground hierarchy |
| `--border`, `--border-strong` | hairline separators |
| `--primary(-hover/-soft)` | the violet accent |
| `--secondary(-soft)` | neutral tag/metadata tone |
| `--danger/warning/success(-soft)` | semantic states |
| `--shadow`, `--shadow-lg`, `--focus-ring`, `--radius-sm/md/lg` | elevation, focus, radii |

## Tailwind mapping

`app/styles/app.css` imports Tailwind v4 and maps the tokens with
`@theme inline`, so utilities resolve to the runtime CSS variables (this is
what makes theme switching instant):

| Utility | Token |
| --- | --- |
| `bg-canvas`, `bg-surface`, `bg-surface-muted`, `bg-surface-raised`, `bg-surface-tint` | backgrounds |
| `text-fg`, `text-fg-muted`, `text-fg-soft` | foregrounds |
| `border-edge`, `border-edge-strong` | borders |
| `bg-primary`, `text-primary`, `bg-primary-soft`, … | accent + semantic colors |
| `rounded-field`, `rounded-card`, `rounded-panel` | radii (sm/md/lg) |
| `shadow-pop`, `shadow-card`, `shadow-modal` | elevation |
| `desktop:` | custom breakpoint at 900px (sidebar layout switch) |

The default Tailwind palette is disabled (`--color-*: initial`) — only tokens
plus `white`, `black` and `transparent` exist, so nobody can drift off-palette.

## Component rules

- **All styling lives in `app/components/`.** Pages compose base components
  and pass props; a page should not contain a hand-styled `<div>`.
- CSS Modules were removed; components use Tailwind utility classes composed
  with `cx()` (`app/lib/classes.ts`).
- Create a new base component when a visual pattern repeats or has semantic
  meaning (e.g. `QuizOption`, `ChatBubble`). Don't wrap single-use trivial
  markup just to avoid a tag — pragmatism beats dogma.

The library is organized in four categories (mirroring Obsidian's docs), one
folder each; everything is re-exported by `app/components/index.ts`:

| Category | Purpose | Components |
| --- | --- | --- |
| `containers/` | layout and grouping surfaces | `Page`, `PageHeader`, `Panel`, `Stack`, `Row`, `ContentGrid`, `MetricsGrid`, `CenterActions`, `SplitActions`, `CenteredScreen`, `CenteredCard`, `FormCard`, `ResultCard`, `ResultMetrics`, `SimpleList`, `ListItem`, `CheckList`, `ChatLog`, `QuizCard`, `MetricCard` |
| `navigation/` | moving around the app | `NavItem`, `Tabs`, `ButtonLink`, `Brand`, `BrandMark`, `SkipLink`, `CommandPalette` |
| `controls/` | inputs and actions | `Button`, `IconButton`, `Field`, `FileField`, `ChoiceFieldset`, `RadioChoice`, `LanguageSwitcher`, `ThemeToggle`, `QuizOption`, `ChatComposer` |
| `feedback/` | status, identity and information | `StatusMessage`, `StatusTag`, `Loading`, `MetricSkeleton`, `ProgressBar`, `AnswerFeedback`, `Pill`, `TagRow`, `VisibilityTag`, `Muted`, `Eyebrow`, `Avatar`, `AccountBadge`, `ChatBubble`, `BootScreen`, `Backdrop` |

## Command palette

`CommandPalette` (`app/components/CommandPalette.tsx`) mirrors Obsidian's
palette: `Ctrl/Cmd+K` or `Ctrl/Cmd+P` toggles it, typing filters commands,
arrows + Enter navigate, Escape closes. Commands are plain
`{ id, label, keywords?, hint?, run }` objects supplied by the shell
(`app/App.tsx`) — to add a command, append to the `commands` array there.

## Accessibility

Focus is always visible (global `:focus-visible` ring using `--focus-ring`),
interactive targets keep ≥40px height, forms use real labels/legends, state
tags pair color with text, and `prefers-reduced-motion` disables transitions.
