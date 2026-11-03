# Claude Code Project Instructions — Abhiram Portfolio Redesign

## Mission

Redesign the complete portfolio website into a premium, distinctive, cinematic/editorial portfolio for a video editor and motion designer. The objective is to help visitors quickly understand the creator's style, explore real work, and make contact.

Do not stop at an audit or recommendations. After inspecting the project and reporting any blockers, implement the redesign in the existing stack while preserving working functionality.

## Read these files and inspect the project first

1. Read this `CLAUDE.md`.
2. Read `portfolio-project-memory.md` and `CLAUDE-VISUAL-ASSETS.md` if present. If absent, create/update them based on verified project files and this instruction file.
3. Read `package.json`, `skills-lock.json`, and the installed skill `SKILL.md` files under `.claude/skills/`.
4. Inspect every relevant HTML, CSS, JS, backend, data, and config file before editing.
5. Inspect the supplied photographs and every video preview. Do not assume filenames accurately describe video content.
6. Inspect the live website with the available browser/Playwright tool if the user provides or confirms the URL. Do not assume the live deployment matches this ZIP.

## Verified project facts from the supplied `portfolio-light.zip`

- The archive passed ZIP integrity testing.
- Archive size: approximately 91.51 MB compressed; approximately 92.22 MB uncompressed.
- It contains 63 entries.
- Stack is **vanilla HTML, CSS, JavaScript + Node.js/Express (CommonJS)**. Do not migrate to React, Vite, Tailwind, TypeScript, or another framework merely to redesign the site.
- `package.json` scripts:
  - `npm start` → `node server/index.js`
  - `npm run dev` → `node --watch server/index.js`
- `server/index.js` is the Express entry point.
- Express serves `public/` as static content, `/photos`, `/videos`, and `/uploads`; `/` serves `public/index.html`; `/admin` serves `public/admin.html`.
- There are two HTML entry files: root `index.html` and `public/index.html`. The Express root route explicitly serves `public/index.html`. Root `index.html` is a separate entry and must not be deleted or merged without verifying hosting/deployment behavior.
- Main section IDs in `public/index.html`: `hero`, `services`, `work`, `about`, `clients`, `contact`.
- Main frontend files: `public/index.html`, `public/css/style.css`, `public/js/app.js`.
- Admin files: `public/admin.html`, `public/css/admin.css`, `public/js/admin.js`.
- Backend files include `server/auth.js`, `server/config.js`, `server/db.js`, `server/index.js`, `server/middleware/authMiddleware.js`, `server/routes/api.js`, `server/routes/auth.js`, and `server/storage/storageProvider.js`.
- Data files include `data/videos.json`, `data/videos.json.bak`, and `data/users.json`.
- `data/videos.json` has 10 published entries, ordered 1–10, with empty `posterUrl` fields. Treat existing names/descriptions/categories as current editable metadata, not independently verified claims about clients or outcomes.
- `public/js/app.js` contains a `PORTFOLIO_VIDEOS` array. The frontend has a hard-coded gallery data source; the CMS/API data is a separate data source unless the code is deliberately integrated. Investigate and resolve the source-of-truth issue before implementation. Do not silently assume CMS edits update the static gallery.
- The backend exposes public video retrieval and protected admin video CRUD/reorder/upload routes. Auth routes include login, session check, change password, and logout.
- Storage supports local disk and S3-compatible storage (including Cloudflare R2 configuration).
- `vercel.json` contains response headers but no explicit Express rewrite/build configuration. Verify deployment behavior instead of assuming the Express backend runs on Vercel.
- `skills-lock.json` lists accessibility, design-pipeline, design-review, frontend-design, and GSAP skills. A lockfile entry alone does not prove a skill is available; inspect actual `.claude/skills/*/SKILL.md` files and follow applicable guidance.
- The supplied `demo_portfolio.html` content appears to contain pasted design notes/integration discussion rather than a reliable, complete HTML reference implementation. Inspect it, but do not treat it as a working page or blindly copy its contents.

## Supplied assets in this ZIP

### Photographs
- `photos/about_page.png` — personal/About visual reference.
- `photos/first_page_hero.png` — hero portrait visual reference.

Use these actual photos where appropriate. Do not replace them with stock imagery or generated substitute portraits.

### Video previews
The ZIP contains preview copies only, in `videos/video-previews/`:

- `5rules final v2_preview.mp4`
- `brand_campaign_preview.mp4`
- `even_montage_preview.mp4`
- `final_promo_7_preview.mp4`
- `gym_diet_preview.mp4`
- `maa spaces_preview.mp4`
- `messi edit_2_preview.mp4`
- `podcast_demo_preview.mp4`
- `sdg2_preview.mp4`
- `show reel_motion_graphics_preview.mp4`
- `showreel_preview.mp4`

The original full-quality video files are not included in this ZIP. Do not mistake preview files for the original website playback assets. Inspect the previews, note their duration/dimensions/aspect ratio, and map them to the existing project metadata where the match is clear. Ask before changing ambiguous titles, categories, client names, or claims.

Important mismatch to investigate:
- The current HTML references `/videos/showreel.mp4`.
- `data/videos.json` references original paths such as `/videos/gym_diet.mp4`, `/videos/5rules final v2.mp4`, and others.
- Those original video files are not present at the ZIP's `videos/` root; only preview copies are present in `videos/video-previews/`.
- Do not rewrite production video URLs to preview paths or delete/replace media without checking the real local project and deployment source. Build a clear media manifest and flag missing originals.

## Design direction

