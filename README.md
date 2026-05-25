# Research Nexus Matching (RNM)

Home page implementation matching the Figma design (`Home` frame, node `4:797`).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Assets

Images are exported from Figma into `public/images/`. If exports fail, re-run the Framelink MCP `download_figma_images` tool with file key `NMvcLfngHOohvQ7Y8ZvgF5`.

## Routes

| Page | URL | Figma node |
|------|-----|------------|
| หน้าหลัก | `/` | `4:797` |
| แหล่งทุน | `/funding` | `156:525` |
| นักวิจัย | `/researchers` | `35:1138` |
| เชิงพื้นที่ | `/spatial` | `145:649` (แผนนที่) |
| รายละเอียดทุน | `/funding/[id]` | `156:1488` (ยังไม่ทำ) |
| รายละเอียดนักวิจัย | `/researchers/[id]` | `70:3219` (ยังไม่ทำ) |

## Next steps

1. Build each page from its Figma node (same workflow as Home).
2. Reuse `SiteHeader`, `SiteFooter`, and `PageShell` in `src/components/layout/`.
3. Add detail routes when list pages are ready.

## Figma

Design file: [Ai](https://www.figma.com/design/NMvcLfngHOohvQ7Y8ZvgF5/Ai)
