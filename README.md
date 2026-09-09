# Fabrizio Falcon — Portfolio

Standard Next.js + React + Three.js, ready for Vercel. No dashboard, login, database, or Cloudflare runtime. No environment variables required.

## Run locally
Use Node.js 22.13 or newer.

```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Check the production build
```bash
npm run build
npm start
```

## Vercel
1. Unzip this package into a NEW folder. Use its contents as your GitHub repository root, with package.json at the top level. Do not overlay it on the previous Cloudflare project.
2. Commit the source and package-lock.json; node_modules and .next are ignored.
3. In Vercel, Add New > Project > Import your GitHub repository.
4. Framework: Next.js. Root directory: the folder containing package.json (normally ./).
5. Build command: npm run build. Output directory: leave the default; do not enter dist or out.
6. Click Deploy. Later pushes to main update production.

## Navigation
Left monitor: GitHub ffalcon12. Middle monitor: projects. Right monitor: about. Yellow hover selection follows the actual GLB meshes. The name sits at the top; no dashboard or HUD toggle. Mobile links and keyboard navigation are available. LinkedIn is linked from the portfolio. Escape closes panels.

## Editing
app/page.tsx: portfolio content. app/profile.ts: links. app/room.tsx: Three.js scene and interaction. app/globals.css: styling. public/models: optimized GLB and still fallback. public/downloads/afterhours.blend: editable Blender master. studio: source scene and Blender export scripts. The source ZIP in public/downloads is a snapshot; regenerate it if you change the code.

The 3D interaction uses WebGL; browsers without it receive a still-image fallback with 2D click regions.
