# 3DPRICE

> **From 3D model to a real print quote.**

3DPRICE is a modern 3D-printing quotation engine for turning STL, OBJ and 3MF models into practical production estimates using real slicing data.

**Upload → Preview → Configure → Slice → Price → Quote**

## What it is

3DPRICE is intentionally more than a calculator UI. The product is built around one focused workflow: make the model visible, make the print settings understandable, use the slicer for the production data, and make the final price explainable.

The current frontend is a commercial product experience around the existing quotation engine. It includes:

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
- Responsive commercial landing page
- Product positioning, workflow explanation, business section, roadmap and CTA

## Architecture

```text
                    3DPRICE
                       │
          ┌────────────┴────────────┐
          │                         │
   Commercial frontend         Slicer backend
          │                         │
 React + TypeScript          FastAPI + CuraEngine
 Vite + Three.js                     │
          │                           ▼
          └──────────────►      G-code analysis
                                      │
                                      ▼
                              Material + time
                                      │
                                      ▼
                               Cost calculation
                                      │
                                      ▼
                                  Quote
```

The browser is responsible for visualization and interaction. CuraEngine remains the authoritative source for sliced print time and material consumption.

## Product direction

The commercial experience is deliberately centered on the pricing workflow rather than printer-profile management.

### Current

- [x] Interactive 3D workspace
- [x] STL / OBJ / 3MF support
- [x] Model dimensions
- [x] Print configuration
- [x] CuraEngine slicing
- [x] G-code based time and material usage
- [x] Transparent price model
- [x] Commercial product landing experience
- [x] Responsive layout

### Next

- [ ] Slice / layer visualization
- [ ] Quote history
- [ ] PDF quotations
- [ ] Customer records
- [ ] Orders
- [ ] Payments
- [ ] Production queue
- [ ] Admin dashboard
- [ ] Multiple printer profiles when they become useful to the pricing workflow

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

## Local development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set the slicer API when it is not running locally:

```bash
VITE_API_URL=https://your-slicer-api.example.com
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

CuraEngine must be available in `PATH`, or configured with `CURA_ENGINE`.

## Project status

**Active development — commercial frontend redesign in progress.**

The project is being developed from a functional quotation MVP toward a production-ready 3D-printing quotation and ordering platform.

## License

License information will be added before the production release.
