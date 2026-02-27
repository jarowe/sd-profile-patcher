import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Subtle nebula haze near epoch cluster cores.
 * Renders semi-transparent sprite billboards with soft color gradients.
 * Uses standard blending with very low opacity (per MEMORY.md: no FrontSide + AdditiveBlending).
 */
export default function NebulaFog({ epochCenters, enabled }) {
  if (!enabled || !epochCenters || epochCenters.length === 0) return null;

  return (
    <group>
      {epochCenters.map((ec, idx) => (
        <group key={ec.epoch}>
          {/* Primary large haze blob */}
          <Billboard position={[ec.x, ec.y, ec.z]}>
            <mesh>
              <planeGeometry args={[35, 35]} />
              <meshBasicMaterial
                transparent
                opacity={0.04}
                color={ec.color}
                side={THREE.FrontSide}
                depthWrite={false}
              />
            </mesh>
          </Billboard>
          {/* Secondary offset blob for depth */}
          <Billboard
            position={[ec.x + 8, ec.y + 3, ec.z - 5]}
          >
            <mesh>
              <planeGeometry args={[25, 25]} />
              <meshBasicMaterial
                transparent
                opacity={0.03}
                color={ec.color}
                side={THREE.FrontSide}
                depthWrite={false}
              />
            </mesh>
          </Billboard>
          {/* Tertiary small accent */}
          <Billboard
            position={[ec.x - 6, ec.y - 2, ec.z + 7]}
          >
            <mesh>
              <planeGeometry args={[20, 20]} />
              <meshBasicMaterial
                transparent
                opacity={0.05}
                color={ec.color}
                side={THREE.FrontSide}
                depthWrite={false}
              />
            </mesh>
          </Billboard>
        </group>
      ))}
    </group>
  );
}
