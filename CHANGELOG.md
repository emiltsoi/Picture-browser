# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-05-21

### Fixed
- Fit screen mode now scales up small images to fill the viewport (previously only shrank large images)

## [1.0.1] - 2026-05-21

### Fixed
- Application no longer crashes on startup when opened via file association on Windows
- File association support for Windows, macOS, and Linux
- Single instance lock to prevent multiple app windows
- Fixed temporal dead zone error causing "Cannot access 'We' before initialization" error
- Fixed toolbar layout squashing at small window sizes
- Added responsive CSS for better mobile/small screen support
- Added macOS `open-file` event handling for file associations

### Added
- Unit tests for file association handling
- `getInitialFilePath()` and `onFileOpenedFromAssociation()` IPC methods
- Cross-platform file association support (Windows, macOS, Linux)

### Changed
- Improved toolbar responsiveness with flexbox wrapping
- Reduced default element sizes for better small-screen experience
- Added media queries for 1100px, 800px, and 600px breakpoints

## [1.0.0] - 2026-05-20

### Added
- Initial release
- Browse local image folders and Windows network share paths
- Open a single picture and automatically browse the rest of its folder
- Thumbnail sidebar with selected-picture auto-centering
- Sort by name, file size, resolution, or modified date
- Fullscreen mode
- Picture mode for distraction-free viewing
- Fit modes: actual size, fit width, fit height, fit screen, and custom zoom
- Ctrl + mouse wheel zoom
- Mouse drag panning for oversized images
- Keyboard navigation
- Dark UI optimized for image viewing
- Windows x64 installer build support
- Vitest unit test suite