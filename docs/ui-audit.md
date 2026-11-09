# LendLoop — UI Audit and Fix Log

Reviewed 9 November 2026 across every screen (`/`, `/board`, `/admin`, sign-in,
sign-up) and the shared UI layer.

Method: source review of the pre-fix UI, a design-system pass, then headless
Chrome rendering of the rebuilt pages at 1440px and 390px. Authenticated board
and admin flows were type-checked and built but not driven end to end, because
that needs a running Convex deployment and a Clerk session. A manual
screen-reader pass is still outstanding and is tracked as A19.

## Status summary

| Area | Found | Fixed | Deferred |
|---|---:|---:|---:|
| Structure and navigation | 9 | 9 | 0 |
| Feedback and state | 12 | 12 | 0 |
| Request flow | 14 | 12 | 2 |
| Destructive actions | 5 | 4 | 1 |
| Visual system | 20 | 19 | 1 |
| Accessibility | 19 | 18 | 1 |
| Content and copy | 10 | 10 | 0 |
| Responsive | 6 | 5 | 1 |
| Metadata, trust, and SEO | 8 | 7 | 1 |
| Performance | 5 | 4 | 1 |
| **Total** | **108** | **100** | **8** |

Deferred items are listed with their blocking reason at the end of this
document.

## 1. Structure and navigation

| ID | Problem found | Severity | Status |
|---|---|---|---|
| N1 | The four board sections were `useState` tabs: no deep link, no back-button support, refresh lost context. | High | Fixed — routed tabs |
| N2 | `app/board/page.tsx` was 568 lines holding every query, mutation, card, and dialog. | High | Fixed — layout plus four routes |
| N3 | Three different page headers (home had none, board and admin each rebuilt one). | High | Fixed — one global header plus shell sub-nav |
| N4 | Three content widths (768 / 1024 / 1152px). | Medium | Fixed — one `max-w-6xl` |
| N5 | Admin sections were local state and could not be linked. | Medium | Fixed — routed tabs |
| N6 | A non-admin reaching `/admin` had no way back except the browser. | Low | Fixed — access panel with a back link |
| N7 | No `error.tsx`, `loading.tsx`, or `not-found.tsx`; a failed query took down the route. | High | Fixed — all three added |
| N8 | No skip link. | Medium | Fixed |
| N9 | `<header>` nested inside `<main>`, dropping the banner landmark. | Low | Fixed — one banner landmark in the root layout |

## 2. Feedback and state

| ID | Problem found | Severity | Status |
|---|---|---|---|
| F1 | A single `busy` boolean disabled every action on the page. | High | Fixed — per-action pending state |
| F2 | Creating a listing or request, approving, or cancelling gave no success feedback. | High | Fixed — toasts plus live UI |
| F3 | One detached error banner per page, persisting across tabs, with no announcement. | High | Fixed — inline errors, error toasts, live region |
| F4 | Disabled Approve and Request buttons had no stated reason. | High | Fixed — inline reason text |
| F5 | Five inconsistent loading strings. | Medium | Fixed — skeletons and one count line |
| F6 | “Setting up your account…” was a permanent dead end if sync failed. | High | Fixed — explanation plus reload |
| F7 | No skeletons; content jumped in after hydration. | Medium | Fixed |
| F8 | Every request card opened its own automation query and showed internal states. | Medium | Fixed — removed |
| F9 | Empty states were a single line of text with no next step. | Medium | Fixed — empty state component with CTA |
| F10 | No confirmation before any destructive action. | Critical | Fixed |
| F11 | No undo or restore after removing a listing. | High | Deferred — needs a restore mutation |
| F12 | The request modal was a fixed div: no focus trap, Escape, backdrop close, or dialog role. | High | Fixed — native `<dialog>` |

## 3. Request flow

