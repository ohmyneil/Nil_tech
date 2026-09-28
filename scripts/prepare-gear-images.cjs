// One-time asset preparation. Requires optional tooling: npm install --no-save --package-lock=false sharp
// No network requests or image processing are needed by the site or its build.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const directory = path.resolve(__dirname, '../assets/images/gear');
const images = [
  ['aula-f75', 'https://cdn.shopify.com/s/files/1/0280/3931/5529/files/AULA_F75_02.png?v=1766993980'],
  ['jbl-charge-6', 'https://www.jbl.com/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-masterCatalog_Harman/default/dwf730bf50/LS_JBL_CHARGE_6_BLACK_HERO_071_x1.png?sh=640&sw=640'],
  ['jbl-wave-buds-2', 'https://global.jbl.com/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-masterCatalog_Harman/default/dw11b858ba/01.LS_JBL_Wave%20Buds%202_Product%20Image_Hero_Black.png?sh=640&sw=640'],
  ['asus-tuf-m4-air', 'https://dlcdnwebimgs.asus.com/gain/b328e475-2a6e-4adb-afa7-8afd70f0e7bf/w800'],
  ['iphone-16-pro', 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-deserttitanium-select?wid=800&hei=1000&fmt=png-alpha'],
];
async function main() {
  await fs.mkdir(directory, { recursive: true });
  for (const [name, url] of images) {
    if (process.argv[2] && process.argv[2] !== name) continue;
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    const input = Buffer.from(await response.arrayBuffer());
    await sharp(input).trim().resize(640, 480, { fit: 'contain', background: '#00000000' }).webp({ quality: 82 }).toFile(path.join(directory, name + '.webp'));
    console.log(name, (await fs.stat(path.join(directory, name + '.webp'))).size, 'bytes');
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
