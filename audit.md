# Audit — BookMark Reading List App

Date: 2026-10-26
Scope: Full source review of the current BookMark reading-list app (React + TypeScript + Vite, single-page, browser-only persistence).

---

## 1. Overview

BookMark is a single-page React app that lets a user maintain a personal reading list. Each book has a title and one of three statuses: _Want to Read_, _Reading_, or _Finished_. The list is persisted in the browser via `localStorage`. There is no backend, no authentication, and no network calls.

**Source files reviewed**
- `src/App.tsx` — entire UI, state, and persistence logic
- `src/main.tsx` — React root mount
- `src/index.css` — global styles and CSS variables
- `index.html` — page shell
- `vite.config.ts` — build config
- `package.json` — dependencies and scripts

---

## 2. Security

### 2.1 Findings

| # | Severity | Finding | Detail |
|---|----------|---------|--------|
| S1 | Low | No user-input sanitization needed for XSS | Titles are rendered as text content via React (`{book.title}`), which auto-escapes. No `dangerouslySetInnerHTML`, no `innerHTML`, no `eval`. XSS risk is negligible. |
| S2 | Info | No authentication / no backend | The app is fully client-side. There is no API surface to protect. Acceptable for the intended personal-use scope. |
| S3 | Info | `localStorage` is unauthenticated | Anyone with access to the browser profile can read/modify the list. Not a vulnerability for this use case, but worth noting if the app ever stores sensitive data. |
| S4 | Low | No external dependencies that phone home | Dependencies are limited to `react`, `react-dom`, and dev tooling (`vite`, `typescript`, types). No analytics, trackers, or third-party scripts. |
| S5 | Info | No CSP or security headers configured | Out of scope for a client-only Vite app, but if deployed behind a host, a Content-Security-Policy header should be added to harden against injection. |

### 2.2 Verdict

No security vulnerabilities identified. The app's attack surface is minimal because it handles no secrets, makes no network requests, and renders all user input as escaped text.

---

## 3. Data Integrity & Persistence

| # | Severity | Finding | Detail |
|---|----------|---------|--------|
| D1 | Low | No schema versioning in `localStorage` | `loadBooks()` parses stored JSON and only checks `Array.isArray`. If the stored shape changes in a future version (e.g. adding an author field), old data will still load but may lack fields. Recommend a versioned key (e.g. `reading-list-books:v1`) or a shape validation. |
| D2 | Low | Silent failure on storage errors | Both `loadBooks()` and `saveBooks()` swallow exceptions in empty `catch` blocks. If `localStorage` is full or disabled (e.g. private mode in some browsers), the user gets no feedback — the app silently behaves as if empty. Consider surfacing a warning. |
| D3 | Info | Duplicate detection is case-insensitive and trimmed | Good. Prevents near-duplicate entries. |
| D4 | Info | Title length capped at 60 characters | Reasonable guardrail against accidental long input. |
| D5 | Low | IDs generated from `Date.now()` + `Math.random()` | Sufficient for a single-user local list. Not collision-resistant under rapid batch adds, but acceptable here. |

---

## 4. Code Quality

| # | Severity | Finding | Detail |
|---|----------|---------|--------|
| C1 | Medium | All logic in a single 720-line file | `App.tsx` contains types, state, event handlers, all icons, and a large inline `styles` object. It works, but is hard to navigate and test. Splitting into modules (e.g. `icons.tsx`, `styles.ts`, `useBooks.ts`, `BookCard.tsx`) would improve maintainability. |
| C2 | Low | Inline `styles` object instead of CSS modules / styled components | Functional, but means no hover/focus states are defined via CSS — buttons rely on inline transitions only. Some buttons lack visible focus styles, which affects keyboard users. |
| C3 | Info | Types are well-defined | `ReadingStatus`, `Book`, `FilterOption` are explicitly typed. No `any` usage. Good. |
| C4 | Info | `useMemo` used appropriately | `filteredBooks` and `counts` are memoized correctly with correct dependencies. |
| C5 | Low | Dropdown menu has no keyboard/escape handling | The status dropdown closes on backdrop click, but there is no `Escape` key handler or focus trap. Keyboard-only users may have trouble operating it. |
| C6 | Low | No `aria-expanded` on the menu toggle button | The "more options" button controls a dropdown but doesn't expose its expanded state to assistive tech. |
| C7 | Info | `StrictMode` is enabled | Good for catching side-effect bugs in development. |

