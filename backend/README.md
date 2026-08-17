# PrintCost V2 slicer API

This service is intentionally separate from GitHub Pages. A static GitHub Pages site cannot execute a native C++ slicer.

The API wraps CuraEngine. CuraEngine is an open-source C++ G-code generator and can be integrated into other applications. It performs model analysis, slicing, support generation and G-code generation. See the official CuraEngine docs: https://github.com/Ultimaker/CuraEngine

## Production flow

GitHub Pages frontend -> POST /api/slice -> FastAPI -> CuraEngine -> G-code -> parsed time/filament -> quote

## Run

Install CuraEngine on the server and put it at `/usr/local/bin/CuraEngine`, then:

```bash
cd backend
pip install -r requirements.txt
CURA_ENGINE=/usr/local/bin/CuraEngine uvicorn app.main:app --reload --port 8000
```

Set the frontend environment variable:

```bash
VITE_API_URL=https://your-slicer-api.example.com
```

## Security before public launch

- Limit upload size.
- Validate file extension AND file content.
- Run the slicer in an isolated container/user with CPU and memory limits.
- Add request rate limits.
- Delete temporary model/G-code files after slicing.
- Never expose arbitrary CuraEngine command arguments to clients.
- Store customer/order data in a real database.
- Add an order/payment service separately.
