import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Sparkles } from '@react-three/drei';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

/* ═══════════ Mouse tracking (window-level for eye follow + gravity) ═══════════ */
const mousePos = new THREE.Vector2(0, 0);

/* ═══════════ SHADERS ═══════════ */

const simpleVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Incoming white beam: bright core + soft glow, shimmer
const beamFrag = `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float lengthFade = pow(vUv.x, 0.5);
    float d = abs(vUv.y - 0.5) * 2.0;
    float core = exp(-d * d * 30.0);
    float glow = exp(-d * d * 4.0);
    float intensity = core * 1.2 + glow * 0.4;
    float shimmer = 0.9 + 0.1 * sin(vUv.x * 25.0 - uTime * 5.0);
    float alpha = lengthFade * intensity * uOpacity * shimmer;
    vec3 color = vec3(1.0, 0.97, 0.92) * (1.0 + core * 0.6);
    gl_FragColor = vec4(color, alpha);
  }
`;

// Rainbow ray band: bright core line + volumetric glow, shimmer
const rayFrag = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float lengthFade = pow(1.0 - vUv.x, 1.0);
    float d = abs(vUv.y - 0.5) * 2.0;
    float core = exp(-d * d * 35.0);
    float glow = exp(-d * d * 5.0);
    float intensity = core * 1.0 + glow * 0.4;
    float shimmer = 0.85 + 0.15 * sin(vUv.x * 18.0 + uTime * 3.0);
    float alpha = lengthFade * intensity * uOpacity * shimmer;
    vec3 color = uColor * (1.2 + core * 0.8);
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ═══════════ BLOBBY AURA SHADERS (replaces old rigid sphere) ═══════════ */
const blobbyAuraVert = `
  uniform float uTime;
  uniform float uNoiseOffset;
  uniform vec2 uMouse;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vDisplacement;

  // Inline 3D simplex noise (Ashima Arts)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    vec3 pos = position;

    // Multi-octave noise displacement
    float t = uTime * 0.6 + uNoiseOffset;
    float n1 = snoise(pos * 2.5 + t);
    float n2 = snoise(pos * 5.0 + t * 1.3) * 0.5;
    float noiseDisp = (n1 + n2) * 0.12;

    // Mouse gravity bulge
    vec3 worldNorm = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec3 mouseDir = normalize(vec3(uMouse.x, uMouse.y, 0.5));
    float alignment = max(0.0, dot(worldNorm, mouseDir));
    float mouseBulge = pow(alignment, 3.0) * 0.2;

    float totalDisp = noiseDisp + mouseBulge;
    pos += normal * totalDisp;
    vDisplacement = totalDisp;

    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const blobbyAuraFrag = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vDisplacement;
  void main() {
    float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
    float tightRim = pow(fresnel, 4.0) * 1.5;
    float wideRim = pow(fresnel, 1.8) * 0.3;
    float rim = tightRim + wideRim;
    rim *= 0.85 + 0.15 * sin(uTime * 1.5);
    // Warm tint where stretched
    vec3 color = mix(uColor, uColor * vec3(1.3, 0.9, 0.8), clamp(vDisplacement * 4.0, 0.0, 1.0));
    gl_FragColor = vec4(color, rim);
  }
`;

/* ═══════════ INNER SPARKLES SHADERS ═══════════ */
const innerSparklesVert = `
  uniform float uTime;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vec3 pos = position;
    // Gentle sine-wave drift
    pos.x += sin(uTime * 0.7 + aPhase * 6.28) * 0.08;
    pos.y += sin(uTime * 0.9 + aPhase * 4.28) * 0.06;
    pos.z += cos(uTime * 0.5 + aPhase * 5.28) * 0.07;
    // Twinkling size
    float twinkle = 0.5 + 0.5 * sin(uTime * 3.0 + aPhase * 12.0);
    gl_PointSize = (3.0 + twinkle * 4.0);
    vAlpha = 0.4 + twinkle * 0.6;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const innerSparklesFrag = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float glow = 0.04 / (d + 0.04);
    gl_FragColor = vec4(vColor * 1.5, glow * vAlpha);
  }
`;

/* ═══════════ CAUSTIC PLANE SHADER ═══════════ */
const causticFrag = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv * 8.0;
    float t = uTime * 0.5;
    float r = sin(uv.x * 1.2 + t * 0.7) * sin(uv.y * 1.5 + t * 0.9);
    float g = sin(uv.x * 1.3 + t * 0.8 + 2.094) * sin(uv.y * 1.4 + t * 1.1 + 2.094);
    float b = sin(uv.x * 1.1 + t * 0.6 + 4.189) * sin(uv.y * 1.6 + t * 1.0 + 4.189);
    r = r * r; g = g * g; b = b * b;
    // Edge fade
    vec2 center = vUv - 0.5;
    float fade = 1.0 - smoothstep(0.3, 0.5, length(center));
    gl_FragColor = vec4(r, g, b, max(max(r, g), b) * fade * 0.2);
  }
