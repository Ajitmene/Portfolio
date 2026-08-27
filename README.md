# Ajit Mene — Portfolio

Modern, recruiter-focused portfolio for **Ajit Mene** (Python Developer · Data
Analyst · ML Enthusiast), upgraded from the original static site into a
JSON-driven frontend with a clear migration path to a Django + DRF + MySQL
backend.

Live: https://ajitmene.github.io/Portfolio/

---

## 1. What changed from the original

The original `Portfolio.zip` was a single static `index.html` (Bootstrap 5 +
custom CSS + a small script.js) with six projects hardcoded directly into the
HTML, a broken `css/responsive.css` reference (the file didn't exist —
`style.css` already had all the media queries), and a placeholder
`mailto:your-email@example.com` link in the footer that didn't match the real
email used everywhere else on the page.

Kept as-is (it was already good):
- The dark navy (`#0F172A`) + cyan/blue (`#38BDF8` / `#2563EB`) visual
  identity, typography, hero, about, education timeline, experience timeline,
  and achievements sections.
- All real content: projects, education, experience, resume, and social
  links.

Rebuilt:
- **Projects** are no longer hardcoded HTML — they're read from
  [`data/projects.json`](data/projects.json) and rendered client-side, with
  category filtering and a details modal (see §3).
- **Certifications** now show real name/organization/date instead of a bare
  "1 Certification" stat, sourced from
  [`data/certifications.json`](data/certifications.json).
- Added a **"What I Build"**, **"Currently Learning"**, and **GitHub CTA**
  section.
- Fixed the placeholder email link, the missing `responsive.css` reference,
  and inconsistent/mislabeled "Live Demo" links that actually pointed to
  GitHub repos (see §6 — no fake demo links remain).
- Added SEO metadata (Open Graph, Twitter Card, canonical URL), a skip link,
  focus states, ARIA labels/roles on the nav, modal and progress bar, and a
  handful of small-screen CSS fixes.
- Added a **browser-based demo admin panel** (`/admin`) and a real **Django +
  DRF + MySQL backend scaffold** (`/backend`) so projects can eventually be
  managed without hand-editing HTML — see §4 for why this is two pieces, not
  one.

Nothing was invented: no fabricated metrics, GitHub stats, certifications, or
live-demo URLs. Where the original site linked "Live Demo" to a bare GitHub
profile or repo (not an actual deployed demo), that button was removed for
that project rather than left misleading.

---

## 2. Project structure

