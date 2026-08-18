# 3DPRICE

> **From 3D model to a real print quote.**

3DPRICE is a modern 3D-printing quotation engine for turning STL, OBJ and 3MF models into practical production estimates using real slicing data.

**Upload → Preview → Configure → Slice → Price → Quote**

## Production deployment

The recommended production architecture is deliberately split into two layers:

```text
                         GitHub
                           │
                    GitHub Actions
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
       Cloudflare Worker          GitHub Pages
        + static assets             fallback
             │
       same-origin /api
             │
             ▼
       FastAPI / CuraEngine
             │
             ▼
        G-code analysis
```

### Cloudflare production

The repository contains a Cloudflare Worker that:

- serves the compiled Vite SPA as static assets
- provides SPA fallback routing
- proxies `/api/*` to the private/production FastAPI origin
- keeps browser requests same-origin, avoiding frontend CORS complexity
- can sit behind a custom domain and Cloudflare TLS/CDN

Deployment is automated by `.github/workflows/deploy-cloudflare.yml`.

Configure these **GitHub repository variables/secrets**:

| Name | Type | Purpose |
|---|---|---|
| `BACKEND_ORIGIN` | Variable | Public HTTPS origin of FastAPI/CuraEngine |
| `VITE_API_URL` | Variable | Optional direct API URL; normally leave empty |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Cloudflare account identifier |
| `CLOUDFLARE_API_TOKEN` | Secret | Scoped Cloudflare deployment token |

For the recommended setup, leave `VITE_API_URL` empty. The frontend calls `/api/slice`, and the Worker forwards it to `BACKEND_ORIGIN`.

### GitHub Pages fallback

`.github/workflows/deploy-pages.yml` provides an on-demand Pages deployment of the frontend. It is useful as a fallback/demo host, but the slicer API still needs to be reachable separately because GitHub Pages cannot run FastAPI or CuraEngine.

## Application architecture

```text
Browser
  │
  ▼
React + TypeScript + Vite + Three.js
  │
  ├── local  → Vite /api proxy → localhost:8000
  │
  └── production → Cloudflare Worker /api
                              │
                              ▼
                     FastAPI + CuraEngine
                              │
                              ▼
                         G-code analysis
                              │
                              ▼
                      Material + print time
                              │
                              ▼
                       Cost calculation
                              │
                              ▼
                           Quote
```

The browser remains responsible for model visualization and interaction. CuraEngine remains authoritative for sliced print time and material consumption.

## What it is

3DPRICE is intentionally more than a calculator UI. The product is built around one focused workflow: make the model visible, make the print settings understandable, use the slicer for production data, and make the final price explainable.

### Current product

- Interactive Three.js model workspace
- STL / OBJ / 3MF upload and drag & drop
- Orbit, zoom and pan
- Model dimensions
- Grid, studio lighting and solid / wireframe presentation
- Layer height, infill, walls and automatic support controls
- PLA / PETG / ABS / TPU
- Material, machine, labor and markup cost model
- CuraEngine slicing through FastAPI
- Sliced print time and filament usage
- Customer price calculation
- Commercial landing page and responsive UX

## Local development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server proxies `/api/*` to `http://localhost:8000` automatically.

If you want to call a remote slicer API directly instead, create `frontend/.env.local`:

```env
VITE_API_URL=https://your-slicer-api.example.com
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

CuraEngine must be available in `PATH`, or configured with `CURA_ENGINE`.

## Cloudflare deployment

1. Create a Cloudflare API token with the minimum Workers deployment permissions required for the target account.
2. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets.
3. Add `BACKEND_ORIGIN` as a GitHub Actions repository variable, for example `https://api.example.com`.
4. Leave `VITE_API_URL` empty unless you intentionally want direct browser-to-backend calls.
5. Push to `main` or manually run **Deploy 3DPRICE** from GitHub Actions.
6. Attach your custom domain to the `3dprice` Worker in Cloudflare.

The Worker should be treated as the public edge/API gateway. The FastAPI/CuraEngine service should remain on a normal server/container capable of running native slicing workloads.

## Product direction

The commercial experience is deliberately centered on the pricing workflow rather than printer-profile management.

### Next

- [ ] Slice / layer visualization
- [ ] Quote history
- [ ] PDF quotations
- [ ] Customer records
- [ ] Orders
- [ ] Payments
- [ ] Production queue
- [ ] Admin dashboard
- [ ] Printer profiles when they become useful to the pricing workflow

## Pricing model

```text
material cost
     +
machine cost
     +
labor
     +
delivery (when enabled)
     ↓
base production cost
     ↓
profit markup
     ↓
customer price
```

## Project status

**Active development — moving from a functional quotation MVP toward a production-ready 3D-printing quotation and ordering platform.**

## License

License information will be added before the production release.