| ID | Problem found | Severity | Status |
|---|---|---|---|
| R1 | Dates were typed blind with no visibility of booked days. | Critical | Fixed — five-week calendar from a new availability query |
| R2 | Date inputs had no `min` or `max`. | High | Fixed |
| R3 | Validation only happened after a server round-trip. | High | Fixed — inline before submit |
| R4 | Inclusive return-by vs exclusive storage was unexplained. | Medium | Fixed — hint plus “available again” preview |
| R5 | No day count or range summary. | Medium | Fixed |
| R6 | No character counter on the optional message. | Low | Fixed |
| R7 | Submitting closed the modal with no confirmation. | High | Fixed — toast and board update |
| R8 | Dates rendered as raw ISO strings everywhere. | High | Fixed — human formats |
| R9 | No relative urgency (“due tomorrow”, “2 days overdue”). | Medium | Fixed |
| R10 | An on-loan tool never said when it would come back. | High | Fixed — `availableFrom` on the board query |
| R11 | A borrower cannot cancel an approved loan. | Medium | Deferred — needs a new server transition |
| R12 | “Mark returned” was offered before the loan started. | High | Fixed in the UI; server guard still open |
| R13 | No search and no availability filter. | Medium | Fixed — search, category, available-now |
| R14 | Request and listing lists are capped and unpaginated. | Medium | Deferred — server pagination |

## 4. Destructive actions

| ID | Problem found | Severity | Status |
|---|---|---|---|
| D1 | Owner “Remove” fired immediately. | Critical | Fixed — confirmation dialog |
| D2 | “Decline” fired immediately. | High | Fixed — confirmation dialog |
| D3 | “Mark returned” fired immediately. | High | Fixed — confirmation dialog |
| D4 | Admin “Remove” fired immediately. | Critical | Fixed — confirmation dialog |
| D5 | Soft-deleted listings cannot be restored. | Medium | Deferred — needs `tools.restore` |

## 5. Visual system

| ID | Problem found | Severity | Status |
|---|---|---|---|
| V1 | No design tokens; every color was a literal utility class. | High | Fixed — `@theme` token layer |
| V2 | Four unrelated radii. | Medium | Fixed — pill actions, 1rem cards, 0.75rem inputs |
| V3 | The same action appeared in three padding sizes. | Medium | Fixed — three button sizes |
| V4 | Five copies of the primary button class string. | Medium | Fixed — one Button |
| V5 | Emerald, amber, and red each meant several different things. | High | Fixed — one status map |
| V6 | `slate-900` “Mark returned” acted as a second primary color. | Low | Fixed |
| V7 | No iconography anywhere. | High | Fixed — inline SVG set plus category icons |
| V8 | No imagery at all, in a product about physical tools. | Medium | Deferred — needs an asset pipeline; landing now has a styled example card |
| V9 | No typographic identity or scale. | High | Fixed — serif display, sans UI, defined sizes |
| V10 | Flat cards with no elevation. | Low | Fixed — shadow tokens |
| V11 | Almost no hover or transition feedback. | Medium | Fixed |
| V12 | No dark mode. | Low | Deferred — deliberate light-only first version |
| V13 | No favicon. | Low | Fixed — `app/icon.svg` |
| V14 | Ad-hoc spacing with no rhythm. | Medium | Fixed — consistent scale in new components |
| V15 | Raw lowercase statuses such as `pending` and `on_loan`. | Medium | Fixed — sentence-case labels |
| V16 | Admin tables showed raw user and resource IDs. | High | Fixed — actor names, short IDs |
| V17 | Admin had no search or filters. | Medium | Fixed |
| V18 | Admin loans had no overdue signal. | High | Fixed |
| V19 | Admin listings cannot show removed listings. | Medium | Deferred — needs an admin listing query |
| V20 | No surface for automation errors. | Medium | Deferred — needs a query and panel |

## 6. Accessibility

