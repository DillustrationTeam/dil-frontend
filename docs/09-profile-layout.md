# Profile layout

Creator profiles (`/creators/[id]`) and the owner's personal profile (`/profile`) share `ProfileLayout` and `ProfileTabs`.

The layout uses a full-width cover, overlapping circular avatar, left identity column, and right tab content. It keeps the existing navy/periwinkle palette. On mobile the columns stack and tabs scroll horizontally. The workspace sidebar is omitted only on profile routes.

Creator tabs show real rate packages, portfolio artwork, and customer reviews. A rate package card opens the existing commission request modal; users select the package inside that form. Closed creators or creators without available slots cannot open a request. Related artists remain below the main content. An explicit profile banner is preferred, then the first portfolio image; users without a banner get a decorative CSS cover. Initials represent avatars because the current profile DTO has no avatar field.

The personal profile is owner-only and shows real commission records, saved albums and liked artwork. It reuses `Collections` with `embedded` and `mode` props, preserving the standalone `/collections` page. Album privacy and likes remain unchanged. No public/private profile visibility switch is offered because the backend has no such setting. Creator owners can edit via `/creator-setup`; personal accounts have no fake edit button.

Both navigation menus link to `/profile`. Tabs support arrow keys, Home and End, with ARIA tab/panel associations. Verification: production build, targeted ESLint, real browser desktop/mobile checks for both layouts and all tabs.
# Marketplace navigation fixes (2026-10-04)

Creator profile reads are public; follow, commissioning and profile writes remain authenticated. The owner's edit action links to `/creator/profile/edit`, preloads `/creator/me`, preserves slots, and saves via PUT `/creator/me`. Empty optional fields can be cleared.

Home `#bento` groups approved public artworks by their real tags (case-insensitive), with counts and a reset filter. Artwork links use a public-layout intercepted route and the existing detail modal. Back/Forward preserves the originating page, filters and scroll; Escape/close dismisses the modal. Hard reload/direct artwork URLs retain the standalone page. The modal slot has explicit null routes for home and other public navigation so it cannot linger over a creator profile.

### Regression audit (2026-10-04)

- Nested artwork/commission dialogs share an ownership-based body scroll lock. Closing both through Back restores scrolling regardless of cleanup order; closing only the inner dialog retains the outer lock.
- Dialog keyboard handlers use the latest close callback without rerunning focus setup. Commission dialogs trap focus and restore the opener on dismissal.
- Artwork loaders discard stale responses on ID changes or unmount and reset creator metadata before loading the next artwork.
- Profile create/edit forms validate optional HTTP(S) URLs (500 characters), location (200), and slots (0–100); empty URLs remain valid for clearing fields.
- Run `node scripts/check-profile-regressions.cjs` for 26 regression assertions. Manual UI checks cover Anime filtering, Back/Forward, nested dialogs and Escape.
