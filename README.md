# 3DPRICE

> **From 3D model to a real print quote.**

3DPRICE is a modern 3D-printing quotation engine that turns STL, OBJ, and 3MF models into practical printing estimates using real slicing data.

**Upload → Configure → Slice → Calculate → Quote**

## Features

- STL / OBJ / 3MF upload
- Interactive 3D model workspace
- Three.js rendering with orbit / zoom / pan
- Build-volume visualization
- Model dimensions
- CuraEngine slicing through FastAPI
- Sliced print-time and filament-usage calculation
- Layer height, infill, walls, supports and support-angle controls
- PLA / PETG / ABS / TPU
- Material, machine, labor, delivery and markup pricing
- Professional quote flow
- GitHub Pages-ready frontend
- Docker-ready slicer backend

## Architecture

```text
GitHub Pages
   │
   ▼
React + TypeScript + Vite + Three.js
   │
   │ POST /api/slice
   ▼
FastAPI
   │
   ▼
CuraEngine
   │
   ▼
G-code analysis
   │
   ▼
Material + time + machine cost
   │
   ▼
Customer quote
```

## Product vision

**Model → Preview → Configure → Slice → Price → Quote → Pay → Print → Deliver**

The browser handles visualization and interaction. CuraEngine remains the authoritative source for sliced print time and material consumption.

## Roadmap

### 3D workspace
- [x] Interactive Three.js viewer
- [x] Orbit / zoom / pan
- [x] Automatic model centering
- [x] Build-volume visualization
- [x] Model dimensions
- [x] Grid and studio lighting
- [x] Solid / wireframe presentation
- [ ] Slice/layer visualization

### Printer profiles
- [ ] Multiple printer profiles
- [ ] Build volume
- [ ] Nozzle
- [ ] Filament diameter
- [ ] Printer-specific speeds and temperatures
- [ ] Printer-specific Cura settings

### Business platform
- [ ] Customer records
- [ ] Quote history
- [ ] Orders
- [ ] PostgreSQL
- [ ] PDF quotations
- [ ] Payment gateway
- [ ] Admin dashboard
- [ ] Production queue

## Local development

```bash
cd frontend
npm install
npm run dev
```

The frontend uses `VITE_API_URL` for the slicer API. Default:

```text
http://localhost:8000
```

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

CuraEngine must be available in `PATH`, or configured with `CURA_ENGINE`.

## Pricing

```text
material
+ machine
+ labor
+ delivery
↓
base cost
↓
markup
↓
customer price
```

## License

License information will be added before the production release.
