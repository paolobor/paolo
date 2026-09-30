"""Genera las texturas y geometrías del mapa nocturno de España.

Salida en assets/map/:
  terrain.png  R = elevación, G = sombreado de relieve, B = máscara de tierra
  lights.png   luces nocturnas sintéticas (a partir de la población de cada municipio)
  geo.json     fronteras en coordenadas de mundo + centros
"""
import json, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'map')
rng = np.random.default_rng(7)

# Extensión del mundo (grados) y proyección equirectangular corregida a 40°N
LON0, LON1, LAT0, LAT1 = -13.5, 4.6, 33.2, 44.7
LONC, LATC = (LON0 + LON1) / 2, (LAT0 + LAT1) / 2
KX = math.cos(math.radians(40))
# Canarias se desplazan a un recuadro al suroeste de la península
CAN = dict(lon0=-18.4, lon1=-13.2, lat0=27.5, lat1=29.6)
CAN_D = (5.3, 6.4)


def is_can(lon, lat):
    return CAN['lon0'] <= lon <= CAN['lon1'] and CAN['lat0'] <= lat <= CAN['lat1']


def shift(lon, lat):
    if is_can(lon, lat):
        return lon + CAN_D[0], lat + CAN_D[1]
    return lon, lat


def world(lon, lat):
    lon, lat = shift(lon, lat)
    return (lon - LONC) * KX, -(lat - LATC)


XMIN, XMAX = (LON0 - LONC) * KX, (LON1 - LONC) * KX
ZMIN, ZMAX = -(LAT1 - LATC), -(LAT0 - LATC)


def to_px(x, z, W, H):
    return (x - XMIN) / (XMAX - XMIN) * W, (z - ZMIN) / (ZMAX - ZMIN) * H


def rings_of(geom):
    if geom['type'] == 'Polygon':
        return geom['coordinates']
    if geom['type'] == 'MultiPolygon':
        return [r for poly in geom['coordinates'] for r in poly]
    return []


countries = json.load(open(os.path.join(OUT, 'countries.json')))
provinces = json.load(open(os.path.join(OUT, 'provinces.json')))
prov_mesh = json.load(open(os.path.join(OUT, 'provinces_mesh.json')))
cities = json.load(open(os.path.join(OUT, 'cities.json')))

# ---------------------------------------------------------------- terreno
TW = 2048
TH = int(round(TW * (ZMAX - ZMIN) / (XMAX - XMIN)))
SS = 3
mask_img = Image.new('L', (TW * SS, TH * SS), 0)
d = ImageDraw.Draw(mask_img)
for f in countries['features']:
    for ring in rings_of(f['geometry']):
        pts = [to_px(*world(lon, lat), TW * SS, TH * SS) for lon, lat in ring]
        if len(pts) > 2:
            d.polygon(pts, fill=255)
# es-atlas tiene más detalle en las islas
for f in provinces['features']:
    for ring in rings_of(f['geometry']):
        pts = [to_px(*world(lon, lat), TW * SS, TH * SS) for lon, lat in ring]
        if len(pts) > 2:
            d.polygon(pts, fill=255)
mask = np.asarray(mask_img.resize((TW, TH), Image.LANCZOS), dtype=np.float32) / 255.0

# Relieve de Natural Earth (tinte hipsométrico + sombreado)
sr = np.asarray(Image.open(os.path.join(HERE, 'shadedrelief.jpg')).convert('RGB'), dtype=np.float32) / 255.0
SH, SW = sr.shape[:2]
jj, ii = np.meshgrid(np.arange(TW) + 0.5, np.arange(TH) + 0.5)
X = XMIN + jj / TW * (XMAX - XMIN)
Z = ZMIN + ii / TH * (ZMAX - ZMIN)
lon = X / KX + LONC
lat = -Z + LATC
# deshacer el desplazamiento de Canarias dentro del recuadro
inset = (lon >= CAN['lon0'] + CAN_D[0]) & (lon <= CAN['lon1'] + CAN_D[0]) & (lat >= CAN['lat0'] + CAN_D[1]) & (lat <= CAN['lat1'] + CAN_D[1])
lon = np.where(inset, lon - CAN_D[0], lon)
lat = np.where(inset, lat - CAN_D[1], lat)
px = (lon + 180) / 360 * SW - 0.5
py = (90 - lat) / 180 * SH - 0.5
samp = np.stack([ndimage.map_coordinates(sr[..., c], [py, px], order=3, mode='nearest') for c in range(3)], -1)
r, g, b = samp[..., 0], samp[..., 1], samp[..., 2]
lum = 0.3 * r + 0.59 * g + 0.11 * b
ratio = r / np.maximum(g, 1e-3)
elev = np.clip((ratio - 0.86) / 0.36, 0, 1)
elev = ndimage.gaussian_filter(elev, 2.2)
elev = np.clip(elev * 1.1, 0, 1) ** 1.25 * mask
shade = lum / np.maximum(ndimage.gaussian_filter(lum, 10), 1e-3)
shade = np.clip(0.5 + (shade - 1.0) * 2.4, 0, 1)
shade = ndimage.gaussian_filter(shade, 0.8)
terrain = np.stack([elev, shade, mask], -1)
Image.fromarray((terrain * 255).astype(np.uint8)).save(os.path.join(OUT, 'terrain.png'))
print('terrain', TW, TH)