- Premium, cinematic, dark editorial design with strong typography, considered whitespace, confident composition, and restrained motion.
- Blue is the preferred brand accent: `#57B9FF`. Inspect the existing design and use the accent consistently; avoid adding random colors.
- Avoid generic SaaS/developer templates, dashboard aesthetics, excessive glassmorphism, gratuitous gradients, decorative clutter, pointless 3D, and animation for animation's sake.
- The portfolio should feel like an editor's visual world: story-driven, deliberate, tactile, and memorable.
- Use the real portfolio work as the primary visual proof.
- Keep copy concise, human, specific, and credible. Do not invent metrics, clients, testimonials, awards, project outcomes, or years of experience. Verify numerical claims such as project counts before retaining them.

## Existing design ideas / user preferences to preserve as candidates

These are user-provided design directions from prior work. Reconcile them with the actual page and improve them where needed; do not blindly paste code:

- Move the “Creative Director” headline slightly left if it improves the hero composition.
- A circular blue visual element was requested in place of a previous area; no glow.
- Add a video to the right of the relevant second-section content, with balanced composition.
- Cursor direction: default black cursor; on interactive hover, transition to a subtle blurred/glass-like treatment rather than a glowing effect. Use a custom cursor only on fine-pointer devices; retain normal system cursor on touch devices. Respect reduced motion and ensure the custom cursor never obscures content or replaces keyboard focus indicators.
- A user-approved workflow-card concept: central node “STORY BY ABHI”, connected to five steps — Storytelling, Editing (Premiere Pro), Motion Design (After Effects), Visual Design (Photoshop), and Final Delivery. Adapt as native vanilla HTML/CSS/inline SVG; do not migrate the site to React for this component. Make it responsive and accessible, with restrained animation and reduced-motion fallback.

## Gallery and video behavior

- Create a verified media manifest with: source filename, preview filename, verified content summary, project title, category, aspect ratio, duration, poster path, and whether the original source file is available.
- Inspect all preview videos. If direct video inspection is unavailable, use `ffprobe` metadata and extract representative frames with `ffmpeg`; be explicit about what was actually inspected.
- Do not infer project subject/client from filename alone.
- Use poster images and lazy loading. Do not preload every full video.
- Desktop: at most one hover preview plays at a time; stop/pause when pointer leaves or another preview starts.
- Touch devices: use explicit tap-to-play; do not depend on hover.
- Pause inactive videos and avoid duplicate downloads.
- Clicking a project should open a deliberate, accessible full-project playback experience.
- Preserve aspect ratios; do not crop key content just to force uniform cards.
- Original videos must remain untouched. Any compressed/optimized derivatives belong in a separate folder and must be clearly named.
- Preview videos are for inspection/reference unless the user approves using them on the live site.

## Backend and CMS preservation requirements

Do not break:
- `/api/videos` public published-video retrieval.
- Protected admin video listing, create, update, delete, and reorder routes.
- Admin authentication/session/change-password/logout.
- Upload validation and upload handling.
- Local and S3/R2 storage behavior.
- `/admin` route and admin dashboard.
- Existing data and backup files.

Before changing the gallery architecture, identify one source of truth and document the migration plan. Preserve `data/videos.json.bak`; do not overwrite or delete backups. Back up data before any schema changes. Test public and admin flows after changes.

## Security and data handling

- Never print, copy, commit, or expose `.env` values, passwords, JWT secrets, API keys, user records, or tokens.
- Keep `.env` local and excluded from archives/version control. Use `.env.example` with placeholders only.
- Treat `data/users.json` as sensitive. Do not expose its contents in documentation or public frontend.
- Verify `.gitignore` covers `.env`, node_modules, uploads where appropriate, and generated media.
- Do not loosen authentication, CORS, upload validation, or security headers as a shortcut.
- Do not delete project data, media, backups, or user files without explicit approval.

## Implementation workflow

### Phase 1 — Audit
1. Confirm actual project root and working tree.
2. Inspect all source files and relevant skills.
3. Identify how the live website is hosted and which HTML entry is deployed.
4. Inspect the current site in a browser at desktop and mobile sizes if available.
5. Check console errors, failed requests, missing media, broken links, and layout issues.
6. Produce a concise audit and implementation plan before substantial edits.

### Phase 2 — Design and implementation
1. Redesign the complete experience, not only the hero or gallery.
2. Establish a consistent design system: typography, spacing, color, grid, responsive behavior, and motion.
3. Improve navigation, hero, services/what-I-do, work/gallery, about, clients/social proof (only verified), and contact.
4. Integrate the workflow visual only if it supports the story and does not clutter the page.
5. Use semantic HTML and maintainable CSS/JS. Avoid unnecessary dependencies.
6. Ensure mobile layouts are designed deliberately, not merely scaled down.

### Phase 3 — Quality assurance
Test at these viewport sizes:
- 1440×900
- 1366×768
- 1024×768
- 768×1024
- 390×844
- 360×800
- 320×720

Verify:
- no horizontal overflow, clipped content, or overlapping text;
- navigation and all links work;
- video loading, poster display, playback, pause, and modal behavior work;
- custom cursor is disabled on touch and does not interfere with accessibility;
- keyboard navigation and visible focus states work;
- reduced-motion preferences are respected;
- images/videos lazy-load correctly;
- no console errors or unexpected failed network requests;
- admin login, CRUD, reorder, upload, and public gallery remain functional;
- server starts using documented npm scripts.

Run available automated checks and report exactly what was and was not tested. Do not claim browser/device testing that was not performed.

## Change management and handoff

- Preserve all existing uncommitted work. Inspect `git status` before editing.
- Do not run destructive cleanup commands.
- Do not overwrite originals or remove backups.
- Do not deploy, publish, or push to GitHub unless explicitly asked.
- At completion, summarize: design changes, files changed, tests run, unresolved issues, media requiring user input, and how to run locally.
- If blocked by missing original videos, credentials, deployment configuration, or ambiguous content, continue with safe work and clearly list the blocker rather than fabricating a solution.
