import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useConstellationStore } from '../store';

const dummy = new THREE.Object3D();
const tempColor = new THREE.Color();

/** Node type color palette */
const NODE_COLORS = {
  project: '#f59e0b',   // amber
  moment: '#f87171',    // coral
  person: '#a78bfa',    // violet
  place: '#2dd4bf',     // teal
  idea: '#22d3ee',      // cyan
  milestone: '#fbbf24', // gold
};

/**
 * Instanced mesh rendering all constellation nodes.
 * Uses InstancedBufferAttribute for per-instance color.
 * Breathing pulse animation via useFrame (when enabled).
 */
export default function NodeCloud({ nodes, gpuConfig }) {
  const meshRef = useRef();
  const count = nodes.length;

  const focusNode = useConstellationStore((s) => s.focusNode);
  const setHoveredNode = useConstellationStore((s) => s.setHoveredNode);

  // Pre-compute per-instance colors
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    nodes.forEach((node, i) => {
      tempColor.set(NODE_COLORS[node.type] || '#ffffff');
      arr[i * 3] = tempColor.r;
      arr[i * 3 + 1] = tempColor.g;
      arr[i * 3 + 2] = tempColor.b;
    });
    return arr;
  }, [nodes, count]);

  // Pre-compute base scales for breathing animation
  const baseScales = useMemo(
    () => nodes.map((n) => n.size),
    [nodes]
  );

  // Set initial instance transforms
  useEffect(() => {
    if (!meshRef.current) return;

    nodes.forEach((node, i) => {
      dummy.position.set(node.x, node.y, node.z);
      dummy.scale.setScalar(node.size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
  }, [nodes]);

  // Breathing pulse animation
  useFrame(({ clock }) => {
    if (!gpuConfig.pulseAnimation || !meshRef.current) return;

    const time = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const breathe = Math.sin(time * 0.5 + i * 0.3) * 0.05 + 1.0; // 0.95 - 1.05 range
      const scale = baseScales[i] * breathe;

      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && e.instanceId < nodes.length) {
      focusNode(nodes[e.instanceId].id);
    }
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      setHoveredNode(e.instanceId);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHoveredNode(null);
    document.body.style.cursor = 'default';
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, count]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <sphereGeometry
        args={[1, gpuConfig.sphereSegments, gpuConfig.sphereSegments]}
      />
      <meshStandardMaterial
        emissive="white"
        emissiveIntensity={1.5}
        toneMapped={false}
        vertexColors
      >
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </meshStandardMaterial>
    </instancedMesh>
  );
}
