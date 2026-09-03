# Vision Finder

A local-first web app for finding and organizing images for vision boards.

Images are analyzed in the browser — nothing is uploaded to a server. Search by
color similarity first, with visual and semantic similarity planned on top of the
same scoring system.

## Getting started

```bash
bun install
bun dev
```

Open http://localhost:3000.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19
- TypeScript, Tailwind CSS v4, ESLint
- Browser-native image processing (`Canvas`, `ImageData`, `File`)
- IndexedDB for the local image index
- Transformers.js for embeddings — later, and optional

## Layout

```
src/
├── app/         # routes, layout, globals
├── components/  # ImageGrid, ImageCard, ImageImporter, SearchBar, ColorPicker…
├── lib/         # colors, image-processing, similarity, storage
├── types/       # IndexedImage, RGBColor, SearchWeights
└── workers/     # off-main-thread analysis
```

## Status

Project shell only. Import, color extraction, and ranking are not built yet.

Roadmap: color engine → local index → visual similarity → semantic search →
vision board → aesthetic learning.

## Principles

- **Local-first.** Images stay on the user's machine.
- **Progressive enhancement.** The app works without AI.
- **No unnecessary infrastructure.** No backend, database, or paid API until needed.
- **Modular scoring.** Color, visual, and semantic are independent signals that combine.
- **Make the math visible.** Explain *why* an image was recommended.
