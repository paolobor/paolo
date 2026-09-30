import { Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';

// Rejilla técnica muy tenue (celda de 10 mm, mayor cada 40 mm) con desvanecido radial.
export function createGrid({ y = -15, size = 240, center = new Vector3(0, 0, 0) } = {}) {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uOpacity: { value: 0 },
      uCenter: { value: center.clone() },
      uRadius: { value: 30 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity, uRadius;
      uniform vec3 uCenter;
      varying vec3 vWorld;
      float line(vec2 p, float cell, float w) {
        vec2 q = p / cell;
        vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
        return 1.0 - min(min(g.x, g.y) / w, 1.0);
      }
      void main() {
        vec2 p = vWorld.xz;
        float minor = line(p, 1.0, 1.0) * 0.28;
        float major = line(p, 4.0, 1.25);
        float d = length(p - uCenter.xz);
        float fade = 1.0 - smoothstep(uRadius * 0.25, uRadius, d);
        float a = max(minor, major * 0.7) * fade * uOpacity * 0.042;
        gl_FragColor = vec4(vec3(0.78, 0.8, 0.84), a);
      }`,
  });
  const mesh = new Mesh(new PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.renderOrder = -1;
  mesh.name = 'rejilla';
  return mesh;
}
