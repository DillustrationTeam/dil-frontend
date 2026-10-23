# Creator assets and palettes

The asset library at /creator/assets uses persisted creator-owned data. Failed loads show an error/retry, never mock entries. Pose assets store an uploaded/reference image; palettes store 2–16 #RRGGBB colors; presets store reusable instructions/settings and optionally an image. Existing incomplete records remain visible and can be repaired with Edit.

Creators can create, edit, soft-delete, open source images, copy individual HEX values or the full content, and export JSON. Image upload reuses /artworks/image (25 MB, PNG/JPEG/WebP/GIF); it uploads an image only and does not publish an artwork record. Uploaded reference image URLs are shareable; library metadata is private to the creator.

Workroom provides a creator-only library picker. Selection appends a snapshot of the resource name, colors, notes and image URL to the existing draft, preserving existing text. The 4000-character message limit and closed-room rules still apply. Selection never sends automatically; the user reviews and presses Send using the normal chat transport. Later resource edits/deletions do not mutate previously sent snapshots.

Forms use React Hook Form and Zod; the API independently validates data and ownership. Preset text represents reusable settings/instructions; exporting JSON does not install native Photoshop/Procreate brush formats.

Validation: production webpack build, scoped ESLint, 73 backend creator checks including asset validation/persistence/ownership/deletion, 43 AI and 154 commission workflow regression checks. Browser smoke checks verify required-name validation, palette create/reload/edit/add-color and clipboard.

Additional verification: 18 frontend schema/metadata/draft checks pass via `node scripts/check-creator-assets.cjs`. Browser verified text preset creation and exact clipboard HEX contents. Live API verified the edited palette and soft-deleted only the two QA records. Workroom library button is present; end-to-end selection/send was not exercised because the demo room requires accepting terms, which was not done on the user's behalf.

## End-to-end verification (2026-10-23)

A private local Support room with demo accounts was used to exercise the same Workroom component without modifying existing commission terms. Browser tests passed: palette insertion preserves the existing draft and does not auto-send; palette, uploaded image reference and text preset send successfully; reload retains all 3 messages; Shift+Enter inserts a newline and Enter sends; over-4000-character insertion is rejected without replacing the draft; locked room disables picker/composer/send. JSON export content matches stored colors/notes. Live API checks confirm outsiders cannot read the room or edit resources, an added client participant can read all 3 snapshots, and editing/deleting the source does not change sent snapshots. QA assets, room, messages and uploaded image copy were cleaned up.

Found and fixed during this verification: the single-line input visually joined multiline resource content. The composer is now a textarea, with Enter to send and Shift+Enter for newline, preserving IME composition handling. Production webpack build and scoped ESLint pass. Re-ran 288 regression checks (73 creator, 43 AI, 154 workflow, 18 frontend asset).
