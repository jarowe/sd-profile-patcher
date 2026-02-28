import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

/* ── Ray shader: gradient alpha from base to tip ── */
const rayVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const rayFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float alpha = smoothstep(1.0, 0.0, vUv.y) * uOpacity;
    gl_FragColor = vec4(uColor, alpha * 0.7);
  }
`;

/* ── Aura shader: fresnel rim glow ── */
const auraVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;
const auraFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
    float rim = pow(fresnel, 2.5) * 0.8;
    gl_FragColor = vec4(uColor, rim);
  }
`;

/* ── Eye texture via Canvas2D ── */
function createEyeTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Sclera (white of eye)
  ctx.beginPath();
  ctx.ellipse(size / 2, size / 2, 48, 40, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fill();

  // Outer iris ring
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#6d28d9';
  ctx.fill();

  // Inner iris
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#4c1d95';
  ctx.fill();

  // Pupil
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#050510';
  ctx.fill();

  // Main highlight
  ctx.beginPath();
  ctx.arc(size / 2 + 8, size / 2 - 8, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fill();

  // Secondary highlight
  ctx.beginPath();
  ctx.arc(size / 2 - 6, size / 2 + 5, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/* ── PrismEye: sprite inside the glass ── */
function PrismEye() {
  const spriteRef = useRef();
  const texture = useMemo(() => createEyeTexture(), []);

  useFrame((state) => {
    if (!spriteRef.current) return;
    // Gentle pulsing scale
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
    spriteRef.current.scale.set(0.55 * pulse, 0.45 * pulse, 1);
  });

  return (
    <sprite ref={spriteRef} position={[0, 0.05, 0]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

/* ── VolumetricRays: 6 ROYGBV prismatic beams ── */
const RAY_COLORS = [
  { color: new THREE.Color('#ff4444'), angle: -15 },
  { color: new THREE.Color('#ff9900'), angle: -9 },
  { color: new THREE.Color('#ffdd00'), angle: -3 },
  { color: new THREE.Color('#22cc66'), angle: 3 },
  { color: new THREE.Color('#4499ff'), angle: 9 },
  { color: new THREE.Color('#9944ff'), angle: 15 },
];

function VolumetricRays() {
  const raysRef = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    raysRef.current.forEach((ray, i) => {
      if (!ray) return;
      // Gentle wave motion
      const wave = Math.sin(t * 1.5 + i * 0.8) * 0.03;
      ray.rotation.z = ((RAY_COLORS[i].angle + wave * 30) * Math.PI) / 180;
      // Opacity pulsing
      if (ray.material?.uniforms?.uOpacity) {
        ray.material.uniforms.uOpacity.value =
          0.6 + Math.sin(t * 2 + i * 1.2) * 0.25;
      }
    });
  });

  return (
    <group position={[0.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
      {RAY_COLORS.map((ray, i) => (
        <mesh
          key={i}
          ref={(el) => (raysRef.current[i] = el)}
          rotation={[0, 0, (ray.angle * Math.PI) / 180]}
          position={[0, 0, 0]}
        >
          <coneGeometry args={[0.15, 4, 8, 1, true]} />
          <shaderMaterial
            vertexShader={rayVertexShader}
            fragmentShader={rayFragmentShader}
            uniforms={{
              uColor: { value: ray.color },
              uOpacity: { value: 0.7 },
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

/* ── AuraGlow: color-cycling fresnel sphere ── */
const AURA_COLORS = [
  new THREE.Color('#7c3aed'),
  new THREE.Color('#06b6d4'),
  new THREE.Color('#ec4899'),
  new THREE.Color('#22c55e'),
];

function AuraGlow() {
  const matRef = useRef();

  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.elapsedTime;
    // Cycle through colors
    const idx = Math.floor(t * 0.3) % AURA_COLORS.length;
    const next = (idx + 1) % AURA_COLORS.length;
    const frac = (t * 0.3) % 1;
    const color = AURA_COLORS[idx].clone().lerp(AURA_COLORS[next], frac);
    matRef.current.uniforms.uColor.value.copy(color);
    matRef.current.uniforms.uTime.value = t;
  });

  return (
    <mesh scale={1.8}>
      <sphereGeometry args={[1, 16, 16]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={auraVertexShader}
        fragmentShader={auraFragmentShader}
        uniforms={{
          uColor: { value: new THREE.Color('#7c3aed') },
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

/* ── PrismGlass: triangular prism body ── */
function PrismGlass() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.3;
    meshRef.current.rotation.x += delta * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[1, 1, 1.8, 3]} />
      <MeshTransmissionMaterial
        transmission={1}
        ior={1.8}
        chromaticAberration={0.25}
        backside
        backsideThickness={1.5}
        thickness={1.5}
        roughness={0}
        samples={8}
        resolution={256}
        distortion={0.1}
        temporalDistortion={0.3}
        color="#e8e0ff"
      />
    </mesh>
  );
}

/* ── Main Prism3D component ── */
export default function Prism3D() {
  return (
    <div
      className="prism-3d-canvas-wrapper"
      style={{
        width: 220,
        height: 240,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: 'default' }}
        dpr={Math.min(1.5, typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1)}
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[-3, 2, 3]} color="#9333ea" intensity={1.5} />
        <pointLight position={[3, -1, 2]} color="#06b6d4" intensity={0.8} />
        <Float speed={3} rotationIntensity={0.4} floatIntensity={0.6}>
          <PrismGlass />
          <PrismEye />
        </Float>
        <VolumetricRays />
        <AuraGlow />
      </Canvas>
    </div>
  );
}
