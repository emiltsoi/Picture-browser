# Picture Browser

Picture Browser is a desktop image viewer built with Electron, React, TypeScript, and Vite. It is designed for fast local browsing, Windows network shares, thumbnail navigation, fullscreen viewing, and precise zoom/pan control.

## Features

- Browse local image folders and Windows network share paths
- Open a single picture and automatically browse the rest of its folder
- Thumbnail sidebar with selected-picture auto-centering
- Sort by name, file size, resolution, or modified date
- Ascending and descending sorting
- Fullscreen mode
- Picture mode for distraction-free viewing
- Fit modes: actual size, fit width, fit height, fit screen, and custom zoom
- Ctrl + mouse wheel zoom
- Mouse drag panning for oversized images
- Clamped picture-mode panning so the image stops at its edges
- Keyboard navigation for quick browsing
- Dark UI optimized for image viewing
- Windows x64 installer build support through electron-builder

## Supported formats

- JPG / JPEG
- PNG
- GIF
- WebP
- BMP
- SVG
- TIFF / TIF

Animated GIF and animated WebP files are displayed through Chromium's native image rendering.

## Requirements

- Windows, macOS, or Linux for development
- Node.js 20 or newer recommended
- npm

The packaged installer target currently configured in this repository is Windows x64.

## Installation

Install dependencies:

```bash
npm install
```

## Development

Run the app in development mode:

```bash
npm run dev
```

This starts the Vite renderer dev server and launches Electron against it.

## Build

Compile the renderer and Electron main process:

```bash
npm run build
```

## Package for Windows

Build a Windows x64 NSIS installer:

```bash
npm run dist:win
```

The generated installer is written to:

```text
release/
```

The installer is unsigned unless a signing certificate is configured for electron-builder.

## Usage

- Enter a local folder path, for example `C:\Pictures`
- Enter a Windows network path, for example `\\server\share\photos`
- Use `Browse` to choose a folder with the native directory picker
- Use `Open Picture` to choose one image file and browse from its folder
- Click thumbnails to switch images
- Use the fit selector to change how images are displayed

## Keyboard and mouse controls

| Control | Action |
| --- | --- |
| Left Arrow | Previous image |
| Right Arrow | Next image |
| Home | First image |
| End | Last image |
| F | Toggle fullscreen |
| P | Toggle picture mode |
| Esc | Exit picture mode or close help |
| 1 | Actual size |
| 2 | Fit width |
| 3 | Fit height |
| 4 | Fit screen |
| Mouse wheel | Previous / next image |
| Ctrl + Mouse wheel | Zoom in / out |
| Left click + drag | Pan oversized image |

## Project structure

```text
electron/              Electron main process and preload bridge
src/                   React renderer source
dist/                  Generated renderer build output
dist-electron/         Generated Electron build output
release/               Generated installer/package output
```

Generated folders such as `node_modules`, `dist`, `dist-electron`, and `release` should not be committed.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Electron in development mode |
| `npm run build` | Build renderer and Electron main process |
| `npm run build:renderer` | Build the Vite renderer |
| `npm run build:electron` | Compile Electron TypeScript |
| `npm run preview` | Preview the Vite renderer build |
| `npm run dist:win` | Build the Windows x64 installer |

## Notes

- Vite is configured with `base: './'` so packaged Electron builds can load renderer assets correctly from `file://`.
- The preload bridge exposes filesystem and window operations through `window.pictureBrowserAPI`.
- Source images are not modified by the app.
