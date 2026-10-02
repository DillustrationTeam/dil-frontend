# AI AGENT & DEVELOPER INSTRUCTIONS - dillustration Frontend

> **CRITICAL MANDATE FOR ALL AI AGENTS & DEVELOPERS:**  
> Before generating or modifying any code in this repository, you MUST read the comprehensive architecture, design system, dual-role permissions, and API conventions guide located at:  
> 📖 [docs/00-agent-developer-guide.md](file:///d:/SEP490_Final/Web/dil-frontend/docs/00-agent-developer-guide.md)

---

## Key Core Standards:
1. **Tech Stack**: Next.js 15 (App Router `src/app`), TypeScript, Tailwind CSS v4, Zustand, Axios, React Hook Form, Zod.
2. **Design System**: **Digital Etherealism** (`#1F2335`, `#A7ACD9`, Glassmorphism `.glass-container`, `Sora` headings, `Space Grotesk` body, official `weblogo.png`).
3. **Dual-Role Model**: Users are `Client` by default. Creating a `CreatorProfile` adds `Creator` role (User holds BOTH `["Client", "Creator"]`).
4. **API Integration**: Use `apiClient` (`src/lib/api-client.ts`). Backend base URL: `http://localhost:5075/api/v1`. Unwraps `{ data, meta, error }` Envelope.
5. **Feature-based Structure**: Code organized under `src/features/<feature>/` (components, hooks, services, store, types). Import via barrel `@/features/<feature>`.
6. **Feature Ownership**: See `docs/07-feature-ownership.md` for module assignments — respect feature boundaries to prevent Git conflicts.
7. **Verification**: Always run `npm run build` in `dil-frontend` before declaring completion.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