# ---------------------------------------------------------------- luces nocturnas
LW = 6144
LH = int(round(LW * (ZMAX - ZMIN) / (XMAX - XMIN)))
px_per_unit = LW / (XMAX - XMIN)
km_per_unit = 111.0
A = np.zeros((LH, LW), np.float32)
B = np.zeros((LH, LW), np.float32)  # núcleos brillantes


def splat(arr, xs, ys, w):
    xi = np.clip(xs.astype(int), 0, LW - 1)
    yi = np.clip(ys.astype(int), 0, LH - 1)
    np.add.at(arr, (yi, xi), w)


cw = [(world(c[0], c[1]), c[2], c[3]) for c in cities]
for (x, z), pop, cc in cw:
    cx, cy = to_px(x, z, LW, LH)
    if not (0 <= cx < LW and 0 <= cy < LH):
        continue
    r_km = 0.75 * (max(pop, 800) / 1000) ** 0.42
    r_px = r_km / km_per_unit * px_per_unit
    n = int(np.clip(pop / 260, 6, 14000))
    # distribución grumosa: varios subnúcleos + puntos alrededor
    k = 1 + int(min(40, pop ** 0.5 / 45))
    subs = rng.normal(0, r_px * 0.45, (k, 2))
    subs[0] = 0
    who = rng.integers(0, k, n)
    spread = r_px * rng.uniform(0.15, 0.55, k)[who]
    pts = subs[who] + rng.normal(0, 1, (n, 2)) * spread[:, None]
    w = rng.uniform(0.35, 1.0, n) * (0.55 + 0.45 * min(1, pop / 50000))
    if pop < 4000:
        w *= rng.choice([0.25, 0.5, 0.8, 1.0])
    splat(A, cx + pts[:, 0], cy + pts[:, 1], w)
    splat(B, np.array([cx]), np.array([cy]), np.array([min(6.0, 0.6 + pop / 60000)]))

# carreteras tenues entre ciudades cercanas
big = [(to_px(x, z, LW, LH), pop) for (x, z), pop, cc in cw if pop > 15000 and cc in ('ES', 'PT')]
bp = np.array([p for p, _ in big])
for i, ((x0, y0), pop) in enumerate(big):
    dd = np.hypot(bp[:, 0] - x0, bp[:, 1] - y0)
    dd[i] = 1e9
    for j in np.argsort(dd)[:2]:
        if dd[j] > 110 / km_per_unit * px_per_unit:
            continue
        x1, y1 = bp[j]
        m = int(dd[j] / 2.2)
        t = rng.uniform(0, 1, m)
        wob = rng.normal(0, 1.2, m)
        nx, ny = -(y1 - y0) / dd[j], (x1 - x0) / dd[j]
        splat(A, x0 + (x1 - x0) * t + nx * wob, y0 + (y1 - y0) * t + ny * wob, rng.uniform(0.03, 0.13, m))

L = (ndimage.gaussian_filter(A, 0.7) * 1.0 + ndimage.gaussian_filter(A, 2.5) * 1.6 + ndimage.gaussian_filter(A, 9) * 5.0 +
     ndimage.gaussian_filter(B, 2.0) * 3.0 + ndimage.gaussian_filter(B, 7) * 8.0)
