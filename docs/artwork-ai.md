# Artwork AI screens

- Buyer /client/commissions shows content-based recommendations and reasons from /me/artwork-recommendations. Favorites, collection saves and followed creators provide signals; cold start shows approved discovery candidates.
- Creator /creator/artworks includes a Gemini metadata assistant in the upload form. An explicit button sends the selected image; a preview displays the suggested title, description, tags and style. Applying suggestions is explicit and editable. A changed file cannot apply an older result. Manual upload remains usable if AI fails.
- Admin inspection embeds a separate Sightengine scan panel with status polling, advisory probability, provider/model/time and manual retry for Pending/Flagged artwork. No placeholder safety percentages or fabricated AI score.

Backend setup and migration: ../dil-backend/docs/10-artwork-ai.md (separate repository). Keys are server-only and never use NEXT_PUBLIC variables. Both API keys are configured in local User Secrets; they are not in source control.

## End-to-end verification — 2026-10-23

Buyer dashboard rendered a real approved recommendation with a cold-start discovery reason. Pending QA artwork was excluded. Ranking/visibility/personalized-tag rules are covered by 43 deterministic AI checks.

Gemini live UI returned Vietnamese title/description and 10 tags for a public documentation photo. Apply populated editable fields without creating an artwork. API rejected invalid bytes and >5 MB files with 400; unauthenticated recommendations return 401 and client-only metadata access returns 403. Metadata rate limit returns 429 after six requests in the window.

An 11 MB padded valid image completed normal upload -> durable worker -> Sightengine genai -> Succeeded (score 0.001). Original hash/size unchanged. Admin inspection displayed the score as 0.1%; the artwork remained Pending and its AI declaration was unchanged. Admin retry succeeded, immediate retry was blocked (400), creator retry denied (403), and the second scan succeeded. Owner-only scan reads also return 403 to outsiders.

Fixed misleading legacy inspection display encountered during testing: unknown resolution/size now show missing data, absent tags no longer display sample tags, stored tags do not claim AI extraction, and the AI declaration does not claim verified detection. Verified the final display using an empty-tag QA record. Production webpack build and scoped ESLint pass; 270 backend regression checks pass (43 AI + 73 creator + 154 workflow). QA artwork soft-deleted and uploaded copy removed after verification. Screenshots and API report saved under workspace outputs/artwork-ai-e2e-*.

## Creator scan visibility

Saving an artwork (not selecting a local file) queues synthetic-image detection. Creator portfolio cards now reuse ArtworkScanPanel in compact mode with an owner-authorized status read, polling every five seconds while queued/processing/retrying. The card shows terminal outcomes, actual provider score/time and a short advisory notice. Legacy artworks without scans explicitly show NotRequested. API read errors include a reload action; creators are not given the admin rescan action.

New uploads reset portfolio filters so the newly saved Pending artwork is visible. Save confirmation explains where to follow the scan. A single terminal toast is emitted for uploads/image replacements saved during the current page session; previously scanned works loaded from history do not generate completion toasts. Notification tracking is cleared after delivery. Card identity includes image URL so image replacement cannot display an old scan while fetching the new result.