---

## 5. Accessibility

| # | Severity | Finding | Detail |
|---|----------|---------|--------|
| A1 | Medium | No visible focus styles on buttons | Buttons have no `:focus` or `:focus-visible` styling. Keyboard navigation will not clearly show which element is focused. |
| A2 | Medium | Dropdown menu not keyboard-accessible | No `Escape` to close, no `aria-expanded`, no arrow-key navigation, no focus management. |
| A3 | Low | Book cards lack semantic role | Each card is a plain `div`. Using a `list`/`listitem` structure (or `role="list"`) would convey the list semantics to screen readers. |
| A4 | Low | Status filter buttons don't indicate selection via ARIA | Active state is conveyed only by color. Adding `aria-pressed` would make the active filter explicit. |
| A5 | Info | Inputs have labels | The title input has `aria-label="Book title"`. Delete buttons have `aria-label="Delete book"`. Good baseline. |
| A6 | Info | Color contrast appears sufficient | Status badge text on badge backgrounds, and primary text on white, meet WCAG AA contrast ratios based on the defined CSS variables. |

---

## 6. Performance

| # | Severity | Finding | Detail |
|---|----------|---------|--------|
| P1 | Info | Bundle is tiny | Only React + ReactDOM in dependencies. No heavy libraries. Build output is small. |
| P2 | Info | No unnecessary re-renders | State updates are scoped; memoization is used for derived data. |
| P3 | Low | `saveBooks` runs on every `books` change | The `useEffect` writes the full list to `localStorage` on every mutation. Fine for a small list; could debounce for very large lists. |
| P4 | Info | Animations use CSS `@keyframes` | Lightweight, GPU-friendly `opacity`/`transform` animations. No JS-driven animation loops. |

---

## 7. Responsiveness

| # | Severity | Finding | Detail |
|---|----------|---------|--------|
| R1 | Info | Container max-width 720px, centered | Layout adapts to mobile and desktop. |
| R2 | Info | Fluid type via `clamp()` on the title | Scales gracefully across viewports. |
| R3 | Low | Filter bar relies on horizontal scroll on small screens | `overflowX: auto` is set, but on narrow phones some filters may be off-screen. Wrapping (already enabled via `flexWrap`) largely mitigates this. |

---

## 8. Build & Tooling

| # | Severity | Finding | Detail |
|---|----------|---------|--------|
| B1 | Info | Standard Vite + React + TS setup | Clean, conventional. |
| B2 | Info | Build script runs `tsc -b && vite build` | Type-checks before bundling. Good. |
| B3 | Low | No linter or formatter configured | No ESLint or Prettier config present. Adding them would keep style consistent as the project grows. |
| B4 | Info | `dist/` is committed | The `dist/` folder appears in the project. If this is a Bolt-managed build output, that's expected; otherwise it should be gitignored. |

---

## 9. Summary of Recommendations

Prioritized, actionable items:

1. **(A1, A2)** Add visible `:focus-visible` styles and keyboard/`Escape` support to the status dropdown.
2. **(C1)** Split `App.tsx` into focused modules once the file grows further.
3. **(D1)** Version the `localStorage` key or validate the stored shape, to future-proof migrations.
4. **(D2)** Surface a user-visible warning when storage writes fail instead of swallowing errors silently.
5. **(A3, A4)** Add list semantics and `aria-pressed`/`aria-expanded` for clearer screen-reader support.
6. **(B3)** Add ESLint + Prettier for consistent style.

None of the findings are blocking. The app is functionally correct, secure for its intended scope, and reasonably well-built. The main gaps are in **keyboard accessibility** and **future-proofing of local storage**, both of which are common in lightweight client-only apps.
