# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn start          # Dev server at http://localhost:4200
yarn build          # Production build → dist/
yarn test           # Unit tests via Vitest (ng test)
yarn watch          # Build in watch mode (development config)
yarn e2e            # E2E tests via Playwright (auto-starts dev server)
```

## Verification

Before merging any change, run the full Playwright suite:

```bash
yarn e2e
```

All 3 tests must pass. The suite covers: home page empty state, EPUB import → reader,
and prev/next chapter navigation.

## Architecture

This is an Angular 21 EPUB reader using **epubjs** for rendering and **Angular Material** for UI.

**Routing:**

- `/` → `HomeComponent` (file picker, lazy-loaded)
- `/reader` → `ReaderComponent` shell with child routes (lazy-loaded)
- All other paths redirect to `/`

**State — `EpubService` (`src/app/services/epub.service.ts`):**
Singleton service that owns all epubjs state via signals: `book`, `rendition`, `toc`, `title`, `author`, `currentHref`, `isLoading`, `error`, `canGoNext`, `canGoPrev`. Computed: `hasBook`, `hasError`. Key methods: `openBook(file)`, `attachRendition(element)`, `goNext()`, `goPrev()`, `goToHref(href)`, `destroyBook()`.

**Feature components under `src/app/features/reader/components/`:**

- `reader-toolbar` — presentational; inputs: title, author, sidenavOpen; output: toggleSidenav
- `reader-viewer` — attaches epubjs rendition via `afterNextRender()`, uses ResizeObserver
- `toc-panel` — TOC list; inputs: tocItems, currentHref; output: navigateTo
- `nav-controls` — prev/next buttons; inputs: canGoPrev, canGoNext; outputs: prev, next

**Guard:** `ReaderComponent` uses an `effect()` to redirect to `/` if `epubService.hasBook()` is false.

## epubjs Integration

```typescript
import Epub, { Book, Rendition, NavItem } from 'epubjs';

// Type cast required when opening from ArrayBuffer
book.open(arrayBuffer as unknown as string);

// Promises for metadata
await book.loaded.metadata; // → { title, creator }
await book.loaded.navigation; // → { toc: NavItem[] }
```

- `allowedCommonJsDependencies: ["epubjs"]` is set in `angular.json`
- `allowSyntheticDefaultImports: true` and `esModuleInterop: true` are set in `tsconfig.json`

## Angular 21 Conventions

- Root component: `src/app/app.ts` (not `app.component.ts`); inline template
- `standalone: true` must NOT be set — it's the default in Angular v20+
- Use `afterNextRender()` for DOM access (not `ngAfterViewInit`)
- All components use `ChangeDetectionStrategy.OnPush`

## Angular Coding Standards

### TypeScript

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid `any`; use `unknown` when type is uncertain

### Angular

- Always use standalone components over NgModules
- Use signals for state management; use `update()` or `set()` — never `mutate()`
- Use `computed()` for derived state
- Implement lazy loading for feature routes
- Do NOT use `@HostBinding`/`@HostListener`; put host bindings in the `host` object of `@Component`/`@Directive`
- Use `NgOptimizedImage` for static images (does not work for inline base64)

### Accessibility

- Must pass all AXE checks
- Must follow WCAG AA minimums: focus management, color contrast, ARIA attributes

### Components

- Use `input()` and `output()` functions instead of decorators
- Prefer inline templates for small components; use external paths relative to the component TS file
- Do NOT use `ngClass` — use `class` bindings; do NOT use `ngStyle` — use `style` bindings
- Prefer Reactive forms over Template-driven

### Templates

- Use native control flow (`@if`, `@for`, `@switch`) instead of structural directives
- Use the async pipe for observables
- Do not assume globals like `new Date()` are available

### Services

- Single responsibility; `providedIn: 'root'` for singletons
- Use `inject()` instead of constructor injection
