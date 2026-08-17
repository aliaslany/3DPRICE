# 3DPRICE manual update

Replace/add these files in the repository:

- `README.md`
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/src/App.tsx`
- `frontend/src/styles.css`

Then run:

```bash
cd frontend
npm install
npm run build
```

This version adds the Three.js interactive model workspace while keeping the existing `/api/slice` contract.

Supported browser model formats:
- STL
- OBJ
- 3MF

The viewer is client-side. CuraEngine remains server-side and authoritative for sliced time/material usage.
