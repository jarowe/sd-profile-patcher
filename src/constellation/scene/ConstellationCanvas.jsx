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
import NebulaFog from './NebulaFog';

/**
 * GPU tier-based configuration.
 */
function getGPUConfig(tier) {
  if (tier <= 1) {
    // LOW: Aggressive cuts for mobile/weak GPU
    return {
      bloom: false,
      pulseAnimation: false,
      starParticles: 0,
      nebulaFog: false,
      dpr: 1,
      sphereSegments: 8,
    };
  }
  if (tier === 2) {
    // MEDIUM: Moderate effects
    return {
      bloom: true,
      pulseAnimation: true,
      starParticles: 4000,
      nebulaFog: false,
      dpr: 1.5,
      sphereSegments: 12,
    };
  }
  // HIGH (tier 3): Full effects
  return {
    bloom: true,
    pulseAnimation: true,
    starParticles: 8000,
    nebulaFog: true,
    dpr: 2,
    sphereSegments: 16,
  };
}

/**
 * Detect GPU tier synchronously before Canvas mounts.
 * Avoids creating a second WebGL context inside the Canvas tree.
 */
function detectGPUTier() {
  const cores = navigator.hardwareConcurrency || 2;
  const mobile = /Mobi|Android/i.test(navigator.userAgent);
  if (mobile || cores <= 2) return 1;
  if (cores <= 4) return 2;
  return 3;
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

  // Epoch centers for nebula fog
  const epochCenters = useMemo(() => {
    const epochMap = new Map();
    for (const node of layoutNodes) {
      if (!epochMap.has(node.epoch)) {
        epochMap.set(node.epoch, { sumX: 0, sumY: 0, sumZ: 0, count: 0 });
      }
      const e = epochMap.get(node.epoch);
      e.sumX += node.x;
      e.sumY += node.y;
      e.sumZ += node.z;
      e.count += 1;
    }
    return Array.from(epochMap.entries()).map(([epoch, e], idx) => ({
      epoch,
      x: e.sumX / e.count,
      y: e.sumY / e.count,
      z: e.sumZ / e.count,
      // Warm tones for older epochs, cooler for recent
      color: ['#fbbf24', '#f59e0b', '#f87171', '#a78bfa', '#22d3ee'][idx] || '#a78bfa',
    }));
  }, [layoutNodes]);

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
        // Handle WebGL context loss gracefully
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

      <NebulaFog
        epochCenters={epochCenters}
        enabled={gpuConfig.nebulaFog}
      />

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
