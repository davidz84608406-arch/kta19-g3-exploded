import { build } from 'esbuild';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(root, '.build');
const bundlePath = path.join(buildDir, 'bundle.js');
const outputPath = path.join(root, 'index.html');

await fs.mkdir(buildDir, { recursive: true });

const result = await build({
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true,
  outfile: bundlePath,
  format: 'iife',
  target: ['chrome100', 'safari15'],
  minify: !process.env.DEBUG,
  sourcemap: process.env.DEBUG ? 'inline' : false,
  legalComments: 'none',
  logLevel: 'silent',
  banner: {
    js: '/*! KTA19-G3 x STAMFORD interactive exploded view. Three.js is MIT licensed. */',
  },
});

let css = await fs.readFile(path.join(root, 'src/style.css'), 'utf8');
const fontData = new Map();
const fontPattern = /url\('\.\.\/assets\/fonts\/([^']+)'\)/g;

for (const match of css.matchAll(fontPattern)) {
  if (fontData.has(match[1])) continue;
  const fontPath = path.join(root, 'assets/fonts', match[1]);
  const bytes = await fs.readFile(fontPath);
  fontData.set(match[1], `data:font/woff2;base64,${bytes.toString('base64')}`);
}
css = css.replace(fontPattern, (full, filename) => `url('${fontData.get(filename)}')`);

let js = await fs.readFile(bundlePath, 'utf8');
js = js.replace(/<\/script/gi, '<\\/script');

const template = await fs.readFile(path.join(root, 'src/index.template.html'), 'utf8');
const html = template
  .replace('/* __INLINE_CSS__ */', () => css)
  .replace('/* __INLINE_JS__ */', () => js);

await fs.writeFile(outputPath, html, 'utf8');
await fs.rm(buildDir, { recursive: true, force: true });

const bytes = Buffer.byteLength(html);
console.log(`Built index.html — ${(bytes / 1024 / 1024).toFixed(2)} MB (self-contained)`);
console.log('Output contains procedural Three.js geometry, inline fonts, and no external image assets.');
if (result.errors?.length) {
  console.error(result.errors);
  process.exitCode = 1;
}