`;

/* ═══════════ TEXTURE GENERATORS ═══════════ */

function createEyeTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2, cy = size / 2;

  const scleraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 52);
  scleraGrad.addColorStop(0, 'rgba(255,255,255,0.98)');
  scleraGrad.addColorStop(0.7, 'rgba(240,235,255,0.96)');
  scleraGrad.addColorStop(1, 'rgba(200,195,220,0.85)');
  ctx.beginPath();
  ctx.ellipse(cx, cy, 52, 44, 0, 0, Math.PI * 2);
  ctx.fillStyle = scleraGrad;
  ctx.fill();

  const irisGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 26);
  irisGrad.addColorStop(0, '#1a0533');
  irisGrad.addColorStop(0.25, '#4c1d95');
  irisGrad.addColorStop(0.5, '#6d28d9');
  irisGrad.addColorStop(0.75, '#7c3aed');
  irisGrad.addColorStop(1, '#a78bfa');
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fillStyle = irisGrad;
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 9, cy + Math.sin(angle) * 9);
    ctx.lineTo(cx + Math.cos(angle) * 25, cy + Math.sin(angle) * 25);
    ctx.strokeStyle = i % 3 === 0 ? '#c4b5fd' : '#8b5cf6';
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#030012';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx + 11, cy - 11, 7, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx - 8, cy + 8, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx + 5, cy - 16, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function createStarTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2, cy = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.08, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.25, 'rgba(220,200,255,0.35)');
  grad.addColorStop(1, 'rgba(200,180,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.5;
  for (let angle = 0; angle < Math.PI; angle += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 28, cy + Math.sin(angle) * 28);
    ctx.lineTo(cx - Math.cos(angle) * 28, cy - Math.sin(angle) * 28);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/* ═══════════ SITE BACKGROUND TEXTURE (for MTM refraction) ═══════════ */
function createSiteBackgroundTexture() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');

  // Dark gradient background
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#050510');
  bg.addColorStop(1, '#0a0a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Bento-like grid cells
  const cells = [
    { x: 20, y: 20, w: 200, h: 120, border: '#7c3aed' },
    { x: 240, y: 20, w: 250, h: 120, border: '#38bdf8' },
    { x: 20, y: 160, w: 140, h: 160, border: '#f472b6' },
    { x: 180, y: 160, w: 160, h: 160, border: '#22c55e' },
    { x: 360, y: 160, w: 130, h: 160, border: '#facc15' },
    { x: 20, y: 340, w: 230, h: 150, border: '#9333ea' },
    { x: 270, y: 340, w: 220, h: 150, border: '#06b6d4' },
  ];

  cells.forEach(cell => {
    ctx.fillStyle = 'rgba(15, 15, 18, 0.8)';
    ctx.strokeStyle = cell.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cell.x, cell.y, cell.w, cell.h, 12);
    ctx.fill();
    ctx.stroke();

    // Faint text-like horizontal bars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    for (let i = 0; i < 3; i++) {
      const bw = 40 + Math.random() * (cell.w * 0.5);
      ctx.fillRect(cell.x + 15, cell.y + 25 + i * 18, bw, 6);
    }
  });

  // Radial glow spots
  const glows = [
    { x: 120, y: 80, r: 60, color: 'rgba(124, 58, 237, 0.15)' },
    { x: 380, y: 240, r: 80, color: 'rgba(56, 189, 248, 0.12)' },
    { x: 256, y: 420, r: 70, color: 'rgba(244, 114, 182, 0.10)' },
  ];
  glows.forEach(g => {
    const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
    grad.addColorStop(0, g.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/* ═══════════ REFRACTION BACKGROUND PLANE ═══════════ */
function RefractionBackground({ texture }) {
  return (
    <mesh position={[0, 0, -4]}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial map={texture} transparent opacity={0.8} />
    </mesh>
  );
}

/* ═══════════ PRISM BODY: High-quality glass with breathing ═══════════ */
function PrismBody({ backgroundTex }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.2;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.12;
    // Breathing scale
    const breath = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.015;
    meshRef.current.scale.setScalar(breath);
  });

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[1, 1, 1.8, 3]} />
      <MeshTransmissionMaterial
        transmission={1}
        ior={2.4}
        chromaticAberration={1.5}
        backside
        backsideThickness={2}
        thickness={2}
        roughness={0}
        samples={10}
        resolution={256}
        distortion={0.15}
        temporalDistortion={0.4}
        color="#f0e8ff"
        anisotropy={0.3}
        background={backgroundTex}
      />
    </mesh>
  );
}

/* ═══════════ MOUSE DRIFT GROUP: prism drifts toward cursor ═══════════ */
function MouseDriftGroup({ children }) {
  const groupRef = useRef();
  const driftTarget = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!groupRef.current) return;
    driftTarget.current.set(mousePos.x * 0.4, mousePos.y * 0.4, 0);
    groupRef.current.position.lerp(driftTarget.current, 0.02);
    // Subtle Z-axis tilt toward mouse direction
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      mousePos.x * -0.08,
      0.03
    );
  });

  return <group ref={groupRef}>{children}</group>;
}

/* ═══════════ GLASS ORB EYE: marble with iris inside ═══════════ */
function GlassOrbEye() {
  const groupRef = useRef();
  const orbRef = useRef();
  const eyeTexture = useMemo(() => createEyeTexture(), []);
  const prevMouse = useRef(new THREE.Vector2(0, 0));

  useFrame((state) => {
    if (!groupRef.current) return;
    // Variable lerp based on mouse velocity
    const dx = mousePos.x - prevMouse.current.x;
    const dy = mousePos.y - prevMouse.current.y;
    const velocity = Math.sqrt(dx * dx + dy * dy);
    const lerpFactor = 0.04 + Math.min(velocity * 2, 0.12);
    prevMouse.current.set(mousePos.x, mousePos.y);

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x, mousePos.y * 0.4, lerpFactor
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, mousePos.x * 0.4, lerpFactor
    );
    if (orbRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.04;
      orbRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={orbRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshPhysicalMaterial
          color="#e8e0ff"
          metalness={0.05}
          roughness={0.02}
          clearcoat={1}
          clearcoatRoughness={0}
          envMapIntensity={2}
          transparent
          opacity={0.35}
        />
      </mesh>
      <sprite scale={[0.55, 0.46, 1]}>
        <spriteMaterial map={eyeTexture} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

/* ═══════════ INCOMING WHITE BEAM (mouse-responsive angle) ═══════════ */
function IncomingBeam() {
  const matRef = useRef();
  const meshRef = useRef();
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(5, 0.6);
    g.translate(-2.5, 0, 0);
    return g;
  }, []);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.uniforms.uOpacity.value =
      0.85 + Math.sin(state.clock.elapsedTime * 2.5) * 0.1;
    // Slight angle tracking from mouse
    if (meshRef.current) {
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        -0.1 + mousePos.y * 0.05,
        0.03
      );
    }
  });

  return (
    <mesh ref={meshRef} position={[-0.6, 0.15, 0.05]} rotation={[0, 0, -0.1]} geometry={geo}>
      <shaderMaterial
        ref={matRef}
        vertexShader={simpleVert}
        fragmentShader={beamFrag}
        uniforms={{
          uTime: { value: 0 },
          uOpacity: { value: 0.9 },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ═══════════ RAINBOW FAN: 7 vivid color bands (mouse-responsive) ═══════════ */
const RAINBOW_BANDS = [
  { color: new THREE.Color('#ff1a1a'), angle: -0.30 },
  { color: new THREE.Color('#ff7700'), angle: -0.20 },
  { color: new THREE.Color('#ffdd00'), angle: -0.10 },
  { color: new THREE.Color('#22dd44'), angle: 0.00 },
  { color: new THREE.Color('#2288ff'), angle: 0.10 },
  { color: new THREE.Color('#5533ff'), angle: 0.20 },
  { color: new THREE.Color('#aa22ff'), angle: 0.30 },
];

function RainbowFan() {
  const raysRef = useRef([]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(5.5, 0.4);
    g.translate(2.75, 0, 0);
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const mouseAngleOffset = mousePos.x * 0.05;
    raysRef.current.forEach((mesh, i) => {
      if (!mesh?.material?.uniforms) return;
      const wave = Math.sin(t * 1.0 + i * 0.9) * 0.012;
      mesh.rotation.z = RAINBOW_BANDS[i].angle + wave + mouseAngleOffset;
      mesh.material.uniforms.uOpacity.value =
        0.65 + Math.sin(t * 1.8 + i * 1.3) * 0.2;
      mesh.material.uniforms.uTime.value = t;
    });
  });

  return (
    <group position={[0.85, -0.1, 0.05]}>
      {RAINBOW_BANDS.map((band, i) => (
        <mesh
          key={i}
          ref={el => (raysRef.current[i] = el)}
          rotation={[0, 0, band.angle]}
          geometry={geo}
        >
          <shaderMaterial
            vertexShader={simpleVert}
            fragmentShader={rayFrag}
            uniforms={{
              uColor: { value: band.color },
              uOpacity: { value: 0.7 },
              uTime: { value: 0 },
            }}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════ VERTEX STAR-BURSTS ═══════════ */
function VertexHighlights() {
  const starTex = useMemo(() => createStarTexture(), []);
  const spritesRef = useRef([]);

  const vertices = useMemo(() => {
    const r = 1, h = 0.9;
    const s = Math.sin((2 * Math.PI) / 3) * r;
    const c2 = Math.cos((2 * Math.PI) / 3) * r;
    return [
      [r, h, 0], [c2, h, s], [c2, h, -s],
      [r, -h, 0], [c2, -h, s], [c2, -h, -s],
    ];
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    spritesRef.current.forEach((sprite, i) => {
      if (!sprite) return;
      const pulse = 0.3 + Math.sin(t * 3.5 + i * 1.1) * 0.12;
      sprite.scale.set(pulse, pulse, 1);
    });
  });

  return (
    <>
      {vertices.map((pos, i) => (
        <sprite
          key={i}
          ref={el => (spritesRef.current[i] = el)}
          position={pos}
          scale={[0.3, 0.3, 1]}
        >
          <spriteMaterial
            map={starTex}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </>
  );
}

/* ═══════════ EDGE GLOW WIREFRAME ═══════════ */
function EdgeGlow() {
  return (
    <mesh>
      <cylinderGeometry args={[1.008, 1.008, 1.82, 3]} />
      <meshBasicMaterial
        wireframe
        color="#c4b5fd"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ═══════════ INTERNAL COLOR-CYCLING GLOW LIGHT ═══════════ */
function InternalGlow() {
  const lightRef = useRef();

  useFrame((state) => {
    if (!lightRef.current) return;
    const hue = (state.clock.elapsedTime * 0.08) % 1;
    lightRef.current.color.setHSL(hue, 0.8, 0.6);
  });

  return <pointLight ref={lightRef} position={[0, 0, 0]} intensity={1} distance={3} />;
}

/* ═══════════ BLOBBY GLOW LAYER (replaces rigid AuraSphere) ═══════════ */
const AURA_COLORS = [
  new THREE.Color('#1e1b4b'),
  new THREE.Color('#312e81'),
  new THREE.Color('#3730a3'),
  new THREE.Color('#1e3a5f'),
];

function BlobbyGlowLayer({ scale = 2.5, noiseOffset = 0, baseColor }) {
  const matRef = useRef();

  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.elapsedTime;
    const idx = Math.floor(t * 0.2) % AURA_COLORS.length;
    const next = (idx + 1) % AURA_COLORS.length;
    const frac = (t * 0.2) % 1;
    const color = AURA_COLORS[idx].clone().lerp(AURA_COLORS[next], frac);
    if (baseColor) color.lerp(new THREE.Color(baseColor), 0.3);
    matRef.current.uniforms.uColor.value.copy(color);
    matRef.current.uniforms.uTime.value = t;
    matRef.current.uniforms.uMouse.value.set(mousePos.x, mousePos.y);
  });

  return (
    <mesh scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={blobbyAuraVert}
        fragmentShader={blobbyAuraFrag}
        uniforms={{
          uColor: { value: new THREE.Color(baseColor || '#1e1b4b') },
          uTime: { value: 0 },
          uNoiseOffset: { value: noiseOffset },
          uMouse: { value: new THREE.Vector2(0, 0) },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

/* ═══════════ INNER SPARKLES: rainbow points inside prism ═══════════ */
function InnerSparkles() {
  const matRef = useRef();
  const ROYGBV = [
    new THREE.Color('#ff1a1a'), new THREE.Color('#ff7700'),
    new THREE.Color('#ffdd00'), new THREE.Color('#22dd44'),
    new THREE.Color('#2288ff'), new THREE.Color('#aa22ff'),
  ];

  const geo = useMemo(() => {
    const count = 30;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    // Triangle prism rejection sampling
    const isInsideTriPrism = (x, y, z) => {
      if (Math.abs(z) > 0.85) return false;
      const r = 0.85;
      const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      const vx = angles.map(a => Math.cos(a) * r);
      const vy = angles.map(a => Math.sin(a) * r);
      // Point-in-triangle test (barycentric)
      const d1 = (x - vx[1]) * (vy[0] - vy[1]) - (vx[0] - vx[1]) * (y - vy[1]);
      const d2 = (x - vx[2]) * (vy[1] - vy[2]) - (vx[1] - vx[2]) * (y - vy[2]);
      const d3 = (x - vx[0]) * (vy[2] - vy[0]) - (vx[2] - vx[0]) * (y - vy[0]);
      const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      return !(hasNeg && hasPos);
    };

    let placed = 0;
    while (placed < count) {
      const x = (Math.random() - 0.5) * 1.8;
      const y = (Math.random() - 0.5) * 1.8;
      const z = (Math.random() - 0.5) * 1.6;
      if (isInsideTriPrism(x, y, z)) {
        positions[placed * 3] = x;
        positions[placed * 3 + 1] = z; // swap y/z for cylinder orientation
        positions[placed * 3 + 2] = y;
        phases[placed] = Math.random();
        const c = ROYGBV[placed % ROYGBV.length];
        colors[placed * 3] = c.r;
        colors[placed * 3 + 1] = c.g;
        colors[placed * 3 + 2] = c.b;
        placed++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, []);

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points geometry={geo}>
      <shaderMaterial
        ref={matRef}
        vertexShader={innerSparklesVert}
        fragmentShader={innerSparklesFrag}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ═══════════ ORBITING RING: 24 particles in tilted orbit ═══════════ */
function OrbitingRing() {
  const pointsRef = useRef();
  const COUNT = 24;
  const RADIUS = 2.8;

  const geo = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;
    const posArr = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2 + t * 0.3;
      posArr[i * 3] = Math.cos(angle) * RADIUS;
      posArr[i * 3 + 1] = Math.sin(angle * 2) * 0.15;
      posArr[i * 3 + 2] = Math.sin(angle) * RADIUS;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <group rotation={[0.3, 0, 0.2]}>
      <points ref={pointsRef} geometry={geo}>
        <pointsMaterial
          color="#c4b5fd"
          size={0.08}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

/* ═══════════ CAUSTIC PLANE: animated rainbow interference ═══════════ */
function CausticPlane() {
  const matRef = useRef();

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={[1.5, -0.5, -1]} rotation={[-0.3, 0.2, 0.1]}>
      <planeGeometry args={[3, 3]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={simpleVert}
        fragmentShader={causticFrag}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ═══════════ MAIN COMPONENT ═══════════ */
export default function Prism3D() {
  const bgTexture = useMemo(() => createSiteBackgroundTexture(), []);

  useEffect(() => {
    const handler = (e) => {
      mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div
      className="prism-3d-canvas-wrapper"
      style={{ width: 280, height: 280, pointerEvents: 'none' }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: 'default' }}
        dpr={Math.min(1.5, typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1)}
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        {/* Dramatic multi-color lighting */}
        <ambientLight intensity={0.25} />
        <pointLight position={[-4, 3, 3]} color="#ffffff" intensity={2.5} />
        <pointLight position={[4, -1, 3]} color="#9333ea" intensity={1.5} />
        <pointLight position={[0, 3, 4]} color="#38bdf8" intensity={1.2} />
        <pointLight position={[-2, -2, 3]} color="#f472b6" intensity={0.8} />

        {/* Site-like background for refraction */}
        <RefractionBackground texture={bgTexture} />

        {/* Mouse gravity wrapper */}
        <MouseDriftGroup>
          <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
            <PrismBody backgroundTex={bgTexture} />
            <GlassOrbEye />
            <InternalGlow />
            <InnerSparkles />
            <VertexHighlights />
            <EdgeGlow />
            <IncomingBeam />
            <RainbowFan />

            {/* drei floating sparkles */}
            <Sparkles
              count={40}
              scale={[4, 4, 4]}
              size={2}
              speed={0.4}
              opacity={0.7}
              color="#c4b5fd"
              noise={1.5}
            />
          </Float>
        </MouseDriftGroup>

        {/* Orbiting particle ring */}
        <OrbitingRing />

        {/* Blobby organic aura layers (metaball feel) */}
        <BlobbyGlowLayer scale={2.2} noiseOffset={0} baseColor="#1e1b4b" />
        <BlobbyGlowLayer scale={2.8} noiseOffset={Math.PI} baseColor="#312e81" />

        {/* Rainbow caustic pattern */}
        <CausticPlane />
      </Canvas>
    </div>
  );
}
