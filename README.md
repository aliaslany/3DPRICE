# PrintCost V2

A two-part 3D printing quotation system:

1. **Frontend** — React/Vite, deployable on GitHub Pages.
2. **Slicer API** — FastAPI + CuraEngine, hosted on a server/container.

V2 adds real slicer integration, automatic support generation through CuraEngine settings, selectable layer height, and a customer quote/order modal.

## Why a backend is required

GitHub Pages is static hosting. A real slicer such as CuraEngine is a native C++ application that needs server-side execution. CuraEngine's official project describes it as a C++ console application for converting 3D models into printer G-code. It can be used separately or integrated into another application.

Official references:
- https://github.com/Ultimaker/CuraEngine
- https://github.com/Ultimaker/CuraEngine/wiki/Slicing

PrusaSlicer is another valid backend option and exposes a command-line interface for slicing. It also supports loading profiles from 3MF/AMF and overriding settings on the command line.

## Important

The supplied V2 code is an integration-ready production architecture, but you still need to install a compatible CuraEngine binary and a printer profile on the backend host. The exact profile should be selected for your actual printer/nozzle/filament.

For public deployment, isolate the slicer and add upload limits, authentication/rate limiting, file validation, cleanup, and persistent order storage.
