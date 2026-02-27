import { House, RotateCcw, Box, List } from 'lucide-react';
import { useConstellationStore } from '../store';
import './Toolbar.css';

/**
 * Constellation toolbar overlay (DOM, not 3D).
 * Positioned top-right of viewport.
 * - Home/Reset: fly camera back to initial position, clear focus
 * - 3D/2D toggle: switch view mode (persisted to localStorage)
 */
export default function Toolbar() {
  const clearFocus = useConstellationStore((s) => s.clearFocus);
  const clearFilter = useConstellationStore((s) => s.clearFilter);
  const viewMode = useConstellationStore((s) => s.viewMode);
  const setViewMode = useConstellationStore((s) => s.setViewMode);
  const filterEntity = useConstellationStore((s) => s.filterEntity);

  const handleReset = () => {
    clearFocus();
    clearFilter();
  };

  const handleToggleView = () => {
    setViewMode(viewMode === '3d' ? '2d' : '3d');
  };

  return (
    <div className="constellation-toolbar">
      <button
        className="constellation-toolbar__btn"
        onClick={handleReset}
        title="Home / Reset view"
        aria-label="Reset constellation view"
      >
        <House size={18} />
      </button>

      <button
        className="constellation-toolbar__btn"
        onClick={handleToggleView}
        title={`Switch to ${viewMode === '3d' ? '2D List' : '3D Scene'}`}
        aria-label={`Switch to ${viewMode === '3d' ? '2D list' : '3D scene'} view`}
      >
        {viewMode === '3d' ? <List size={18} /> : <Box size={18} />}
      </button>

      {filterEntity && (
        <button
          className="constellation-toolbar__btn constellation-toolbar__btn--clear"
          onClick={clearFilter}
          title="Clear filter"
          aria-label="Clear entity filter"
        >
          <RotateCcw size={16} />
          <span className="constellation-toolbar__label">Clear</span>
        </button>
      )}
    </div>
  );
}
