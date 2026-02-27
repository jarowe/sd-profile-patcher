import { useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { useConstellationStore } from '../store';
import mockData from '../data/mock-constellation.json';
import { computeHelixLayout } from '../layout/helixLayout';

/**
 * 3D billboard hover label that appears above the hovered node.
 * Shows node title only (clean, fast -- type/date visible on click in detail panel).
 */
export default function HoverLabel() {
  const hoveredNodeIdx = useConstellationStore((s) => s.hoveredNodeIdx);

  // Reuse the same layout positions as NodeCloud
  const layoutNodes = useMemo(
    () => computeHelixLayout(mockData.nodes),
    []
  );

  if (hoveredNodeIdx === null || hoveredNodeIdx >= layoutNodes.length) {
    return null;
  }

  const node = layoutNodes[hoveredNodeIdx];
  const yOffset = node.size + 1.5;

  return (
    <Billboard follow position={[node.x, node.y + yOffset, node.z]}>
      <Text
        fontSize={1.2}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.05}
        outlineColor="black"
        maxWidth={20}
      >
        {node.title}
      </Text>
    </Billboard>
  );
}
