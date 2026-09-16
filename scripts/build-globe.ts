import fs from "node:fs";
import sharp from "sharp";
import { projectGlobePoint, type GlobePoint } from "../src/lib/globe";

// Natural Earth 1:110m land, public domain. Source and replacement notes in the asset guide.
type Ring = number[][];
const data = JSON.parse(fs.readFileSync("scripts/data/ne_110m_land.geojson", "utf8"));
const polygons: Ring[][] = data.features.flatMap((f: { geometry: { type: string; coordinates: Ring[][] | Ring[] } }) =>
  f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates,
);
function inside(lon: number, lat: number, ring: Ring) {
  let result = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) result = !result;
  }
  return result;
}
const points: GlobePoint[] = [];
const count = 36000;
for (let i = 0; i < count; i++) {
  const y = 1 - 2 * (i + 0.5) / count;
  const lat = Math.asin(y);
  const lon = ((i * Math.PI * (3 - Math.sqrt(5))) % (Math.PI * 2)) - Math.PI;
  if (!polygons.some((p) => inside(lon * 180 / Math.PI, lat * 180 / Math.PI, p[0]) && !p.slice(1).some((hole) => inside(lon * 180 / Math.PI, lat * 180 / Math.PI, hole)))) continue;
  points.push([Math.cos(lat) * Math.sin(lon), y, Math.cos(lat) * Math.cos(lon)].map((n) => Math.round(n * 10000) / 10000) as GlobePoint);
}
const dots = points.map((p) => projectGlobePoint(p)).filter((p) => p.depth > 0).map((p) =>
  `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="1.22" fill="#72a8ff" opacity="${p.alpha.toFixed(3)}"/>`,
).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720"><defs>
<radialGradient id="air"><stop offset=".86" stop-color="#285cff" stop-opacity=".13"/><stop offset=".92" stop-color="#387cff" stop-opacity=".2"/><stop offset="1" stop-color="#285cff" stop-opacity="0"/></radialGradient>
<radialGradient id="sea" cx=".26" cy=".22" r=".9"><stop stop-color="#102b60"/><stop offset=".48" stop-color="#09172e"/><stop offset="1" stop-color="#05070d"/></radialGradient>
<linearGradient id="rim" x2="1" y2="1"><stop stop-color="#659cff" stop-opacity=".65"/><stop offset=".55" stop-color="#285cff" stop-opacity=".15"/><stop offset="1" stop-color="#05070d" stop-opacity="0"/></linearGradient></defs>
<circle cx="360" cy="360" r="315" fill="url(#air)"/><circle cx="360" cy="360" r="286" fill="url(#sea)" stroke="url(#rim)" stroke-width="1.2"/>${dots}</svg>`;
fs.mkdirSync("public/assets/observatory", { recursive: true });
fs.writeFileSync("public/assets/observatory/land-points.json", JSON.stringify(points));
sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile("public/assets/observatory/globe-poster.webp")
  .then(() => console.log(`Generated ${points.length} land points and the matching 720px poster.`))
  .catch((error) => { console.error(error); process.exitCode = 1; });