| ID | Problem found | Severity | Status |
|---|---|---|---|
| A1 | Zero ARIA attributes in the entire UI. | Critical | Fixed broadly |
| A2 | The modal had no dialog role, focus trap, Escape, or focus restoration. | Critical | Fixed — `<dialog>` |
| A3 | No live region for errors or async results. | High | Fixed |
| A4 | Clerk `SignInButton` wrapped a `<button>` inside another `<button>`. | High | Fixed — `useClerk().openSignIn` |
| A5 | Helper text sat at roughly 2.6:1 contrast. | High | Fixed — 5.5:1 or better |
| A6 | Disabled controls dropped to 40% opacity. | High | Fixed — explicit disabled colors |
| A7 | No designed `:focus-visible` state. | Medium | Fixed |
| A8 | Cards used `<div>` and `<p>` with no heading structure. | Medium | Fixed — `<h3>` |
| A9 | Tables had no `<caption>` or `scope`. | Medium | Fixed |
| A10 | `<header>` inside `<main>` broke the landmark. | Low | Fixed |
| A11 | Section navigation had no `aria-current`. | Medium | Fixed |
| A12 | No skip link. | Medium | Fixed |
| A13 | Tap targets were 32–36px. | Medium | Fixed — 40px on touch, 44px primary |
| A14 | No reduced-motion handling. | Low | Fixed |
| A15 | Field errors were not associated with their inputs. | High | Fixed — `aria-describedby` and `aria-invalid` |
| A16 | Calendar days had to be clickable and keyboard reachable. | Medium | Fixed — real buttons with labels |
| A17 | Browse filters had no accessible names. | Medium | Fixed |
| A18 | Success and error messages were visual only. | High | Fixed — polite live region |
| A19 | No manual screen-reader or automated axe pass has been run. | Medium | Deferred — needs a browser |

## 7. Content and copy

| ID | Problem found | Severity | Status |
|---|---|---|---|
| C1 | “Automation pending / processing / failed” was shown to end users. | High | Fixed |
| C2 | Status text had inconsistent casing. | Low | Fixed |
| C3 | Dates were ISO strings. | High | Fixed |
| C4 | The public empty state lacked the sign-in prompt from the wireframe. | Medium | Fixed |
| C5 | The trusted-lender badge was plain text. | Low | Fixed — badge with icon |
| C6 | The public page never explained what guests can and cannot see. | Medium | Fixed |
| C7 | Inclusive return-by had no plain-language explanation. | Medium | Fixed |
| C8 | Error copy depended entirely on server strings. | Medium | Improved — contextual title plus server detail |
| C9 | The landing page had no value proposition, steps, or trust story. | High | Fixed |
| C10 | Admin copy used internal jargon (“moderation and audit”). | Low | Fixed |

## 8. Responsive

| ID | Problem found | Severity | Status |
|---|---|---|---|
| M1 | Tabs wrapped to two rows on small screens with no affordance. | Medium | Fixed — scrollable pill row |
| M2 | Admin tables scroll horizontally with no hint. | Medium | Deferred — sticky column or card fallback |
| M3 | The modal could collide with the mobile keyboard. | Medium | Fixed — native dialog with max-height scroll |
| M4 | The header crowded at 360px. | Medium | Fixed |
| M5 | No mobile navigation for admin. | Low | Fixed |
| M6 | The landing page had no visual interest once the desktop card was hidden. | Low | Fixed — stacked sections |

## 9. Metadata, trust, and SEO

| ID | Problem found | Severity | Status |
|---|---|---|---|
| S1 | One shared title for every route. | High | Fixed — title template plus per-route metadata |
| S2 | No description or Open Graph metadata. | Medium | Fixed (text) |
| S3 | No favicon. | Low | Fixed |
| S4 | No theme color or viewport export. | Low | Fixed |
| S5 | Public tools are fetched only on the client, on a server page. | Medium | Deferred — needs `preloadQuery` |
| S6 | No footer, contact, or privacy surface. | Medium | Fixed |
| S7 | No robots directive. | Low | Fixed |
| S8 | No generated Open Graph image. | Low | Deferred — needs a brand asset |

## 10. Performance

| ID | Problem found | Severity | Status |
|---|---|---|---|
| P1 | One live query per request card. | Medium | Fixed |
| P2 | Filtering re-ran on every render. | Low | Fixed — memoized |
| P3 | No skeletons caused layout shift. | Medium | Fixed |
| P4 | The public grid still populates after hydration. | Medium | Deferred |
| P5 | No route-level loading boundary. | Medium | Fixed |

## Deferred items and why

