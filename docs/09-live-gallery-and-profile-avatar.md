# Live gallery, search and avatar

The homepage uses approved artwork data from the API. Its slideshow starts with the most-viewed artwork, randomizes ties, rotates every six seconds, and offers previous/next/select/pause controls. Reduced-motion users do not get automatic rotation. Artwork links open the existing detail modal. The artwork list, creator directory and totals use fetched records instead of placeholder content.

Header searches submit to `/explore?q=...`; Explore initializes its filter from this query and filters titles, descriptions, tags and creator names. The public header has a search form on smaller screens as well. Studio and alternate site-header searches use the same destination.

`/profile` and `/profile/me` offer direct avatar upload and save. JPG/PNG/WebP files up to 5MB use the authenticated `/uploads/profile-avatar` endpoint and then update the profile. The auth store updates after a successful save so navigation avatars refresh too. Existing avatar data is retained on errors. This path uses the project's local storage service and does not require Cloudinary.

Verified locally: frontend/backend production compilation passed; browser search for Cyber and Linh Nguyen returned their matching artwork; slideshow next changed the selected artwork and paused automatic rotation. Authenticated PNG upload returned a readable JPEG; profile save/reload persisted its URL, then the demo profile was restored. Guest upload returned 401. Frontend lint has no errors in changed files, with three existing warnings.
