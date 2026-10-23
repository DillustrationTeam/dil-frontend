# Milestone add-ons

Follow-up fixes (2026-10-23): Workroom keeps milestone detail when applying summary responses from both terms acceptance and escrow deposit. Add-on presence suppresses the empty-chat placeholder. Booking previews include each selected extra in its first allowed stage. The artwork interception page uses its own route params to avoid reading the creator profile's ID. Removed the unused Sparkles import from Workroom. The earlier browser payment review block is a testing limitation, not evidence of a payment defect; insufficient balance remains covered by service checks.

CreatorAddonManager is shared by the Studio services manager and legacy rate-card editor. It loads the system presets, accepts custom names and stages, validates whole-VND prices/extensions with Zod, supports editing/enabling/disabling offers and optional package scope. Save a new rate card before assigning an add-on to its package.

CreateCommissionModal loads active offers and filters by selected package and available milestone categories. Selected IDs are sent to booking; the server calculates prices. The displayed estimate includes extras after license multiplication. Extras are funded with the full order after creator acceptance.

WorkroomAddons renders proposal cards within the chat scroll area. A native dialog offers only current-stage add-ons, with ad-hoc input for the creator. Only the client sees payment/reject controls. A successful action reloads the commission, updating the existing price/escrow widgets. Participants' cards and order summary refresh every 8 seconds while visible; the timer pauses requests while the proposal dialog is open. API errors remain visible and actions are disabled in flight. Server-side validation is authoritative if the stage changes while a dialog is open.

Stage mapping matches the backend: first = Sketch, last = Final, intermediate = Lineart; one-stage packages support Sketch/Any. Previously proposed Any extras are still bound to their proposal sequence.

The develop dependencies include qrcode and @types/qrcode. Default .next output contains obsolete generated route types from before develop moved pages. Verification uses a separate NEXT_DIST_DIR and a temporary TypeScript exclusion for old build caches, with `npm run build -- --webpack`; the original tsconfig is restored afterwards. Turbopack could not start its CSS worker in this environment. Add-on components and the booking modal pass targeted ESLint checks.

## Creator Studio display and configuration (2026-10-23)

Services uses package-first tabs with a separate add-on catalog/editor. Custom add-ons allow multiple milestone checkboxes, stored as a comma-separated set, or Any exclusively. System presets retain platform restrictions. Booking and Workroom use the same membership helper. Each package milestone exposes 0–20 included revisions (default 3), also shown in the booking plan. Existing order limits remain unchanged when a creator edits the rate card.

Studio overview at /creator/commissions follows the provided dashboard layout: real revenue summary, Escrow held across creator commissions, wallet balance, available slots, revenue chart with 7/30/90-day ranges and source breakdown, latest requests and recent workrooms. Existing detailed revenue remains at /creator/dashboard.

Verified: webpack production build, scoped ESLint, desktop/mobile UI, revision count save/reload, custom Sketch+Lineart save/reload (demo configuration restored), 131 backend workflow assertions, 26 pricing assertions and 9 SQL transaction assertions.

Dashboard error handling: requests, orders, balance and slots load independently with explicit error states and per-section retry. Failed loads never display an empty-list message or a zero count. Owned add-ons retain removed package scope during edits/toggles; the editor labels removed packages explicitly. New or changed package assignments still require a valid saved package.
