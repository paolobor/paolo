import { Vector3 } from 'three';

// Prepara la bancada para cobot cargada del .glb para el guion de la escena 3.
export function setupStructure(root, { shadows = false } = {}) {
  const meta = root.userData.meta;
  const get = (n) => {
    const o = root.getObjectByName(n);
    if (!o) throw new Error(`Falta la pieza "${n}" en la bancada`);
    return o;
  };
  const corners = [0, 1, 2, 3].map((k) => get(`esquina-${k}`));
  const legs = [0, 1, 2, 3].map((k) => get(`pata-${k}`));
  const feet = [0, 1, 2, 3].map((k) => get(`pie-${k}`));
  const beams = {
    x0: get('viga-x-0'), x1: get('viga-x-1'), z0: get('viga-z-0'), z1: get('viga-z-1'),
  };
  const stretchers = ['travesano-x-0', 'travesano-x-1', 'travesano-z-0', 'travesano-z-1'].map(get);
  const robotBeams = [get('viga-robot-0'), get('viga-robot-1')];
  const brackets = [];
  for (let i = 0; ; i++) {
    const b = root.getObjectByName(`escuadra-angular-${i}`);
    if (!b) break;
    brackets.push(b);
  }
  const plate = get('placa-robot');
  const cobot = get('cobot');
  const joints = [1, 2, 3, 4, 5, 6].map((j) => get(`cobot-j${j}`));
  const pose = joints.map((j) => j.rotation.clone());

  const all = [...corners, ...legs, ...feet, ...Object.values(beams), ...stretchers, ...robotBeams, ...brackets, plate, cobot];
  for (const p of all) {
    p.userData.final = p.position.clone();
    p.userData.finalScale = p.scale.clone();
  }
  // Tornillos de cada esquina y su "giro"
  const cornerScrews = corners.map((c, k) => ['x', 'z', 'nx', 'nz'].map((a) => {
    const s = get(`esquina-${k}-tornillo-${a}`);
    s.userData.spin = get(`esquina-${k}-tornillo-${a}-giro`);
    s.userData.final = s.position.clone();
    return s;
  }));
  const footSpins = feet.map((f, k) => get(`pie-${k}-giro`));

  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = shadows;
      o.receiveShadow = shadows;
    }
  });

  const center = new Vector3(meta.W / 2, (meta.floor + 34) / 2, meta.D / 2);
  return { root, meta, corners, cornerScrews, legs, feet, footSpins, beams, stretchers, robotBeams, brackets, plate, cobot, joints, pose, all, center };
}