```
portfolio/
├── index.html                 # Public site (fetches data/*.json at runtime)
├── css/
│   ├── style.css              # Original design system (kept)
│   └── enhancements.css       # New: grid, filters, modal, a11y, responsive fixes
├── js/
│   ├── script.js              # Original: typed.js, theme toggle, scroll-to-top
│   └── main.js                # New: fetch + render projects, filtering, modal, nav, contact form
├── data/
│   ├── projects.json          # Single source of truth for all projects
│   └── certifications.json
├── assets/
│   ├── images/                # Project screenshots, profile photo, brochure
│   └── resume/MENE_AJIT_ANKUSH.pdf
├── admin/                     # Demo-only browser admin panel (see §4)
│   ├── index.html
│   ├── css/admin.css
│   └── js/admin.js
├── backend/                   # Django + DRF + MySQL scaffold (see §5)
│   ├── manage.py
│   ├── config/                # settings.py, urls.py, wsgi.py, asgi.py
│   ├── projects/              # models, serializers, views, admin, seed command
│   └── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. How the dynamic project system works

1. `data/projects.json` is an array of project objects (title, description,
   category, technologies, image, github/liveDemo links, featured flag,
   status, order, etc.).
2. On page load, `js/main.js` fetches that file, picks the `featured: true`
   project for the large hero-style featured block, and renders the rest into
   a responsive card grid.
3. **Filtering**: category buttons are generated from whatever categories
   exist in the data (no hardcoded list to maintain) and filter the grid
   client-side without a page reload.
4. **Details modal**: clicking "View Details" on any card opens an accessible
   modal (`Esc` to close, focus moves to the close button, backdrop click
   closes) showing the full problem/solution/features/metrics for that
   project.
5. If `metrics` is empty for a project (as it is for all six current
   projects — no verified accuracy/precision numbers were found in the
   uploaded files), the Results section simply doesn't render rather than
   showing fabricated numbers.

To add a project without touching HTML: add an object to `projects.json`
(bump `id` and `order`) — the grid, filters, and modal all update
automatically.

## 4. Two admin experiences — and why

You asked for a browser-based admin panel that can permanently add/edit/
delete projects. A **static frontend cannot do that** — JavaScript running in
a visitor's browser has no way to write to a file sitting on GitHub Pages'
servers. Pretending otherwise would silently lose every edit on refresh.

So there are two things in this repo:

- **`/admin` (demo mode, works today, zero setup)** — a fully functional
  add/edit/delete/reorder/feature-toggle UI that stores its data in
  `localStorage`, scoped to your current browser. It's genuinely useful for
  trying out the workflow and for making quick personal edits (which you'd
  then hand-copy into `data/projects.json` and commit), but it is **not**
  multi-device, not backed by a real database, and its "login" is a
  convenience gate (SHA-256 hash of a passphrase you set on first use, stored
  locally) — **not real security**. Anyone with dev-tools access to your
  browser can bypass it. The panel says this explicitly in a banner.
- **`/backend` (production-grade, requires deployment)** — a Django + Django
  REST Framework + MySQL scaffold that implements the architecture from the
  brief: public read-only API, authenticated write endpoints, a proper
  database, and Django's built-in admin site. This is the version to actually
  deploy if you want real, permanent, multi-device project management.

## 5. Django backend — what's implemented

**Models** (`backend/projects/models.py`):
- `Project` — mirrors the JSON schema (title, short_description, problem,
  solution, category, technologies/features/metrics as JSON fields, image,
  github, live_demo, featured, status, date, order).
- `Certification` — name, organization, date, link, order.
- `ContactMessage` — stores messages submitted through the public contact
  endpoint (name, email, subject, message, created_at, is_read).

**API endpoints** (`backend/projects/urls.py`, mounted at `/api/`):

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/projects/` | Public | List all projects |
| GET | `/api/projects/<id>/` | Public | Retrieve one project |
| POST | `/api/projects/` | Owner only | Create a project |
| PUT/PATCH | `/api/projects/<id>/` | Owner only | Edit a project (incl. `order`, `featured`) |
| DELETE | `/api/projects/<id>/` | Owner only | Delete a project |
| GET/POST/PUT/DELETE | `/api/certifications/` | Same pattern | Certifications |
| POST | `/api/contact/` | Public | Submit a contact form message |
| GET | `/api/contact/` | Owner only | Read submitted messages |
| `/api/auth/` | — | Browsable-API login/logout (session auth for quick testing) |
| `/admin/` | Owner only | Django's built-in admin site |

Auth uses DRF's `TokenAuthentication` + Django session auth. Create an owner
account with `createsuperuser` (see §7) and either log in via `/admin/` or
via `/api/auth/` for the browsable API; a real deployment would have the
static frontend call `/api-token-auth/`-style endpoint or session login and
attach the token to write requests.

**Database schema**: see the `Project`/`Certification`/`ContactMessage`
models above — Django migrations (`python manage.py makemigrations
projects`) generate the actual MySQL tables from these.

**Import your existing data**: `python manage.py seed_projects` reads
`data/projects.json` and `data/certifications.json` from the project root and
upserts them into the database, so the six real projects don't need to be
re-typed.

> **Note on this environment:** the backend code was written to be correct,
> idiomatic Django/DRF, but it has **not** been executed here — this sandbox
> has no network access and no MySQL server to run migrations against. Test
> it locally before deploying (steps below).

## 6. Link audit (no placeholders, no fake demos)

| Project | GitHub | Live Demo |
|---|---|---|
| Customer Churn Prediction | github.com/Ajitmene | ✅ churn-predictor-aiml.streamlit.app |
| E-Commerce Sales Dashboard | github.com/Ajitmene | — (no deployed demo; Power BI file, not hosted) |
| D-Mart Sales Analysis | github.com/Ajitmene/Dmart_Data_Analatics | — |
| Drought-Smart Crop Planner | github.com/Ajitmene | ✅ agricultural-and-farming-agent.streamlit.app |
| Blinkit Sales Analysis | github.com/Ajitmene/Blinkit_Sales_Analaysis | — |
| Toll Booth Management System | github.com/Ajitmene/Toll_Booth_Collection_System | — |

Contact email is `ajitmene04@gmail.com` everywhere (hero, contact section,
footer, social links) — the old `your-email@example.com` placeholder in the
footer is gone.

