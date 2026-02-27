import { create } from 'zustand';

const useConstellationStore = create((set) => ({
  // View mode: '3d' | '2d'
  viewMode: localStorage.getItem('constellation-view') || '3d',
  setViewMode: (mode) => {
    localStorage.setItem('constellation-view', mode);
    set({ viewMode: mode });
  },

  // GPU tier (set once on mount by GPUDetector)
  gpuTier: null,
  setGpuTier: (tier) => set({ gpuTier: tier }),

  // Node interaction
  focusedNodeId: null,
  hoveredNodeIdx: null,
  filterEntity: null,

  focusNode: (id) => set({ focusedNodeId: id }),
  clearFocus: () => set({ focusedNodeId: null, filterEntity: null }),
  setHoveredNode: (idx) => set({ hoveredNodeIdx: idx }),
  setFilterEntity: (entity) => set({ filterEntity: entity }),
  clearFilter: () => set({ filterEntity: null }),

  // Derived: panelOpen is true when a node is focused
  get panelOpen() {
    return this.focusedNodeId !== null;
  },

  // Lightbox
  lightboxMedia: null,
  lightboxIndex: 0,
  openLightbox: (media, index = 0) =>
    set({ lightboxMedia: media, lightboxIndex: index }),
  closeLightbox: () => set({ lightboxMedia: null, lightboxIndex: 0 }),

  // Timeline scrubber position (0-1 normalized)
  timelinePosition: 0,
  setTimelinePosition: (t) => set({ timelinePosition: t }),
}));

// Selector for panelOpen (derived state)
export const selectPanelOpen = (state) => state.focusedNodeId !== null;

export { useConstellationStore };
