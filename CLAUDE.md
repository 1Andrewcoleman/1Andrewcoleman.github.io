# CLAUDE.md

## Project Overview

Static front-end web application (NWS Product Viewer) with no build system, package manager, or server-side code. All JS/CSS dependencies are loaded from CDNs.

## Running the App

Serve the repo root with any static HTTP server:

```
python3 -m http.server 8000
```

Then open:
- `http://localhost:8000/index.html` — NWS product table
- `http://localhost:8000/nwsapp.html` — full-screen map view

## Key Notes

- **No build/lint/test tooling.** There is no `package.json`, linter config, or test framework. Do not attempt to run `npm`, `yarn`, or similar commands.
- The app fetches live data from `api.weather.gov` (no API key required).
- The map uses a hardcoded Mapbox access token; no secrets configuration is needed.
- `shapefiles/fpl_shp.zip` provides an FPL service territory overlay; if missing, the overlay fails silently (console error only).
- `nwsapp.html` map view is hardcoded to center on Florida regardless of state selection in `index.html`.

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | NWS product/alert table UI |
| `nwsapp.html` | Full-screen Leaflet map with NWS layers |
| `master_js.js` | Shared JavaScript logic |
| `shapefiles/fpl_shp.zip` | FPL service territory shapefile overlay |
