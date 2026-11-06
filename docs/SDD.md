# Software Design Description (SDD)

**Project:** Personal Portfolio Website
**Author:** Muhammad Syahmi bin Suroo Karnieyla
**Version:** 1.0
**Date:** 2026-11-06
**Status:** Draft

Companion document to `docs/SRS.md`. This explains **how** the system is
built; the SRS explains **what** it must do.

---

## 1. Introduction

This document describes the architecture, module design, and deployment
design of the portfolio website. The reader should be able to understand the
code structure from this document alone.

## 2. System Architecture

The system is a **pure static client-side application**. There is no server
process and no persistent state.

```
visitor browser
   |
   |  loads (HTTPS)
   v
Vercel (static host)
   |  serves files from
   v
GitHub repo: SyahWZ/portfoliosyahmi  (main branch)
   |
   |  root URL "/" rewritten by vercel.json to
   v
   portfolio.html
   |
   |-- css/style.css     (all styling, animations, responsive rules)
   |-- js/script.js      (all interactivity)
   |-- assets/resume.pdf (downloadable resume)
   |-- assets/projects/  (placeholder images + swap-in README)
```

**Data flow:** there is none beyond the initial page load. All content
(personal info, skills, projects, events) is **hardcoded** in the HTML/JS.
The only runtime state is in-memory (terminal output, the generated event
rows, animation flags). Nothing is stored, nothing is sent anywhere.

## 3. Module Design

All modules live in `js/script.js`. They are independent except that they
share the DOM.

### 3.1 Navigation (nav toggle)
- **Inputs:** click on the hamburger button; click on any nav link.
- **Logic:** toggles an `--open` class on the link list and button; closes
  automatically when a link is chosen (mobile).
- **State:** none (pure class toggling).
- **SRS:** F1.

### 3.2 Scroll reveal (fade-up)
- **Inputs:** elements with class `.reveal` entering the viewport.
- **Logic:** a single `IntersectionObserver` adds an `is-visible` class;
  CSS transitions handle the fade/translate. Each element is unobserved
  after revealing (one-shot).
- **State:** per-element CSS class.
- **SRS:** F5 (titles use a separate observer, see 3.5), general polish.

### 3.3 Terminal (typewriter + command queue)
- **Components:**
  - A `Text` node + a cursor `<span>` inside a `<pre>`.
  - A **queue** and a **busy flag** so only one typing task runs at a time.
  - `typeText()` — appends one character per tick with a variable delay
    (longer after spaces/punctuation, occasional random "stutter") for a
    human feel.
  - `typeLine()` / `outputLines()` — type one line then newline; type
    several output lines back-to-back.
  - `typeCommand()` — echoes the entered command at a human typing speed.
  - `termRun(cmd)` — dispatches to the command table or a "command not
    found" line; enqueues itself.
- **Command table (in JS):** `help`, `whoami`, `skills`, `projects`,
  `contact`, plus the `clear` special case.
- **State:** the text node's data; queue array; busy flag.
- **Edge cases:** empty input ignored; `clear` empties the text node;
  commands typed during output are queued, not dropped or interleaved.
- **SRS:** F2.

### 3.4 Event stream (simulated feed)
- **Inputs:** a timer (setInterval, ~2.4 s).
- **Logic:** picks a random event from a hardcoded list, formats a row
  (current time, host, type, detail), prepends it, and trims the list to 7.
  Alert-type events get a highlight class. Seeded with 6 rows on load.
- **State:** the `<ul>` of rows (DOM only).
- **Note:** all data is fake and the panel is labelled **demo data** (NF4).
- **SRS:** F3.

### 3.5 Section title typing
- **Inputs:** a second `IntersectionObserver` on `.type-title` headings.
- **Logic:** when a heading enters view (one-shot), the original text is
  hidden (`visibility:hidden`, still reserving layout space), a temporary
  monospace span + cursor is appended and the title is typed out; after a
  short pause the temporary nodes are removed and the real title reappears.
- **Why two observers:** titles type (per 3.5) while other content fades
  (per 3.2); keeping them separate avoids coupling the two behaviours.
- **State:** per-heading (one-shot flag via unobserve).
- **SRS:** F5.

### 3.6 Gacha card flip
- **Inputs:** `IntersectionObserver` on `.gacha-card` elements.
- **Logic:** each card has a 3D "inner" wrapper with a **front** and a
  **back** face (`backface-visibility:hidden`). Initially the inner is
  rotated `rotateY(180deg)` (back, the "?" side, facing the user). On reveal,
  an `is-visible` class rotates it to `rotateY(0)`, flipping over the
  vertical axis to the front. Staggered via per-card `transition-delay`.
- **State:** per-card CSS class.
- **SRS:** F4, NF3 (reduced-motion shows the front directly).

## 4. Data Design

- **No external data store.** The site is read-only and stateless.
- **In-memory only:** terminal text, event-row list, animation flags.
- **Content source of truth:** the author's resume. Skills, experience, and
  project copy in the HTML are hand-synced from it; if the resume changes,
  the HTML must be updated to match (F8, F9, project cards).
- **Assets:** `assets/resume.pdf` (downloadable) and
  `assets/projects/*.svg` (placeholders; swap procedure in
  `assets/projects/README.md`).

## 5. Deployment Design

1. **Source control:** `git` repo, branch `main`, remote
   `https://github.com/SyahWZ/portfoliosyahmi` (public).
2. **Push:** edit → `git add .` → `git commit -m "..."` → `git push`.
3. **Vercel:** connected to the repo; on every push to `main` it re-deploys
   the static files automatically.
4. **Routing:** `vercel.json` rewrites `/` → `/portfolio.html`, so the main
   URL serves the site even though the file is not named `index.html`.
5. **Framework preset:** "Other" (no build). Output directory: `/`.

## 6. Security & Privacy Considerations

- No backend, no inputs persisted, no third-party JS → minimal attack
  surface; the main risk is a compromised font CDN, mitigated by the site
  still working without it.
- All employment-related content is **sanitized** (NF4): no internal IPs,
  no internal tool names, internal projects labelled as sanitized.
- The repo is public; nothing secret may be committed. A review step before
  `git push` confirms no sensitive data was added.

## 7. Future Work

Potential additions (not in current scope):
- Replace placeholder project images with real screenshots (procedure already
  documented in `assets/projects/README.md`).
- A blog / writing section.
- Dark/light theme toggle.
- A real contact form (would require a backend or a third-party service).
- Lightweight, privacy-respecting analytics.

## 8. File Map

```
portfolio/
  portfolio.html        # all sections, single page
  css/style.css         # theme, layout, animations, responsive
  js/script.js          # nav, terminal, event stream, title typing, flips
  vercel.json           # "/" -> "/portfolio.html" rewrite
  docs/SRS.md           # requirements (this project)
  docs/SDD.md           # this document
  assets/
    resume.pdf          # downloadable resume
    projects/           # placeholder SVGs + swap-in README
```
