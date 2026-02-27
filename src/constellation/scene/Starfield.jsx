import { Stars } from '@react-three/drei';

/**
 * Background twinkling star field.
 * Uses Drei <Stars> positioned well outside the helix radius.
 * Intensity kept low to avoid triggering bloom.
 */
export default function Starfield({ starCount }) {
  if (!starCount || starCount <= 0) return null;

  return (
    <Stars
      radius={200}
      depth={100}
      count={starCount}
      factor={4}
      saturation={0}
      fade
      speed={1}
    />
  );
}
