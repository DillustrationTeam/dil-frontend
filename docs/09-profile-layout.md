# Profile layout

Creator profiles (`/creators/[id]`) and the owner's personal profile (`/profile`) share `ProfileLayout` and `ProfileTabs`.

The layout uses a full-width cover, overlapping circular avatar, left identity column, and right tab content. It keeps the existing navy/periwinkle palette. On mobile the columns stack and tabs scroll horizontally. The workspace sidebar is omitted only on profile routes.

Creator tabs show real rate packages, portfolio artwork, and customer reviews. A rate package card opens the existing commission request modal; users select the package inside that form. Closed creators or creators without available slots cannot open a request. Related artists remain below the main content. An explicit profile banner is preferred, then the first portfolio image; users without a banner get a decorative CSS cover. Initials represent avatars because the current profile DTO has no avatar field.

The personal profile is owner-only and shows real commission records, saved albums and liked artwork. It reuses `Collections` with `embedded` and `mode` props, preserving the standalone `/collections` page. Album privacy and likes remain unchanged. No public/private profile visibility switch is offered because the backend has no such setting. Creator owners can edit via `/creator-setup`; personal accounts have no fake edit button.

Both navigation menus link to `/profile`. Tabs support arrow keys, Home and End, with ARIA tab/panel associations. Verification: production build, targeted ESLint, real browser desktop/mobile checks for both layouts and all tabs.
