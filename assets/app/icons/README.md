# TV View application icons

The packaged application uses the approved original artwork. All native icon
exports preserve its transparency.

| Location | Contents |
| --- | --- |
| `source/tv-view-master.png` | Unmodified, full-resolution 1254 × 1254 approved source PNG. Keep this master for future exports. |
| `linux/` | PNGs at 16, 32, 48, 64, 128, 256, 512, and 1024 pixels square. |
| `win/icon.ico` | Windows icon containing 16, 24, 32, 48, 64, 72, 96, 128, and 256 pixel images, using BMP for small executable icons and PNG for larger sizes. |
| `macos/icon.icns` | macOS application icon, including Retina representations up to 1024 pixels. |
| `macos/icon.iconset/` | Complete macOS 16, 32, 128, 256, and 512 point PNG set at 1× and 2×. |
| `source/tv-view-layered.svg` | Editable vector recreation with twelve named layers, paths, gradients, and transparent background. |
| `source/tv-view-layered.psd` | Photoshop version with twelve separate raster layers and a hidden copy of the approved original for reference. |
| `source/tv-view-layered.kra` | Native Krita document with the same twelve separate raster layers and hidden reference. |
| `source/tv-view-layered.ora` | OpenRaster version for Krita, with the same separate raster layers and hidden reference. |
| `source/tv-view-layered-preview.png` | Rendered preview of the vector recreation. |

The original was generated as a flattened PNG. The editable SVG is a recreation,
not recovered source geometry, and does not exactly reproduce its shading or geometry.
Its vector objects remain editable and scale to any resolution. The PSD and ORA
and KRA exports rasterize each named vector layer separately at 1254 × 1254; edit the SVG
for changes to vector shapes or gradients.

Electron Builder selects the native icons through `linux.icon`, `win.icon`, and
`mac.icon` in the root `package.json`. The runtime icon resources are copied
separately, so the large source and editing files are not shipped with the app.
