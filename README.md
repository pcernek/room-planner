# Room Planner

A desktop-first, browser-based editor for drawing measured floor plans and arranging furniture.

[Open the live app](https://room-planner.hal-incandenza13073.chatgpt.site)

## Features

- Draw disconnected walls or extend connected wall sequences.
- Switch between centimetres and inches without changing physical dimensions.
- Add, reposition, and edit doors and windows attached to walls.
- Draw, name, resize, rotate, and move furniture.
- Define named rooms from wall sequences and move a complete room as one unit.
- Pan, zoom, and recenter an effectively unbounded grid canvas.
- Persist the current plan and viewport in local browser storage.
- Import and export plans as JSON.

## Development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

## Verification

```bash
npm test
npm run lint
```

`npm test` builds the production application and runs the geometry, data-integrity, and rendered-output tests.

## Implementation

- React 19 and TypeScript
- Vinext and Vite
- SVG-based interactive drawing canvas
- Local-first persistence with JSON portability
- Cloudflare Workers-compatible production output

The application stores geometry internally in centimetres. Unit switching only converts displayed measurements, avoiding cumulative conversion drift.
