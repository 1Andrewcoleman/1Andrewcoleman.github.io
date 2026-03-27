## Cursor Cloud specific instructions

This is a static front-end web application (NWS Product Viewer) with no build system, package manager, or server-side code. All JS/CSS dependencies are loaded from CDNs.

### Running the app

Serve the repo root with any static HTTP server:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html` (product table) or `http://localhost:8000/nwsapp.html` (full-screen map).

### Key notes

- **No build/lint/test tooling exists.** There is no `package.json`, linter config, or test framework.
- The app fetches live data from `api.weather.gov` (no API key required). Alerts in the table depend on real-time NWS data, so the table may be empty when there are no active alerts for the selected state.
- The map pages use a hardcoded Mapbox access token; no secrets configuration is needed.
- `shapefiles/fpl_shp.zip` is referenced by both HTML pages for an FPL service territory overlay; if this file is missing, the shapefile overlay will fail silently (console error only).
- `nwsapp.html` map view is hardcoded to center on Florida regardless of the state selected in `index.html`.
