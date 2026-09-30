// Exporta datos geográficos (ciudades, fronteras) a JSON simple para el preprocesado en Python.
const fs = require('fs');
const topo = require('topojson-client');
const cities = require('all-the-cities');
const ext = { lon0: -13.5, lon1: 4.6, lat0: 33.2, lat1: 44.7 };
const canExt = { lon0: -18.4, lon1: -13.2, lat0: 27.5, lat1: 29.6 };
const inE = (e, lon, lat) => lon >= e.lon0 && lon <= e.lon1 && lat >= e.lat0 && lat <= e.lat1;
const out = cities
  .filter(c => inE(ext, ...c.loc.coordinates) || inE(canExt, ...c.loc.coordinates))
  .map(c => [c.loc.coordinates[0], c.loc.coordinates[1], c.population, c.country, c.name]);
fs.writeFileSync('assets/map/cities.json', JSON.stringify(out));
console.log('cities', out.length, 'ES', out.filter(c => c[3] === 'ES').length);

const w = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-10m.json'));
const countries = topo.feature(w, w.objects.countries);
const keep = ['Spain', 'Portugal', 'France', 'Morocco', 'Andorra', 'Algeria', 'Gibraltar', 'Italy', 'Switzerland', 'W. Sahara', 'Tunisia'];
const feats = countries.features.filter(f => keep.includes(f.properties.name));
fs.writeFileSync('assets/map/countries.json', JSON.stringify({ type: 'FeatureCollection', features: feats }));
console.log('countries', feats.map(f => f.properties.name).join(','));

for (const name of ['provinces', 'autonomous_regions']) {
  const t = JSON.parse(fs.readFileSync(`node_modules/es-atlas/es/${name}.json`));
  console.log(name, Object.keys(t.objects), t.transform ? 'quantized' : '', JSON.stringify(t.bbox));
  const key = Object.keys(t.objects)[0];
  const fc = topo.feature(t, t.objects[key]);
  fs.writeFileSync(`assets/map/${name}.json`, JSON.stringify(fc));
  const mesh = topo.mesh(t, t.objects[key], (a, b) => a !== b);
  fs.writeFileSync(`assets/map/${name}_mesh.json`, JSON.stringify(mesh));
  console.log(' sample props', JSON.stringify(fc.features[0].properties), fc.features.length);
}
