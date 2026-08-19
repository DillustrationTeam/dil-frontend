# AI AGENT & DEVELOPER INSTRUCTIONS - dillustration Frontend

> **CRITICAL MANDATE FOR ALL AI AGENTS & DEVELOPERS:**  
> Before generating or modifying any code in this repository, you MUST read the comprehensive architecture, design system, dual-role permissions, and API conventions guide located at:  
> 📖 [docs/00-agent-developer-guide.md](file:///d:/SEP490_Final/Web/dil-frontend/docs/00-agent-developer-guide.md)

---

## Key Core Standards:
1. **Tech Stack**: Next.js 14 (App Router `src/app`), TypeScript, Tailwind CSS v4, Zustand, Axios, React Hook Form, Zod.
2. **Design System**: **Digital Etherealism** (`#1F2335`, `#A7ACD9`, Glassmorphism `.glass-container`, `Sora` headings, `Space Grotesk` body, official `weblogo.png`).
3. **Dual-Role Model**: Users are `Client` by default. Creating a `CreatorProfile` adds `Creator` role (User holds BOTH `["Client", "Creator"]`).
4. **API Integration**: Use `apiClient` (`src/lib/api-client.ts`). Backend base URL: `http://localhost:5075/api/v1`. Unwraps `{ data, meta, error }` Envelope.
5. **Verification**: Always run `npm run build` in `dil-frontend` before declaring completion.
