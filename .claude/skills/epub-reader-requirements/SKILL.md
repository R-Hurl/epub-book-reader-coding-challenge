---
name: epub-reader-requirements
description: "Generate concise, well-structured feature requirement documents for the EPUB Book Reader project. Use this skill whenever the user wants to plan, spec out, define, or document a new feature, enhancement, or change to the EPUB reader — including changes to EpubService, reader components (toolbar, viewer, TOC panel, nav controls), routing, Angular Material UI, accessibility, or epubjs integration. Trigger when the user says things like 'I want to add...', 'let's build...', 'I'm thinking of a feature...', 'write up requirements for...', or 'help me spec out...'. The output is a focused requirements doc purpose-built for handing to Claude Code in Plan mode."
---

# EPUB Reader Requirements Skill

Read `~/.claude/skills/requirements/SKILL.md` and follow its workflow, output format, and quality
guidance exactly. The Architecture Reference below replaces the generic architecture context in that
skill — use it instead of asking the user about the codebase.

---

## Architecture Reference

This is an Angular 21 EPUB reader using **epubjs** for rendering and **Angular Material** for UI.

**Routing** (`src/app/app.routes.ts`):
- `/` → `HomeComponent` — file picker landing page (lazy-loaded)
- `/reader` → `ReaderComponent` shell with child routes (lazy-loaded)
- All other paths redirect to `/`

**State — `EpubService`** (`src/app/services/epub.service.ts`):
- Singleton service owning all epubjs state via Angular signals
- Signals: `book`, `rendition`, `toc`, `title`, `author`, `currentHref`, `isLoading`, `error`, `canGoNext`, `canGoPrev`
- Computed: `hasBook`, `hasError`
- Key methods: `openBook(file)`, `attachRendition(element)`, `goNext()`, `goPrev()`, `goToHref(href)`, `destroyBook()`

**Feature components** (`src/app/features/reader/components/`):
- `reader-toolbar` — presentational; inputs: `title`, `author`, `sidenavOpen`; output: `toggleSidenav`
- `reader-viewer` — attaches epubjs rendition via `afterNextRender()`, uses `ResizeObserver`
- `toc-panel` — TOC list; inputs: `tocItems`, `currentHref`; output: `navigateTo`
- `nav-controls` — prev/next buttons; inputs: `canGoPrev`, `canGoNext`; outputs: `prev`, `next`

**Home** (`src/app/features/home/`):
- `HomeComponent` — file picker that calls `epubService.openBook(file)` then navigates to `/reader`

**Guard**: `ReaderComponent` uses an `effect()` to redirect to `/` if `epubService.hasBook()` is false.

**epubjs Integration**:
- Import: `import Epub, { Book, Rendition, NavItem } from 'epubjs'`
- `book.open(arrayBuffer as unknown as string)` — type cast required
- `await book.loaded.metadata` → `{ title, creator }`
- `await book.loaded.navigation` → `{ toc: NavItem[] }`

**Angular 21 Conventions**:
- Root component: `src/app/app.ts` (inline template, not `app.component.ts`)
- `standalone: true` NOT set (default in v20+)
- Use `input()`, `output()`, `signal()`, `computed()`, `inject()`
- `afterNextRender()` for DOM access (not `ngAfterViewInit`)
- `ChangeDetectionStrategy.OnPush` on all components
- Native control flow: `@if`, `@for`, `@switch`
- No `@HostBinding`/`@HostListener` — use `host` object instead
- No `ngClass`/`ngStyle` — use `class`/`style` bindings

**Accessibility**: Must pass AXE checks and meet WCAG AA (focus management, color contrast, ARIA).

---

## Project-Specific Example

**User says**: "I want to add bookmarks so readers can save their place."

**Good requirements doc**:

```markdown
# Feature: Bookmarks

## Goal
Readers have no way to save their place in a book between sessions. Add a bookmark system so
users can mark and return to specific locations without losing progress.

## Affected Components
- `src/app/services/epub.service.ts` — add bookmark signals and methods; persist to localStorage
- `src/app/features/reader/components/toc-panel/` — add bookmarks tab or section alongside TOC
- `src/app/features/reader/components/reader-toolbar/` — add bookmark toggle button for current location

## Acceptance Criteria
- [ ] User can bookmark the current reading location via a toolbar button
- [ ] Bookmarked locations are saved to localStorage keyed by book identifier
- [ ] Bookmarks list is accessible from the side panel alongside the TOC
- [ ] Clicking a bookmark navigates to that location
- [ ] User can delete individual bookmarks
- [ ] Bookmarks persist across page reloads

## Constraints
- Follow existing signal-based state pattern in `EpubService`
- Use `input()` / `output()` functions — no decorator-based inputs
- Toolbar button must meet WCAG AA contrast and have an accessible label
- Do not use `ngClass` or `ngStyle`

## Non-Goals
- Cloud sync or cross-device bookmark sharing
- Annotations or highlights (text selection)
- Bookmark export/import

## Notes / Assumptions
- epubjs exposes `rendition.currentLocation()` for the current CFI; use this as bookmark key
- Book identifier can be derived from `book.key()` or the file name
- localStorage is sufficient; no backend needed
```