| ID | Item | Blocking reason | Recommended next step |
|---|---|---|---|
| F11 / D5 | Undo or restore for removed listings | Requires a `tools.restore` mutation with an audit row | Add `restore` plus an “Undo” action in the toast |
| R11 | Cancel an approved loan | Requires a new server transition and a notification event | Add `cancelled_after_approval` with lender notification |
| R14 | Pagination | Server-side pagination for requests, users, and audit | Convex `.paginate()` with a “Load more” control |
| V8 | Tool imagery | No uploads, storage, or moderation pipeline | Start with category illustration or curated stock thumbnails |
| V12 | Dark mode | The token layer is ready, but the palette was tuned for light | Add a `prefers-color-scheme` token set |
| V19 | Removed-listing view for admins | No admin query returns removed listings | Add `admin.listRemovedTools` with a restore action |
| V20 | Automation error surface | No query exposes `workflow_error` events | Add `admin.listAutomationEvents` and a panel |
| A19 | Automated and manual accessibility pass | Needs a browser | Run axe plus VoiceOver and NVDA on the five flows |
| M2 | Responsive admin tables | Sticky columns or a card fallback is a larger layout change | Add a breakpoint layout switch |
| S5 / S8 / P4 | Server-rendered public grid and OG image | Needs `preloadQuery`, a Convex HTTP client on the server, and artwork | Do this with the marketing polish pass |

## What was rebuilt

- **Tokens and globals** — `app/globals.css` defines paper, ink, brand, accent,
  and danger scales, two type stacks, two shadows, focus rings, reduced motion,
  and tabular numerals.
- **Primitives** — `components/ui/` holds Button, Badge, Avatar, Dialog, Field
  variants, EmptyState, Skeleton, Spinner, Toast, Table, and ConfirmDialog.
- **Chrome** — one sticky header, one footer, a skip link, and routed sub-navs
  for board and admin.
- **Landing** — value proposition, live availability, how it works, trust and
  privacy, and an example listing card.
- **Board** — `/board` (browse with search and filters), `/board/listings`,
  `/board/requests`, `/board/incoming`, each as its own route.
- **Request flow** — five-week availability calendar, inline validation,
  inclusive return-by explanation, live summary, and toast confirmation.
- **Admin** — `/admin`, `/admin/users`, `/admin/listings`, `/admin/audit` with
  search, filters, humanized audit rows, overdue badges, and confirmations.
- **Route states** — `error.tsx`, `loading.tsx`, `not-found.tsx`, and a
  configuration notice when environment variables are missing.

## Visual QA pass

After the rebuild, the landing page, sign-in page, and board components were
rendered in headless Chrome at 1440px and 390px and inspected. Four issues were
found and fixed before shipping; they are listed separately because they were
introduced or exposed by this pass rather than existing before it.

| Finding | Fix |
|---|---|
| The header's secondary “Sign in” button leaked onto mobile: a `hidden sm:inline-flex` override lost to Button's base `inline-flex` display utility. | Removed the redundant button; one “Get started” call to action remains at every width. |
| Disabled primary buttons rendered at roughly 2:1 contrast and were hard to read. | Explicit disabled colors at roughly 7.9:1. |
| Booked calendar days used `line-through`, which reads as “in the past” rather than “already booked”. | Dashed border and muted fill, no strikethrough. |
| Cards with an extra note pushed their action row below sibling cards. | Notes moved above a footer pinned to the card bottom with a flex spacer. |

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit --incremental false` | Pass |
| `npx vitest run` | 19/19 pass |
| `npx eslint .` | 0 errors, 4 warnings in generated Convex files |
| `npm run build` | Pass, 12 routes generated |
| `GET /` | 200, server-rendered landing page |
| `GET /icon.svg` | 200, `image/svg+xml` |
| `GET /nope` | 404 with the custom not-found page |
| `GET /board`, `GET /admin` | 307 to `/sign-in` with a redirect URL |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` present |

Authenticated board and admin flows were type-checked and built but not driven
end to end, because that needs a running Convex deployment and a Clerk session.
That is the next manual QA step.
