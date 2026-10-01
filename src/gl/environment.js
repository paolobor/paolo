import {
  Scene, Mesh, SphereGeometry, PlaneGeometry, MeshBasicMaterial, ShaderMaterial, BackSide, Color,
  PMREMGenerator, Vector3,
} from 'three';

// Entorno HDR de estudio generado por código (sin descargas):
// cúpula en degradado + softboxes emisivos, filtrado con PMREM.

function gradientDome({ top, horizon, bottom, band = null }) {
  return new Mesh(
    new SphereGeometry(60, 64, 32),
    new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new Color(...top) },
        uHorizon: { value: new Color(...horizon) },
        uBottom: { value: new Color(...bottom) },
        uBand: { value: band ? new Vector3(...band) : new Vector3(0, 0, 0) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop, uHorizon, uBottom, uBand;
        varying vec3 vDir;
        void main() {
          float y = vDir.y;
          vec3 c = y > 0.0
            ? mix(uHorizon, uTop, pow(clamp(y, 0.0, 1.0), 0.55))
            : mix(uHorizon, uBottom, pow(clamp(-y, 0.0, 1.0), 0.45));
          // Banda oscura de horizonte (look cromado)
          if (uBand.z > 0.0) {
            float d = smoothstep(uBand.x - 0.03, uBand.x, y) * (1.0 - smoothstep(uBand.y, uBand.y + 0.05, y));
            c = mix(c, c * 0.04, d * uBand.z);
          }
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
}

function panel(w, h, intensity, pos, color = [1, 1, 1]) {
  const m = new Mesh(
    new PlaneGeometry(w, h),
    new MeshBasicMaterial({ color: new Color(color[0] * intensity, color[1] * intensity, color[2] * intensity), side: 2 }),
  );
  m.position.set(...pos);
  m.lookAt(0, 0, 0);
  return m;
}

// Estudio para las piezas mecanizadas (aluminio, acero)
export function createStudioEnvironment(renderer) {
  const scene = new Scene();
  // Cúpula en degradado: evita que las caras verticales reflejen negro puro
  scene.add(gradientDome({ top: [0.46, 0.47, 0.49], horizon: [0.17, 0.175, 0.185], bottom: [0.025, 0.025, 0.028] }));
  // Softbox cenital grande
  scene.add(panel(54, 30, 2.1, [0, 36, 2]));
  // Tira de luz principal (izquierda-delante)
  scene.add(panel(11, 50, 4.2, [-36, 6, 14], [1, 0.985, 0.96]));
  // Contraluz (derecha-detrás)
  scene.add(panel(8, 46, 3.6, [32, 8, -24], [0.95, 0.97, 1]));
  // Panel suave detrás de la cámara final (caras frontales en gris medio)
  scene.add(panel(44, 22, 0.95, [-27, 10, -27]));
  // Tira horizontal alta (línea de brillo en las caras superiores)
  scene.add(panel(70, 2.6, 2.5, [0, 22, 32]));
  // Pequeño foco duro para destellos puntuales
  scene.add(panel(3, 3, 12, [20, 26, 18]));

  const pmrem = new PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.012);
  pmrem.dispose();
  scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt.texture;
}

// Estudio para las letras cromadas: cielo claro, horizonte oscuro, suelo medio.
// Se orienta con envMapRotation para que el horizonte quede a la altura de la mirada.
export function createChromeEnvironment(renderer) {
  const scene = new Scene();
  scene.add(gradientDome({ top: [1.25, 1.27, 1.3], horizon: [0.9, 0.92, 0.95], bottom: [0.3, 0.31, 0.33], band: [-0.02, 0.07, 1.0] }));
  scene.add(panel(10, 60, 9, [-36, 10, 20]));
  scene.add(panel(10, 60, 7, [36, 10, 20]));
  scene.add(panel(70, 8, 6, [0, 40, 0]));
  scene.add(panel(70, 2.5, 5, [0, -14, 40], [0.95, 0.96, 1]));

  const pmrem = new PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.004);
  pmrem.dispose();
  scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt.texture;
}
