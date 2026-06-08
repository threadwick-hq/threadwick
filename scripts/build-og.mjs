// Regenerates public/og-image.png from public/og-image.svg.
// Run with: npm run og
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const here = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(here, '../public/og-image.svg');
const pngPath = resolve(here, '../public/og-image.png');

const svg = readFileSync(svgPath, 'utf8');
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
const png = resvg.render().asPng();
writeFileSync(pngPath, png);
console.log(`Wrote ${pngPath} (${png.length} bytes)`);