---

## 7. Local setup

### Frontend only (what most people need)
```bash
cd portfolio
python -m http.server 5500
# open http://127.0.0.1:5500
```
(A local server is required — opening `index.html` directly via `file://`
blocks the `fetch()` call to `data/projects.json` in most browsers; `main.js`
will show a friendly on-page error explaining this if it happens.)

### Backend (Django + DRF)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp ../.env.example ../.env      # then edit .env with real values
# for a quick local test without MySQL, set DB_ENGINE=sqlite in .env

python manage.py migrate
python manage.py createsuperuser
python manage.py seed_projects   # imports data/projects.json + certifications.json
python manage.py runserver
```
Visit `http://127.0.0.1:8000/api/projects/` for the public API and
`http://127.0.0.1:8000/admin/` for Django's admin.

### Database setup (MySQL, for production)
```sql
CREATE DATABASE portfolio_db CHARACTER SET utf8mb4;
CREATE USER 'portfolio_user'@'%' IDENTIFIED BY 'strong-password-here';
GRANT ALL PRIVILEGES ON portfolio_db.* TO 'portfolio_user'@'%';
FLUSH PRIVILEGES;
```
Match `DB_NAME` / `DB_USER` / `DB_PASSWORD` in `.env` to what you created.

---

## 8. Environment variables

All defined in [`.env.example`](.env.example):

| Variable | Purpose |
|---|---|
| `DJANGO_SECRET_KEY` | Django's cryptographic signing key — generate a fresh random one |
| `DJANGO_DEBUG` | `False` in production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames the backend will serve |
| `DB_ENGINE` | `mysql` (production) or `sqlite` (quick local testing only) |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | MySQL connection |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) allowed to call the API |
| `CSRF_TRUSTED_ORIGINS` | Same, for CSRF-protected requests |
| `SECURE_SSL_REDIRECT` | Force HTTPS in production |

---

## 9. Deployment notes

- **Frontend**: already deployable as-is to GitHub Pages (that's how the live
  URL works today) — it's static files that fetch JSON at runtime.
- **Backend**: deploy behind `gunicorn` (included in `requirements.txt`)
  with a real MySQL instance, `DEBUG=False`, a real `DJANGO_SECRET_KEY`, and
  `DJANGO_ALLOWED_HOSTS`/`CORS_ALLOWED_ORIGINS` set to your actual domains.
  Run `python manage.py collectstatic` before going live (Whitenoise is
  included to serve static files simply).
- Once the backend is deployed, point `js/main.js`'s `DATA_URL`/`CERTS_URL`
  at the live API (`/api/projects/`, `/api/certifications/`) instead of the
  local JSON files, and point `/admin` at the real authenticated API instead
  of `localStorage` — that's the intended migration path.

---

## 10. Files you'll touch most often

- **Add/edit a project**: `data/projects.json` (or, once deployed, the
  Django admin / API).
- **Add/edit a certification**: `data/certifications.json`.
- **Copy/content changes** (About, hero tagline, etc.): `index.html`.
- **Colors/spacing**: `css/style.css` (original design tokens) and
  `css/enhancements.css` (everything added in this pass).
- **Behavior** (filtering, modal, contact form): `js/main.js`.
- **Resume file**: replace `assets/resume/MENE_AJIT_ANKUSH.pdf` (same
  filename, or update the `href` in the hero section of `index.html`).

---

## 11. Verified before calling this done

- [x] Navigation links, smooth scroll, and mobile hamburger menu
- [x] All images load with graceful `onerror` fallback to a placeholder SVG
- [x] GitHub, LinkedIn, and `mailto:` links point to the real profiles/email everywhere (hero, contact, footer, social bar)
- [x] Resume download link works
- [x] Project filtering and details modal work without a page reload
- [x] No `your-email@example.com` or other placeholder links remain
- [x] No fabricated metrics, certifications, or live-demo URLs
- [x] `data/projects.json` and `data/certifications.json` are valid JSON
- [x] Responsive at 320/375/425/768/1024/1440px breakpoints (existing media
      queries preserved + new ones added for the filter bar, modal, and hero
      CTAs)
- [x] Admin panel clearly labeled as demo-only, with no hardcoded password
- [x] Django backend scaffold matches the JSON schema and includes a seed
      command to import existing data (written but not executed — no DB
      available in this environment; test locally per §7 before deploying)
