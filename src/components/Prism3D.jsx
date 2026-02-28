import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial } from '@react-three/drei';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

/* ═══════════ Mouse tracking (window-level for eye follow) ═══════════ */
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

// Aura sphere: multi-layer fresnel rim
const auraVert = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;
const auraFrag = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
    float tightRim = pow(fresnel, 4.0) * 1.5;
    float wideRim = pow(fresnel, 1.8) * 0.3;
    float rim = tightRim + wideRim;
    rim *= 0.85 + 0.15 * sin(uTime * 1.5);
    gl_FragColor = vec4(uColor, rim);
  }
`;

/* ═══════════ TEXTURE GENERATORS ═══════════ */

function createEyeTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2, cy = size / 2;

  // Sclera with gradient
  const scleraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 52);
  scleraGrad.addColorStop(0, 'rgba(255,255,255,0.98)');
  scleraGrad.addColorStop(0.7, 'rgba(240,235,255,0.96)');
  scleraGrad.addColorStop(1, 'rgba(200,195,220,0.85)');
  ctx.beginPath();
  ctx.ellipse(cx, cy, 52, 44, 0, 0, Math.PI * 2);
  ctx.fillStyle = scleraGrad;
  ctx.fill();

  // Iris gradient
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

  // Iris texture streaks
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

  // Pupil
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#030012';
  ctx.fill();

  // Large highlight
  ctx.beginPath();
  ctx.arc(cx + 11, cy - 11, 7, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();

  // Secondary highlight
  ctx.beginPath();
  ctx.arc(cx - 8, cy + 8, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();

  // Tiny sparkle
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

  // Cross rays
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

/* ═══════════ PRISM BODY: High-quality glass ═══════════ */
function PrismBody() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.2;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.12;
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
      />
    </mesh>
  );
}

/* ═══════════ GLASS ORB EYE: marble with iris inside ═══════════ */
function GlassOrbEye() {
  const groupRef = useRef();
  const orbRef = useRef();
  const eyeTexture = useMemo(() => createEyeTexture(), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Smooth mouse tracking
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x, mousePos.y * 0.3, 0.04
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, mousePos.x * 0.3, 0.04
    );
    // Pulsing orb scale
    if (orbRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.04;
      orbRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Glass marble outer shell */}
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
      {/* Eye sprite inside */}
      <sprite scale={[0.55, 0.46, 1]}>
        <spriteMaterial map={eyeTexture} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

/* ═══════════ INCOMING WHITE BEAM ═══════════ */
function IncomingBeam() {
  const matRef = useRef();
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
  });

  return (
    <mesh position={[-0.6, 0.15, 0.05]} rotation={[0, 0, -0.1]} geometry={geo}>
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

/* ═══════════ RAINBOW FAN: 7 vivid color bands ═══════════ */
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
    g.translate(2.75, 0, 0); // extends from 0 to 5.5 along +X
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    raysRef.current.forEach((mesh, i) => {
      if (!mesh?.material?.uniforms) return;
      const wave = Math.sin(t * 1.0 + i * 0.9) * 0.012;
      mesh.rotation.z = RAINBOW_BANDS[i].angle + wave;
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

/* ═══════════ AURA SPHERE: deep indigo/blue ═══════════ */
const AURA_COLORS = [
  new THREE.Color('#1e1b4b'),
  new THREE.Color('#312e81'),
  new THREE.Color('#3730a3'),
  new THREE.Color('#1e3a5f'),
];

function AuraSphere() {
  const matRef = useRef();

  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.elapsedTime;
    const idx = Math.floor(t * 0.2) % AURA_COLORS.length;
    const next = (idx + 1) % AURA_COLORS.length;
    const frac = (t * 0.2) % 1;
    const color = AURA_COLORS[idx].clone().lerp(AURA_COLORS[next], frac);
    matRef.current.uniforms.uColor.value.copy(color);
    matRef.current.uniforms.uTime.value = t;
  });

  return (
    <mesh scale={2.5}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={auraVert}
        fragmentShader={auraFrag}
        uniforms={{
          uColor: { value: new THREE.Color('#1e1b4b') },
          uTime: { value: 0 },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

/* ═══════════ MAIN COMPONENT ═══════════ */
export default function Prism3D() {
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

        <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
          <PrismBody />
          <GlassOrbEye />
          <InternalGlow />
          <VertexHighlights />
          <EdgeGlow />
          <IncomingBeam />
          <RainbowFan />
        </Float>

        <AuraSphere />
      </Canvas>
    </div>
  );
}
