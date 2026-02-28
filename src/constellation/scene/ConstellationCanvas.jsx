import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useConstellationStore } from '../store';
import { computeHelixLayout, getHelixCenter, getHelixBounds } from '../layout/helixLayout';
import mockData from '../data/mock-constellation.json';
import NodeCloud from './NodeCloud';
import HoverLabel from './HoverLabel';
import CameraController from './CameraController';
import Starfield from './Starfield';

/**
 * GPU tier-based configuration.
 * Capped at tier 2 to keep texture/geometry count low and avoid WebGL context loss.
 */
function getGPUConfig(tier) {
  if (tier <= 1) {
    return {
      bloom: false,
      pulseAnimation: false,
      starParticles: 0,
      dpr: 1,
      sphereSegments: 8,
    };
  }
  // Tier 2+ — bloom, stars, pulse (no nebula fog — it renders as ugly rectangles)
  return {
    bloom: true,
    pulseAnimation: true,
    starParticles: 4000,
    dpr: Math.min(1.5, window.devicePixelRatio),
    sphereSegments: 12,
  };
}

/**
 * Detect GPU tier synchronously before Canvas mounts.
 */
function detectGPUTier() {
  const cores = navigator.hardwareConcurrency || 2;
  const mobile = /Mobi|Android/i.test(navigator.userAgent);
  if (mobile || cores <= 2) return 1;
  return 2; // cap at 2 — tier 3 creates too many resources for StrictMode double-mount
}

/**
 * Main R3F Canvas for the constellation scene.
 */
export default function ConstellationCanvas() {
  const rendererRef = useRef();
  const controlsRef = useRef();
  const setGpuTier = useConstellationStore((s) => s.setGpuTier);
  const [gpuConfig] = useState(() => {
    const tier = detectGPUTier();
    setGpuTier(tier);
    return getGPUConfig(tier);
  });

  // Compute helix layout once
  const layoutNodes = useMemo(
    () => computeHelixLayout(mockData.nodes),
    []
  );

  // Helix center for camera target
  const center = useMemo(() => getHelixCenter(layoutNodes), [layoutNodes]);

  // Helix vertical bounds for timeline scrubber
  const helixBounds = useMemo(() => getHelixBounds(layoutNodes), [layoutNodes]);

  // Disposal verification on unmount
  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        const info = rendererRef.current.info.memory;
        console.log(
          'Constellation unmount - geometries:',
          info.geometries,
          'textures:',
          info.textures
        );
      }
    };
  }, []);

  return (
    <Canvas
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{
        position: [0, center.y, 80],
        fov: 60,
      }}
      dpr={gpuConfig.dpr}
      onCreated={({ gl }) => {
        rendererRef.current = gl;
        const canvas = gl.domElement;
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          console.warn('Constellation: WebGL context lost, will restore');
        });
        canvas.addEventListener('webglcontextrestored', () => {
          console.log('Constellation: WebGL context restored');
        });
      }}
    >
      <OrbitControls
        ref={controlsRef}
        autoRotate
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.05}
        enablePan={false}
        minPolarAngle={Math.PI * (15 / 180)}
        maxPolarAngle={Math.PI * (165 / 180)}
        minDistance={40}
        maxDistance={120}
        target={[center.x, center.y, center.z]}
      />

      <CameraController
        controlsRef={controlsRef}
        positions={layoutNodes}
        helixBounds={helixBounds}
      />

      <HoverLabel />

      <ambientLight intensity={0.15} />

      <NodeCloud
        nodes={layoutNodes}
        gpuConfig={gpuConfig}
      />

      <Starfield starCount={gpuConfig.starParticles} />

      {gpuConfig.bloom && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={1}
            luminanceSmoothing={0.9}
            intensity={0.5}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}
