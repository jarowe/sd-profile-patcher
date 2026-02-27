import { useState, useEffect } from 'react';
import { useConstellationStore } from '../constellation/store';
import ConstellationCanvas from '../constellation/scene/ConstellationCanvas';
import Toolbar from '../constellation/ui/Toolbar';
import TimelineScrubber from '../constellation/ui/TimelineScrubber';
import './ConstellationPage.css';

export default function ConstellationPage() {
  const viewMode = useConstellationStore((s) => s.viewMode);
  const [loading, setLoading] = useState(true);

  // Brief loading state while Canvas mounts
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="constellation-page">
      {viewMode === '3d' ? (
        <>
          {loading && (
            <div className="constellation-loading">
              Initializing Constellation...
            </div>
          )}
          <ConstellationCanvas />
          <Toolbar />
          <TimelineScrubber />
        </>
      ) : (
        <div className="constellation-loading">
          2D fallback coming in Plan 03
        </div>
      )}
    </div>
  );
}
