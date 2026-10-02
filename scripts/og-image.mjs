// Genera public/og-default.png (1200×630) para Open Graph. Provisional hasta tener foto de marca.
import sharp from 'sharp';

const grid = Array.from({ length: 40 }, (_, i) => i * 32)
  .map((x) => `<path d="M${x} 0V630M0 ${x}H1200" stroke="#4d8ef0" stroke-opacity=".09"/>`)
  .join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0a1626"/>${grid}
  <text x="80" y="250" font-family="DejaVu Sans, Arial, sans-serif" font-size="96" font-weight="800" letter-spacing="8" fill="#fff">FAIRINO</text>
  <text x="84" y="300" font-family="DejaVu Sans Mono, monospace" font-size="26" letter-spacing="10" fill="#22b8cf">COBOT ESPAÑA</text>
  <text x="80" y="420" font-family="DejaVu Sans, Arial, sans-serif" font-size="40" fill="#b9c6d8">Distribuidor oficial de cobots FAIRINO</text>
  <text x="80" y="470" font-family="DejaVu Sans, Arial, sans-serif" font-size="40" fill="#b9c6d8">Configura tu célula y pide presupuesto</text>
  <rect x="80" y="540" width="120" height="6" fill="#1557c0"/>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/og-default.png');
console.log('og-default.png');
