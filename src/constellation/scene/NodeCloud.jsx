import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useConstellationStore } from '../store';
import mockData from '../data/mock-constellation.json';

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
 * Get IDs of nodes connected to a given node (from edges).
 */
function getConnectedIds(nodeId) {
  const connected = new Set();
  connected.add(nodeId);
  for (const edge of mockData.edges) {
    if (edge.source === nodeId) connected.add(edge.target);
    if (edge.target === nodeId) connected.add(edge.source);
  }
  return connected;
}

/**
 * Get IDs of nodes matching a filter entity (nodes connected through that entity).
 * Finds all nodes that have the entity label in their connected edges' evidence
 * or whose title matches the entity label.
 */
function getFilteredNodeIds(filterEntity) {
  if (!filterEntity) return null;
  const matching = new Set();

  // Find all nodes whose title matches the entity label
  for (const node of mockData.nodes) {
    if (node.title === filterEntity.value) {
      matching.add(node.id);
      // Also add all connected nodes
      for (const edge of mockData.edges) {
        if (edge.source === node.id) matching.add(edge.target);
        if (edge.target === node.id) matching.add(edge.source);
      }
    }
  }

  return matching.size > 0 ? matching : null;
}

/**
 * Instanced mesh rendering all constellation nodes.
 * Uses InstancedBufferAttribute for per-instance color.
 * Breathing pulse animation via useFrame (when enabled).
 * Focus dimming: non-connected nodes dim to ~15% opacity on focus.
 * Entity filter dimming: non-matching nodes dim when filter active.
 */
export default function NodeCloud({ nodes, gpuConfig }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const count = nodes.length;

  const focusNode = useConstellationStore((s) => s.focusNode);
  const setHoveredNode = useConstellationStore((s) => s.setHoveredNode);
  const focusedNodeId = useConstellationStore((s) => s.focusedNodeId);
  const filterEntity = useConstellationStore((s) => s.filterEntity);

  // Pre-compute per-instance base colors
  const baseColors = useMemo(() => {
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

  // Working color array that gets modified for dimming
  const colors = useMemo(() => new Float32Array(baseColors), [baseColors]);

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

  // Focus dimming and entity filter dimming
  useEffect(() => {
    if (!meshRef.current) return;

    let activeIds = null;

    if (focusedNodeId) {
      activeIds = getConnectedIds(focusedNodeId);
    } else if (filterEntity) {
      activeIds = getFilteredNodeIds(filterEntity);
    }

    // Update per-instance colors based on active state
    const colorAttr = meshRef.current.geometry.getAttribute('color');
    if (!colorAttr) return;

    for (let i = 0; i < count; i++) {
      const nodeId = nodes[i].id;
      let dimFactor = 1.0;

      if (activeIds) {
        if (!activeIds.has(nodeId)) {
          dimFactor = 0.15; // Ghost non-connected/non-matching nodes
        } else if (nodeId === focusedNodeId) {
          dimFactor = 1.3; // Brighter for focused node
        }
      }

      colorAttr.array[i * 3] = Math.min(1, baseColors[i * 3] * dimFactor);
      colorAttr.array[i * 3 + 1] = Math.min(1, baseColors[i * 3 + 1] * dimFactor);
      colorAttr.array[i * 3 + 2] = Math.min(1, baseColors[i * 3 + 2] * dimFactor);
    }

    colorAttr.needsUpdate = true;

    // Update emissive intensity for focused node
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = focusedNodeId ? 2.0 : 1.5;
    }
  }, [focusedNodeId, filterEntity, nodes, count, baseColors]);

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
      >
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </sphereGeometry>
      <meshStandardMaterial
        ref={materialRef}
        emissive="white"
        emissiveIntensity={1.5}
        toneMapped={false}
        vertexColors
      />
    </instancedMesh>
  );
}
