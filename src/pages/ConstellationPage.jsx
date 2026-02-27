import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConstellationStore } from '../constellation/store';
import ConstellationCanvas from '../constellation/scene/ConstellationCanvas';
import Toolbar from '../constellation/ui/Toolbar';
import TimelineScrubber from '../constellation/ui/TimelineScrubber';
import DetailPanel from '../constellation/ui/DetailPanel';
import MediaLightbox from '../constellation/ui/MediaLightbox';
import './ConstellationPage.css';

export default function ConstellationPage() {
  const viewMode = useConstellationStore((s) => s.viewMode);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Refs for back-button history state management
  const hasConstellationState = useRef(false);

  // Brief loading state while Canvas mounts
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // ---- Layered ESC key handler ----
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;

      const state = useConstellationStore.getState();

      // Layer 1: If lightbox open -> close lightbox (panel stays)
      if (state.lightboxMedia !== null) {
        e.preventDefault();
        state.closeLightbox();
        return;
      }

      // Layer 2: If detail panel open -> close panel
      if (state.focusedNodeId !== null) {
        e.preventDefault();
        state.clearFocus();
        return;
      }

      // Layer 3: Nothing open -> navigate away from constellation
      e.preventDefault();
      navigate(-1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // ---- Browser back button (popstate) handler ----
  // Push history state when a node is first focused
  const focusedNodeId = useConstellationStore((s) => s.focusedNodeId);

  useEffect(() => {
    if (focusedNodeId && !hasConstellationState.current) {
      // First focus: push a history entry so back button can close panel
      window.history.pushState({ constellation: true }, '');
      hasConstellationState.current = true;
    } else if (focusedNodeId && hasConstellationState.current) {
      // Subsequent focus: replace state (avoid stack overflow per pitfall #7)
      window.history.replaceState({ constellation: true }, '');
    } else if (!focusedNodeId && hasConstellationState.current) {
      // Panel closed via clearFocus: remove history state
      hasConstellationState.current = false;
    }
  }, [focusedNodeId]);

  useEffect(() => {
    const handlePopState = (e) => {
      const state = useConstellationStore.getState();

      // Layer 1: If lightbox open -> close lightbox
      if (state.lightboxMedia !== null) {
        state.closeLightbox();
        // Re-push state so back button still works for panel
        window.history.pushState({ constellation: true }, '');
        return;
      }

      // Layer 2: If panel open -> clear focus
      if (state.focusedNodeId !== null) {
        state.clearFocus();
        hasConstellationState.current = false;
        return;
      }

      // Layer 3: Navigate away (let browser handle default back)
      // Don't prevent -- the default popstate already navigated
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
          <DetailPanel />
          <MediaLightbox />
        </>
      ) : (
        <div className="constellation-loading">
          2D fallback coming in Plan 03
        </div>
      )}
    </div>
  );
}
