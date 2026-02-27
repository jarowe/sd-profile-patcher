import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useDetectGPU } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useConstellationStore } from '../store';
import { computeHelixLayout, getHelixCenter } from '../layout/helixLayout';
import mockData from '../data/mock-constellation.json';
import NodeCloud from './NodeCloud';
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
 * Component that runs inside the Canvas to detect GPU tier.
 * Must be inside Canvas tree to access WebGL context.
 */
function GPUDetector({ onDetect }) {
  const gpu = useDetectGPU();
  useEffect(() => {
    if (gpu) {
      const tier = gpu.tier ?? 1;
      onDetect(tier);
    }
  }, [gpu, onDetect]);
  return null;
}

/**
 * Auto-orbit controller with pause on interaction, resume after idle.
 */
function CameraController({ controlsRef }) {
  const autoRotateTimer = useRef(null);
  const rampInterval = useRef(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      controls.autoRotate = false;
      if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
      if (rampInterval.current) clearInterval(rampInterval.current);
    };

    const handleEnd = () => {
      autoRotateTimer.current = setTimeout(() => {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0;
        rampInterval.current = setInterval(() => {
          if (controls.autoRotateSpeed < 0.5) {
            controls.autoRotateSpeed += 0.02;
          } else {
            controls.autoRotateSpeed = 0.5;
            clearInterval(rampInterval.current);
          }
        }, 50);
      }, 5000);
    };

    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
      if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
      if (rampInterval.current) clearInterval(rampInterval.current);
    };
  }, [controlsRef]);

  return null;
}

/**
 * Main R3F Canvas for the constellation scene.
 */
export default function ConstellationCanvas() {
  const rendererRef = useRef();
  const controlsRef = useRef();
  const setGpuTier = useConstellationStore((s) => s.setGpuTier);
  const [gpuConfig, setGpuConfig] = useState(() => getGPUConfig(2)); // default medium until detected

  // Compute helix layout once
  const layoutNodes = useMemo(
    () => computeHelixLayout(mockData.nodes),
    []
  );

  // Helix center for camera target
  const center = useMemo(() => getHelixCenter(layoutNodes), [layoutNodes]);

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

  const handleGPUDetect = useMemo(
    () => (tier) => {
      setGpuTier(tier);
      setGpuConfig(getGPUConfig(tier));
    },
    [setGpuTier]
  );

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
      gl={{ antialias: true }}
      camera={{
        position: [0, center.y, 80],
        fov: 60,
      }}
      dpr={gpuConfig.dpr}
      onCreated={({ gl }) => {
        rendererRef.current = gl;
      }}
    >
      <GPUDetector onDetect={handleGPUDetect} />

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

      <CameraController controlsRef={controlsRef} />

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