L = 1 - np.exp(-L * 1.35)
Image.fromarray((np.clip(L, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'lights.png'), optimize=True)
print('lights', LW, LH)

# ---------------------------------------------------------------- geometrías


def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    out = [pts[0]]
    for p in pts[1:-1]:
        if math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) >= tol:
            out.append(p)
    out.append(pts[-1])
    return out


def line_world(coords, tol=0.004):
    return [[round(x, 4), round(z, 4)] for x, z in simplify([world(lon, lat) for lon, lat in coords], tol)]


coast = []
for f in countries['features']:
    if f['properties']['name'] == 'Spain':
        continue  # España sale de es-atlas
    for ring in rings_of(f['geometry']):
        if len(ring) > 8:
            coast.append(line_world(ring))
spain = []
for f in provinces['features']:
    if f['properties']['name'].startswith('Gibraltar'):
        continue
    for ring in rings_of(f['geometry']):
        spain.append(line_world(ring, 0.003))
inner = []
geom = prov_mesh['geometry'] if prov_mesh.get('type') == 'Feature' else prov_mesh
lines = geom['coordinates'] if geom['type'] == 'MultiLineString' else [geom['coordinates']]
for ln in lines:
    inner.append(line_world(ln, 0.003))
prov_by_name = {}
for f in provinces['features']:
    prov_by_name[f['properties']['name']] = [line_world(r, 0.003) for r in rings_of(f['geometry']) if len(r) > 12]

centers = [
    dict(n='01', name='IES DOCTOR FLEMING', kind='INSTITUTO', city='OVIEDO · ASTURIAS', lon=-5.8448, lat=43.3603, prov='Asturias'),
    dict(n='02', name='IES DOMÍNGUEZ ORTIZ', kind='INSTITUTO', city='GUADALAJARA', lon=-3.2672, lat=40.5647, prov='Guadalajara'),
    dict(n='03', name='IES SAN BLAS', kind='INSTITUTO', city='MADRID', lon=-3.6166, lat=40.4277, prov='Madrid'),
    dict(n='04', name='IES SALVADOR ALLENDE', kind='INSTITUTO', city='MADRID', lon=-3.7942, lat=40.2842, prov='Madrid'),
    dict(n='05', name='IES MIGUEL HERNÁNDEZ', kind='INSTITUTO', city='OCAÑA · TOLEDO', lon=-3.4987, lat=39.9575, prov='Toledo'),
    dict(n='06', name='IES CENCIBEL', kind='INSTITUTO', city='VILLARROBLEDO · ALBACETE', lon=-2.6011, lat=39.2699, prov='Albacete'),
    dict(n='07', name='IES JORGE MANRIQUE', kind='INSTITUTO', city='MOTILLA DEL PALANCAR · CUENCA', lon=-1.9103, lat=39.5620, prov='Cuenca'),
    dict(n='08', name='POLITÉCNICA DE MURCIA', kind='FORMACIÓN PROFESIONAL', city='MURCIA', lon=-1.1307, lat=37.9922, prov='Murcia'),
    dict(n='09', name='UNIVERSIDAD DE SEVILLA', kind='UNIVERSIDAD', city='SEVILLA', lon=-5.9869, lat=37.3772, prov='Sevilla'),
    dict(n='10', name='UNIVERSIDAD DE LA LAGUNA', kind='UNIVERSIDAD', city='LA LAGUNA · TENERIFE', lon=-16.3159, lat=28.4853, prov='Santa Cruz de Tenerife'),
]
for c in centers:
    c['x'], c['z'] = [round(v, 4) for v in world(c['lon'], c['lat'])]
    c['outline'] = prov_by_name[c['prov']]
    c['coord'] = f"{abs(c['lat']):.3f}°{'N' if c['lat'] >= 0 else 'S'}  {abs(c['lon']):.3f}°{'W' if c['lon'] < 0 else 'E'}"

x0, z0 = world(CAN['lon0'] + 0.35, CAN['lat1'] - 0.2)
x1, z1 = world(CAN['lon1'] - 0.1, CAN['lat0'] + 0.25)
geo = dict(extent=[XMIN, XMAX, ZMIN, ZMAX], coast=coast, spain=spain, inner=inner, centers=centers,
           inset=[round(x0, 3), round(z0, 3), round(x1, 3), round(z1, 3)])
json.dump(geo, open(os.path.join(OUT, 'geo.json'), 'w'), ensure_ascii=False)
print('geo ok', len(coast), len(spain), len(inner), geo['inset'], geo['extent'])
