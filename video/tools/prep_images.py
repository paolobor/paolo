"""Prepara las imágenes del aula para los planos 2.5D:
- borra la etiqueta incrustada (se superpone después fija en pantalla: «RECREACIÓN CON IA»)
- genera un mapa de profundidad aproximado (suelo en gradiente + siluetas en primer plano)
"""
import os
import numpy as np
import cv2

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'img')
W, H = 1600, 900

# caja aproximada de la etiqueta en cada imagen
LABEL = {
    'aula_grupo': (14, 852, 215, 892),
    'aula_formacion': (14, 852, 225, 890),
    'aula_portatiles': (8, 848, 245, 892),
    'aula_vision': (20, 848, 215, 885),
}

# profundidad: 1 = cerca, 0 = lejos. Formas: ('rect', x0,y0,x1,y1, d) / ('ell', cx,cy,rx,ry, d) / ('poly', [(x,y)...], d)
SHAPES = {
    'aula_grupo': dict(horizon=470, floor_far=0.30, floor_near=0.95, wall=0.12, shapes=[
        ('ell', 1480, 560, 150, 360, 0.86),           # soldadora roja
        ('rect', 980, 300, 1460, 900, 0.62),          # mesas con robots (derecha)
        ('ell', 905, 450, 115, 230, 0.58),            # profesor
        ('ell', 660, 450, 70, 230, 0.56),             # alumno azul marino
        ('ell', 570, 490, 70, 230, 0.60),             # alumna gris
        ('ell', 470, 470, 60, 250, 0.64),             # alumno sudadera negra
        ('ell', 415, 520, 75, 270, 0.70),             # alumna rayas
        ('ell', 325, 540, 110, 380, 0.82),            # alumno jersey verde
        ('rect', 0, 590, 190, 900, 0.95),             # silla primer plano
        ('rect', 40, 190, 200, 600, 0.55),            # robot mesa izquierda
    ]),
    'aula_formacion': dict(horizon=500, floor_far=0.35, floor_near=0.95, wall=0.12, shapes=[
        ('rect', 720, 560, 1600, 900, 0.9),           # mesa transportadora primer plano
        ('ell', 1440, 400, 170, 260, 0.82),           # robot derecha
        ('ell', 790, 640, 170, 270, 0.85),            # alumno sentado primer plano
        ('ell', 560, 520, 110, 190, 0.6),             # alumna centro
        ('ell', 650, 330, 80, 150, 0.5),              # profesor
        ('ell', 260, 520, 170, 200, 0.55),            # alumna izquierda
        ('rect', 820, 120, 1250, 600, 0.45),          # célula con robot
    ]),
    'aula_portatiles': dict(horizon=430, floor_far=0.25, floor_near=0.95, wall=0.1, shapes=[
        ('poly', [(0, 620), (1600, 560), (1600, 900), (0, 900)], 0.92),   # fila de alumnos delante
        ('ell', 1060, 600, 180, 260, 0.93),
        ('ell', 460, 640, 200, 260, 0.95),
        ('ell', 140, 560, 160, 260, 0.9),
        ('ell', 1530, 560, 110, 250, 0.9),
        ('rect', 220, 230, 1600, 600, 0.45),         # robots y mesas del fondo
        ('ell', 140, 350, 90, 190, 0.5),             # profesor
    ]),
    'aula_vision': dict(horizon=470, floor_far=0.3, floor_near=0.95, wall=0.12, shapes=[
        ('rect', 480, 360, 1480, 830, 0.62),         # cinta y robot
        ('ell', 220, 720, 250, 220, 0.95),           # alumno con portátil
        ('ell', 1350, 560, 140, 340, 0.6),           # profesor
        ('ell', 330, 380, 330, 260, 0.7),            # grupo de alumnos
        ('rect', 900, 690, 1600, 900, 0.85),         # mesa primer plano
    ]),
}


def inpaint_label(img, box):
    x0, y0, x1, y1 = box
    roi = img[y0:y1, x0:x1]
    lum = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY).astype(np.float32)
    bg = cv2.medianBlur(lum.astype(np.uint8), 15).astype(np.float32)
    m = ((lum - bg) > 22).astype(np.uint8) * 255
    m = cv2.dilate(m, np.ones((5, 5), np.uint8), iterations=1)
    mask = np.zeros(img.shape[:2], np.uint8); mask[y0:y1, x0:x1] = m
    return cv2.inpaint(img, mask, 6, cv2.INPAINT_TELEA)


def depth_map(spec):
    y = np.arange(H, dtype=np.float32)[:, None]
    hz = spec['horizon']
    floor = spec['floor_far'] + (spec['floor_near'] - spec['floor_far']) * np.clip((y - hz) / (H - hz), 0, 1)
    d = np.where(y < hz, spec['wall'] + (spec['floor_far'] - spec['wall']) * (y / hz), floor) * np.ones((1, W), np.float32)
    for sh in spec['shapes']:
        layer = np.zeros((H, W), np.uint8)
        if sh[0] == 'rect':
            _, x0, y0, x1, y1, v = sh; cv2.rectangle(layer, (x0, y0), (x1, y1), 255, -1)
        elif sh[0] == 'ell':
            _, cx, cy, rx, ry, v = sh; cv2.ellipse(layer, (cx, cy), (rx, ry), 0, 0, 360, 255, -1)
        else:
            _, pts, v = sh; cv2.fillPoly(layer, [np.array(pts, np.int32)], 255)
        a = cv2.GaussianBlur(layer.astype(np.float32) / 255, (0, 0), 14)
        d = np.maximum(d, d * (1 - a) + v * a)
    d = cv2.GaussianBlur(d, (0, 0), 6)
    return np.clip(d, 0, 1)


for name, box in LABEL.items():
    img = cv2.imread(os.path.join(D, name + '_src.jpg'))
    img = inpaint_label(img, box)
    cv2.imwrite(os.path.join(D, name + '.jpg'), img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    dm = depth_map(SHAPES[name])
    cv2.imwrite(os.path.join(D, name + '_depth.png'), (dm * 255).astype(np.uint8))
    print(name, 'ok')
